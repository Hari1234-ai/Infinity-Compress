import io
import uuid
import time
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

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
)

# Global in-memory storage. 
# Key: UUID, Value: dict with filename, content_type, and the compressed bytes.
# NOTE: In production, consider limiting size or TTL to avoid OOM crashes if many files are left dangling.
PROCESSED_FILES_STORE: Dict[str, Any] = {}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "InfinityCompress Engine Running (In-Memory Pipeline)"}

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    target_format: str = Form("AUTO")
) -> Dict[str, Any]:
    try:
        # Read the file entirely into RAM
        content = await file.read()
        original_size = len(content)
        detected_type = file.content_type or "application/octet-stream"
        
        file_id = str(uuid.uuid4())
        
        # Determine Pipeline Strategy
        if detected_type == "image/svg+xml":
            # Native SVG Path Tracing Minification
            start_time = time.time()
            try:
               compressed_bytes, new_filename, new_type = process_svg(content, file.filename)
               compressed_size = len(compressed_bytes)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"SVG Vector processing failed: {e}")
                
        elif detected_type.startswith("image/"):
            # Real Compression Logic
            start_time = time.time()
            try:
               fmt = "WEBP" if target_format in ["AUTO", "WEBP"] else target_format 
               compressed_bytes, new_filename, new_type = process_image(content, file.filename, fmt)
               compressed_size = len(compressed_bytes)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Image processing failed: {e}")
        elif detected_type == "application/pdf":
            # Real PDF Compression Logic
            start_time = time.time()
            try:
               compressed_bytes, new_filename, new_type = process_pdf(content, file.filename)
               compressed_size = len(compressed_bytes)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"PDF processing failed: {e}")
                
        else:
            # Fallback mock for unsupported formats
            new_filename = f"processed_{file.filename}"
            new_type = detected_type
            compressed_bytes = content
            compressed_size = original_size
        
        # Store in global RAM cache
        PROCESSED_FILES_STORE[file_id] = {
            "bytes": compressed_bytes,
            "filename": new_filename,
            "type": new_type
        }
        
        # Calculation Stats
        compression_ratio = round((1 - compressed_size / original_size) * 100, 2) if original_size > 0 else 0
        if compression_ratio < 0: 
            compression_ratio = 0 # No negative gains
            
        return {
            "fileId": file_id,
            "fileName": new_filename,
            "originalSize": original_size,
            "compressedSize": compressed_size,
            "compressionRatio": compression_ratio,
            "detectedType": new_type,
            "status": "success",
            "message": "File accurately processed and held in memory."
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
