import io
import fitz
from scour import scour

def process_svg(input_bytes: bytes, original_filename: str, target_format: str = "SVG") -> tuple[bytes, str, str]:
    """
    Optimizes or converts SVG documents in memory.
    If target_format is SVG, performs minification.
    If target_format is raster (PNG/JPEG/WEBP), performs rendering.
    """
    try:
        target_format = target_format.upper()
        
        # Scenario 1: Optimization (SVG -> SVG)
        if target_format == "SVG":
            input_str = input_bytes.decode('utf-8')
            
            # Configure Scour Settings
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
            
            output_str = scour.scourString(input_str, options=options)
            compressed_bytes = output_str.encode('utf-8')
            
            base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
            new_filename = f"{base_name}_optimized.svg"
            return compressed_bytes, new_filename, "image/svg+xml"
            
        # Scenario 2: Render to Raster (SVG -> PNG/JPG)
        else:
            # Use PyMuPDF (fitz) to render SVG
            doc = fitz.open("svg", input_bytes)
            page = doc[0]
            # High quality scale
            zoom = 2 # 2x scale
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=(target_format == "PNG"))
            
            output_ext = target_format.lower()
            if output_ext == "jpeg": output_ext = "jpg"
            
            output_bytes = pix.tobytes(output_ext)
            
            base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
            new_filename = f"{base_name}_converted.{output_ext}"
            return output_bytes, new_filename, f"image/{output_ext}"

    except Exception as e:
        raise ValueError(f"Failed to process SVG transformation: {str(e)}")
