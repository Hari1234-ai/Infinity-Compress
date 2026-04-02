import io
from scour import scour

def process_svg(input_bytes: bytes, original_filename: str, target_format: str = "SVG", target_size_kb: int = 0) -> tuple[bytes, str, str]:
    """
    Optimizes or converts SVG documents in memory.
    If target_format is SVG, performs iterative minification with precision reduction.
    """
    try:
        target_format = target_format.upper()
        
        # Scenario 1: Optimization (SVG -> SVG)
        if target_format == "SVG":
            input_str = input_bytes.decode('utf-8')
            target_bytes = target_size_kb * 1024 if target_size_kb > 0 else 0
            
            def get_minified(digits: int) -> bytes:
                options = scour.sanitizeOptions()
                options.remove_metadata = True
                options.remove_descriptive_elements = True
                options.strip_comments = True
                options.enable_comment_stripping = True
                options.shorten_ids = True
                options.enable_id_stripping = True
                options.disable_simplify_pk = False
                options.strip_xml_prolog = True
                options.strip_xml_space_attribute = True
                options.indent_type = 'none'
                options.digits = digits  # Coordinate Precision
                output_str = scour.scourString(input_str, options=options)
                return output_str.encode('utf-8')

            # Always start at precision 2 — aggressive by default for meaningful savings
            current_digits = 2
            compressed_bytes = get_minified(current_digits)
            
            if target_bytes > 0:
                # Still too large? Reduce precision further down to 1
                while len(compressed_bytes) > target_bytes and current_digits > 1:
                    current_digits -= 1
                    compressed_bytes = get_minified(current_digits)

            # Safety Net: Never return a file larger than the original
            if len(compressed_bytes) >= len(input_bytes):
                return input_bytes, original_filename, "image/svg+xml"

            base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
            new_filename = f"{base_name}_optimized.svg"
            return compressed_bytes, new_filename, "image/svg+xml"
            
        # Scenario 2: Render to Raster (SVG -> PNG/JPG/WEBP)
        else:
            import cairosvg
            from PIL import Image
            
            output_ext = target_format.lower()
            if output_ext == "jpeg": output_ext = "jpg"
            
            # cairosvg renders SVG to PNG bytes with full color and transparency support
            png_bytes = cairosvg.svg2png(
                bytestring=input_bytes,
                scale=2.0,  # 2x for high-quality output
                background_color=None  # Keep transparency for compositing
            )
            
            # Open the PNG result with PIL for format conversion
            img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
            
            buf = io.BytesIO()
            if output_ext in ["jpg", "jpeg"]:
                # Composite onto white background (JPEG has no transparency)
                bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                bg.paste(img, (0, 0), img)
                final = bg.convert("RGB")
                final.save(buf, format="JPEG", quality=90, optimize=True)
            elif output_ext == "webp":
                img.save(buf, format="WEBP", quality=90, method=6)
            else:
                # PNG keeps full transparency
                img.save(buf, format="PNG", optimize=True)
                
            output_bytes = buf.getvalue()
            
            base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
            new_filename = f"{base_name}_converted.{output_ext}"
            return output_bytes, new_filename, f"image/{output_ext}"

    except Exception as e:
        raise ValueError(f"Failed to process SVG transformation: {str(e)}")
