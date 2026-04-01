import io
from PIL import Image
import vtracer

def process_image(input_bytes: bytes, original_filename: str, target_format: str = "WEBP", target_size_kb: int = 0) -> tuple[bytes, str, str]:
    """
    Takes raw image bytes, optimizes using PIL, and outputs compressed bytes in target format.
    If target_format is SVG, uses vtracer to vectorize the image.
    """
    try:
        target_format = target_format.upper()
        
        # Scenario 1: Vectorization (Raster -> SVG)
        if target_format == "SVG":
            # Direct byte-to-byte vectorization
            svg_str = vtracer.convert_image_to_svg_py(
                input_bytes,
                colormode='color',
                hierarchical='stacked',
                mode='spline',
                filter_speckle=4,
                color_precision=6,
                layer_difference=16,
                corner_threshold=60,
                length_threshold=4.0,
                max_iterations=10,
                splice_threshold=45,
                path_precision=3
            )
            
            output_bytes = svg_str.encode('utf-8')
            base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
            new_filename = f"{base_name}_vectorized.svg"
            return output_bytes, new_filename, "image/svg+xml"

        # Scenario 2: Raster Processing (JPEG, PNG, WEBP)
        img = Image.open(io.BytesIO(input_bytes))
        
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
                img.save(buf, optimize=True, compress_level=9, format="PNG")
                return buf.getvalue()
            
            img.save(buf, **kwargs)
            return buf.getvalue()

        # Iterative Compression Loop
        current_quality = 90
        compressed_bytes = get_compressed(current_quality)
        
        if target_size_kb > 0:
            target_bytes = target_size_kb * 1024
            while len(compressed_bytes) > target_bytes and current_quality > 10:
                current_quality -= 10
                if current_quality < 10: current_quality = 10
                compressed_bytes = get_compressed(current_quality)

        # New filename
        base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        extension = target_format.lower()
        if extension == "jpeg": extension = "jpg"
        new_filename = f"{base_name}_optimized.{extension}"
        
        return compressed_bytes, new_filename, f"image/{extension}"

    except Exception as e:
        raise ValueError(f"Failed to process image transformation: {str(e)}")
