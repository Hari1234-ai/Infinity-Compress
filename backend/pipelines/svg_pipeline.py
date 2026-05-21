import io
import re
import base64
from PIL import Image
from scour import scour

def compress_embedded_images(svg_text: str, target_size_kb: int = 0) -> str:
    # Regex to find base64 data URLs in SVG
    pattern = r'(data:image/(?P<ext>png|jpeg|jpg|webp|gif);base64,(?P<data>[A-Za-z0-9+/=\s\n\r]+))'
    
    def replace_match(match):
        full_match = match.group(0)
        ext = match.group('ext').lower()
        data_str = match.group('data')
        
        # Clean the base64 string (remove whitespace/newlines)
        cleaned_data = re.sub(r'\s+', '', data_str)
        try:
            img_bytes = base64.b64decode(cleaned_data)
            
            # If the image is extremely small, skip it to avoid quality degradation
            if len(img_bytes) < 2048:
                return full_match
                
            img = Image.open(io.BytesIO(img_bytes))
            
            out_buf = io.BytesIO()
            save_format = img.format if img.format else ext.upper()
            if save_format == "JPG":
                save_format = "JPEG"
                
            if save_format == "PNG":
                # Quantize PNG to 8-bit palette (256 colors) for major savings
                if img.mode in ["RGBA", "RGB"]:
                    quantized = img.quantize(colors=256)
                    quantized.save(out_buf, format="PNG", optimize=True)
                else:
                    img.save(out_buf, format="PNG", optimize=True)
            elif save_format in ["JPEG", "WEBP"]:
                # Reduce quality to 80 for minimal perceptual quality loss
                quality = 80
                if target_size_kb > 0:
                    quality = 70  # More aggressive if target size is specified
                
                if img.mode == "RGBA" and save_format == "JPEG":
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    bg.paste(img, (0, 0), img)
                    bg.save(out_buf, format="JPEG", quality=quality, optimize=True)
                else:
                    img.save(out_buf, format=save_format, quality=quality, optimize=True)
            else:
                img.save(out_buf, format=save_format, optimize=True)
                
            compressed_bytes = out_buf.getvalue()
            
            # Only replace if the compressed version is actually smaller!
            if len(compressed_bytes) < len(img_bytes):
                new_base64 = base64.b64encode(compressed_bytes).decode('utf-8')
                return f"data:image/{ext};base64,{new_base64}"
            
            return full_match
        except Exception:
            return full_match

    return re.sub(pattern, replace_match, svg_text)


def process_svg(input_bytes: bytes, original_filename: str, target_format: str = "SVG", target_size_kb: int = 0) -> tuple[bytes, str, str]:
    """
    Optimizes or converts SVG documents in memory.
    If target_format is SVG, performs iterative minification with precision reduction.
    """
    try:
        target_format = target_format.upper()
        
        # Scenario 1: Optimization (SVG -> SVG)
        if target_format == "SVG":
            # Attempt decoding with utf-8, fallback with ignore
            try:
                input_str = input_bytes.decode('utf-8')
            except UnicodeDecodeError:
                input_str = input_bytes.decode('utf-8', errors='ignore')
                
            target_bytes = target_size_kb * 1024 if target_size_kb > 0 else 0
            
            # First, compress any embedded base64 images inside the SVG
            compressed_svg_str = compress_embedded_images(input_str, target_size_kb)
            
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
                output_str = scour.scourString(compressed_svg_str, options=options)
                return output_str.encode('utf-8')

            # Always start at precision 2 — aggressive by default for meaningful savings
            current_digits = 2
            compressed_bytes = get_minified(current_digits)
            
            if target_bytes > 0:
                # Still too large? Reduce precision further down to 1
                prev_digits = None
                while len(compressed_bytes) > target_bytes and current_digits > 1:
                    if prev_digits == current_digits:
                        break
                    prev_digits = current_digits
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
