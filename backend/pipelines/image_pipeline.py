import io
from PIL import Image

def process_image(input_bytes: bytes, original_filename: str, target_format: str = "WEBP") -> tuple[bytes, str, str]:
    """
    Takes raw image bytes, optimizes using PIL, and outputs compressed bytes in target format.
    Works entirely in RAM.
    """
    try:
        # Load image from bytes
        img = Image.open(io.BytesIO(input_bytes))
        
        # Preserve original mode as much as possible, only normalize if truly necessary
        # We don't want to convert a 1-bit or 8-bit image to 32-bit RGBA blindly
        pass
            
        output_buffer = io.BytesIO()
        
        target_format = target_format.upper()
        if target_format not in ["WEBP", "JPEG", "PNG"]:
            target_format = "WEBP"
            
        kwargs = {"format": target_format}
        if target_format == "WEBP":
            kwargs.update({"quality": 80, "method": 4})
        elif target_format == "JPEG":
            # JPEG doesn't support RGBA
            if img.mode == "RGBA":
                 img = img.convert("RGB")
            kwargs.update({"quality": 75, "optimize": True})
        elif target_format == "PNG":
            kwargs.update({"optimize": True, "compress_level": 9})
            # Ensure we don't bloat palette images if they are already efficient
            if img.mode == "RGBA" and target_format == "PNG":
                # Only keep RGBA if it has actual transparency
                pass
            
        img.save(output_buffer, **kwargs)
        
        compressed_bytes = output_buffer.getvalue()
        
        # New filename
        base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        extension = target_format.lower()
        if extension == "jpeg": extension = "jpg"
        new_filename = f"{base_name}_optimized.{extension}"
        
        return compressed_bytes, new_filename, f"image/{extension}"

    except Exception as e:
        # In case Pillow refuses to open the image (e.g., corrupted)
        raise ValueError(f"Failed to process image: {str(e)}")
