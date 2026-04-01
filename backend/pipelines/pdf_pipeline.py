import fitz
import io

def process_pdf(input_bytes: bytes, original_filename: str) -> tuple[bytes, str, str]:
    """
    Optimizes a PDF document in memory using PyMuPDF (fitz).
    Removes unused objects, compresses streams, and deletes metadata.
    """
    try:
        # Load PDF from bytes
        doc = fitz.open("pdf", input_bytes)
        
        # Optimize PDF by saving it to a new memory buffer
        # garbage=4: Remove dead objects, merge duplicate images/fonts, clean tree
        # deflate=True: Compress all streams
        # clean=True: Clean up and sanitize syntax
        output_buffer = io.BytesIO()
        doc.save(
            output_buffer, 
            garbage=4, 
            deflate=True, 
            clean=True
        )
        doc.close()
        
        compressed_bytes = output_buffer.getvalue()
        
        # New filename
        base_name = original_filename.rsplit('.', 1)[0] if '.' in original_filename else original_filename
        new_filename = f"{base_name}_optimized.pdf"
        
        return compressed_bytes, new_filename, "application/pdf"

    except Exception as e:
        raise ValueError(f"Failed to process PDF: {str(e)}")
