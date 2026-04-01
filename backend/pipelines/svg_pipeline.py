import io
from scour import scour

def process_svg(input_bytes: bytes, original_filename: str) -> tuple[bytes, str, str]:
    """
    Optimizes SVG documents in memory using Scour.
    Removes unused elements, metadata, comments, and standardizes properties without quality loss.
    """
    try:
        # Decode raw bytes into SVG string
        input_str = input_bytes.decode('utf-8')
        
        # Configure Scour Settings for maximum compression
        options = scour.sanitizeOptions()
        options.remove_metadata = True
        options.remove_descriptive_elements = True
        options.strip_comments = True
        options.enable_comment_stripping = True
        options.shorten_ids = True
        options.enable_id_stripping = True
        options.indent_type = 'none' # Minify (remove spacing/newlines)
        
        # Minify the SVG text in RAM
        output_str = scour.scourString(input_str, options=options)
        
        # Encode back to transmittable bytes
        compressed_bytes = output_str.encode('utf-8')
        
        # Generate final file metadata
        base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        new_filename = f"{base_name}_optimized.svg"
        
        return compressed_bytes, new_filename, "image/svg+xml"

    except Exception as e:
        raise ValueError(f"Failed to collapse SVG footprint: {str(e)}")
