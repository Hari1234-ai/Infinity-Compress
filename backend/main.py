import io
import uuid
import time
import zipfile
import gc
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from typing import Dict, Any, List

from pipelines.image_pipeline import process_image
from pipelines.pdf_pipeline import process_pdf
from pipelines.svg_pipeline import process_svg

app = FastAPI(title="InfinityCompress API - In-Memory Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global in-memory storage.
PROCESSED_FILES_STORE: Dict[str, Any] = {}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "InfinityCompress Engine Running (In-Memory Pipeline)"}

def _process_single(content: bytes, filename: str, content_type: str, mode: str, target_format: str, target_size_kb: int):
    """Core processing logic for a single file. Returns (compressed_bytes, new_filename, new_type)."""
    is_svg = content_type == "image/svg+xml" or filename.lower().endswith(".svg")
    original_size = len(content)

    if is_svg:
        fmt = "SVG" if (mode == "COMPRESS" or target_format == "AUTO") else target_format
        compressed_bytes, new_filename, new_type = process_svg(content, filename, fmt, target_size_kb)

    elif content_type.startswith("image/"):
        if mode == "COMPRESS":
            fmt = content_type.split('/')[-1].upper()
            if fmt == "JPG": fmt = "JPEG"
            if fmt not in ["JPEG", "PNG", "WEBP"]: fmt = "WEBP"
        else:
            fmt = "WEBP" if target_format == "AUTO" else target_format
        compressed_bytes, new_filename, new_type = process_image(content, filename, fmt, target_size_kb)

    elif content_type == "application/pdf":
        compressed_bytes, new_filename, new_type = process_pdf(content, filename)

    else:
        compressed_bytes, new_filename, new_type = content, f"processed_{filename}", content_type

    # Safety net: only revert to original if COMPRESSING and result is larger
    if mode == "COMPRESS" and len(compressed_bytes) > original_size:
        compressed_bytes = content
        new_filename = filename
        new_type = content_type

    return compressed_bytes, new_filename, new_type


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    mode: str = Form("COMPRESS"),
    target_format: str = Form("AUTO"),
    target_size_kb: int = Form(0)
) -> Dict[str, Any]:
    try:
        content = await file.read()
        original_size = len(content)
        detected_type = file.content_type or "application/octet-stream"
        file_id = str(uuid.uuid4())

        compressed_bytes, new_filename, new_type = await run_in_threadpool(
            _process_single, content, file.filename, detected_type, mode, target_format, target_size_kb
        )
        compressed_size = len(compressed_bytes)

        PROCESSED_FILES_STORE[file_id] = {
            "bytes": compressed_bytes,
            "filename": new_filename,
            "type": new_type
        }

        compression_ratio = round((1 - compressed_size / original_size) * 100, 2) if original_size > 0 else 0
        if compression_ratio < 0: compression_ratio = 0

        return {
            "fileId": file_id,
            "fileName": new_filename,
            "originalSize": original_size,
            "compressedSize": compressed_size,
            "compressionRatio": compression_ratio,
            "detectedType": new_type,
            "mode": mode,
            "status": "success",
            "message": "File accurately processed and held in memory."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-batch")
async def upload_batch(
    files: List[UploadFile] = File(...),
    mode: str = Form("COMPRESS"),
    target_format: str = Form("AUTO"),
    target_size_kb: int = Form(0),
    batch_id: str = Form("")
) -> Dict[str, Any]:
    """Processes up to 20 files and stores them as a ZIP in memory."""
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per batch.")
    
    try:
        zip_buffer = io.BytesIO()
        success_count = 0
        total_original = 0
        total_compressed = 0
        file_results = []

        if batch_id:
            PROCESSED_FILES_STORE[f"progress_{batch_id}"] = {"done": 0, "total": len(files)}

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for upload_file in files:
                try:
                    content = await upload_file.read()
                    detected_type = upload_file.content_type or "application/octet-stream"
                    original_size = len(content)
                    total_original += original_size

                    compressed_bytes, new_filename, new_type = await run_in_threadpool(
                        _process_single, content, upload_file.filename, detected_type, mode, target_format, target_size_kb
                    )

                    compressed_size = len(compressed_bytes)
                    total_compressed += compressed_size
                    zf.writestr(new_filename, compressed_bytes)
                    success_count += 1
                    file_results.append({
                        "originalName": upload_file.filename,
                        "newName": new_filename,
                        "originalSize": original_size,
                        "compressedSize": compressed_size,
                        "status": "success"
                    })
                    
                    if batch_id:
                        PROCESSED_FILES_STORE[f"progress_{batch_id}"]["done"] = success_count
                    
                    # Prevent memory bloat on free tier
                    del content
                    del compressed_bytes
                    gc.collect()
                except Exception as e:
                    file_results.append({
                        "originalName": upload_file.filename,
                        "status": "failed",
                        "error": str(e)
                    })

        zip_bytes = zip_buffer.getvalue()
        batch_id = str(uuid.uuid4())

        PROCESSED_FILES_STORE[batch_id] = {
            "bytes": zip_bytes,
            "filename": "infinitycompress_batch.zip",
            "type": "application/zip"
        }

        compression_ratio = round((1 - total_compressed / total_original) * 100, 2) if total_original > 0 else 0

        return {
            "batchId": batch_id,
            "fileCount": len(files),
            "successCount": success_count,
            "totalOriginalSize": total_original,
            "totalCompressedSize": total_compressed,
            "compressionRatio": max(0, compression_ratio),
            "mode": mode,
            "files": file_results,
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download/{file_id}")
async def download_file(file_id: str):
    record = PROCESSED_FILES_STORE.get(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File expired or not found in RAM")
        
    return StreamingResponse(
        io.BytesIO(record["bytes"]), 
        media_type=record["type"],
        headers={
            "Content-Disposition": f'attachment; filename="{record["filename"]}"'
        }
    )

@app.get("/api/progress/{batch_id}")
async def get_progress(batch_id: str):
    progress = PROCESSED_FILES_STORE.get(f"progress_{batch_id}")
    if not progress:
        return {"done": 0, "total": 0}
    return progress
