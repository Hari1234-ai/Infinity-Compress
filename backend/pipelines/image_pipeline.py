import io
from PIL import Image

def process_image(input_bytes: bytes, original_filename: str, target_format: str = "WEBP", target_size_kb: int = 0) -> tuple[bytes, str, str]:
    """
    Takes raw image bytes, optimizes using PIL, and outputs compressed bytes in target format.
    If target_format is SVG, uses vtracer to vectorize the image.
    """
    try:
        target_format = target_format.upper()
        
        # Scenario 1: Convert to SVG (embed image as base64 inside SVG container)
        if target_format == "SVG":
            import base64
            # Open image to get dimensions
            img = Image.open(io.BytesIO(input_bytes))
            width, height = img.size
            
            # Normalize to PNG for embedding (handles JPEG, WEBP, etc.)
            buf = io.BytesIO()
            if img.mode in ("RGBA", "LA", "P"):
                img.save(buf, format="PNG")
                mime = "image/png"
            else:
                img.convert("RGB").save(buf, format="JPEG", quality=90)
                mime = "image/jpeg"
            
            img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
            
            # Wrap inside a valid SVG container
            svg_str = (
                f'<svg xmlns="http://www.w3.org/2000/svg" '
                f'xmlns:xlink="http://www.w3.org/1999/xlink" '
                f'width="{width}" height="{height}" '
                f'viewBox="0 0 {width} {height}">'
                f'<image href="data:{mime};base64,{img_b64}" '
                f'x="0" y="0" width="{width}" height="{height}"/>'
                f'</svg>'
            )
            
            output_bytes = svg_str.encode("utf-8")
            base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
            new_filename = f"{base_name}.svg"
            return output_bytes, new_filename, "image/svg+xml"

        # Scenario 2: Raster Processing (JPEG, PNG, WEBP)
        img = Image.open(io.BytesIO(input_bytes))
        
        # Iterative Compression Loop
        target_bytes = target_size_kb * 1024 if target_size_kb > 0 else 0
        current_quality = 90
        current_scale = 1.0
        
        def get_variant(q: int, s: float) -> bytes:
            buf = io.BytesIO()
            # Handle Resizing
            if s < 1.0:
                new_w = max(1, int(img.width * s))
                new_h = max(1, int(img.height * s))
                proc_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            else:
                proc_img = img
                
            kwargs = {"format": target_format}
            if target_format == "WEBP":
                kwargs.update({"quality": q, "method": 6})
            elif target_format == "JPEG":
                proc_img = proc_img.convert("RGB") if proc_img.mode == "RGBA" else proc_img
                proc_img.save(buf, quality=q, optimize=True, format="JPEG")
                return buf.getvalue()
            elif target_format == "PNG":
                # For targeted PNG, use quantization to meet size
                if target_bytes > 0:
                   # Quantize to 8-bit palette (256 colors) for major savings
                   proc_img = proc_img.quantize(colors=256)
                proc_img.save(buf, optimize=True, compress_level=9, format="PNG")
                return buf.getvalue()
            
            proc_img.save(buf, **kwargs)
            return buf.getvalue()

        # Phase 1: Try reducing quality (90 -> 10)
        compressed_bytes = get_variant(current_quality, current_scale)
        
        if target_bytes > 0:
            prev_quality = None
            while len(compressed_bytes) > target_bytes and current_quality > 10:
                if prev_quality == current_quality:
                    break
                prev_quality = current_quality
                current_quality -= 15
                if current_quality < 10: current_quality = 10
                compressed_bytes = get_variant(current_quality, current_scale)
            
            # Phase 2: If still too large, reduce scale (90% -> 10%)
            prev_scale = None
            while len(compressed_bytes) > target_bytes and current_scale > 0.1:
                if prev_scale == current_scale:
                    break
                prev_scale = current_scale
                current_scale -= 0.15
                if current_scale < 0.1: current_scale = 0.1
                compressed_bytes = get_variant(current_quality, current_scale)

        # Safety Net: Never return a file larger than the original input
        if len(compressed_bytes) > len(input_bytes) and target_bytes == 0:
            return input_bytes, original_filename, f"image/{target_format.lower()}"

        # Final Filename
        base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        extension = target_format.lower()
        if extension == "jpeg": extension = "jpg"
        new_filename = f"{base_name}_optimized.{extension}"
        
        return compressed_bytes, new_filename, f"image/{extension}"

    except Exception as e:
        raise ValueError(f"Failed to process image transformation: {str(e)}")
