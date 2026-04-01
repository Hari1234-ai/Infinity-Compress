import io
from PIL import Image

def process_image(input_bytes: bytes, original_filename: str, target_format: str = "WEBP", target_size_kb: int = 0) -> tuple[bytes, str, str]:
    """
    Takes raw image bytes, optimizes using PIL, and outputs compressed bytes in target format.
    If target_size_kb is specified, it iteratively reduces quality to meet the target.
    """
    try:
        # Load image from bytes
        img = Image.open(io.BytesIO(input_bytes))
        
        # Preserve original mode as much as possible, only normalize if truly necessary
        pass
        
        target_format = target_format.upper()
        if target_format not in ["WEBP", "JPEG", "PNG"]:
            target_format = "WEBP"
            
        def get_compressed(q: int) -> bytes:
            buf = io.BytesIO()
            kwargs = {"format": target_format}
            if target_format == "WEBP":
                kwargs.update({"quality": q, "method": 6})
            elif target_format == "JPEG":
                # Ensure JPEG mode is RGB
                img_to_save = img.convert("RGB") if img.mode == "RGBA" else img
                img_to_save.save(buf, quality=q, optimize=True, format="JPEG")
                return buf.getvalue()
            elif target_format == "PNG":
                # PNG quality is not adjustable like JPEG/WEBP, it's lossless
                # but we can try to optimize more (though it might still be large)
                img.save(buf, optimize=True, compress_level=9, format="PNG")
                return buf.getvalue()
            
            img.save(buf, **kwargs)
            return buf.getvalue()

        # Iterative Compression Loop
        current_quality = 90
        compressed_bytes = get_compressed(current_quality)
        
        if target_size_kb > 0:
            target_bytes = target_size_kb * 1024
            # Keep reducing quality until size is met or quality hits floor
            while len(compressed_bytes) > target_bytes and current_quality > 10:
                current_quality -= 10
                if current_quality < 10: current_quality = 10
                compressed_bytes = get_compressed(current_quality)
                if current_quality == 10: break

        # New filename
        base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        extension = target_format.lower()
        if extension == "jpeg": extension = "jpg"
        new_filename = f"{base_name}_optimized.{extension}"
        
        return compressed_bytes, new_filename, f"image/{extension}"

    except Exception as e:
        raise ValueError(f"Failed to process image: {str(e)}")

    except Exception as e:
        # In case Pillow refuses to open the image (e.g., corrupted)
        raise ValueError(f"Failed to process image: {str(e)}")
