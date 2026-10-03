import io
import base64
from typing import Dict, Any
import pymupdf as fitz
from PIL import Image

def hex_to_rgb(hex_str: str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 6:
        return tuple(int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    return (0, 0, 0)

def export_document_to_pdf(doc_model: Dict[str, Any]) -> bytes:
    """
    Reconstruct multi-page vector/raster PDF from DocumentModel JSON.
    Returns PDF raw bytes for streaming back to client.
    """
    out_pdf = fitz.open()
    
    for page_data in doc_model.get("pages", []):
        width = float(page_data.get("width", 595))
        height = float(page_data.get("height", 842))
        
        pdf_page = out_pdf.new_page(width=width, height=height)
        
        # 1. Draw page background image if present
        bg_base64 = page_data.get("backgroundImage", "")
        if bg_base64 and bg_base64.startswith("data:image"):
            try:
                base64_data = bg_base64.split(",", 1)[1]
                img_bytes = base64.b64decode(base64_data)
                img_rect = fitz.Rect(0, 0, width, height)
                pdf_page.insert_image(img_rect, stream=img_bytes)
            except Exception as e:
                print(f"Error drawing background image in PDF export: {e}")
                
        # 2. Draw user-edited, deleted, or newly added text elements over background
        elements = page_data.get("elements", [])
        for el in elements:
            if el.get("type") != "text":
                continue
                
            orig_x = float(el.get("originalX", el.get("x", 0)))
            orig_y = float(el.get("originalY", el.get("y", 0)))
            orig_w = float(el.get("originalWidth", el.get("width", 100)))
            orig_h = float(el.get("originalHeight", el.get("height", 20)))
            
            x = float(el.get("x", 0))
            y = float(el.get("y", 0))
            w = float(el.get("width", 100))
            h = float(el.get("height", 20))
            
            is_moved = abs(x - orig_x) > 1 or abs(y - orig_y) > 1
            is_content_changed = el.get("text") != el.get("originalText")
            is_deleted = bool(el.get("isDeleted"))
            is_edited = bool(el.get("isEdited")) or bool(el.get("isNew")) or bool(el.get("isUserCreated")) or is_moved or is_content_changed or is_deleted
            
            if not is_edited:
                continue

            bg_color_hex = el.get("bgColor", "#ffffff")
            bg_color_rgb = hex_to_rgb(bg_color_hex)
            is_new = bool(el.get("isNew", False))

            # 1. Erase old text pixels at original coordinates using background color if element was edited, moved or deleted
            if is_edited and not is_new:
                orig_mask = fitz.Rect(orig_x, orig_y, orig_x + orig_w, orig_y + orig_h)
                pdf_page.draw_rect(orig_mask, color=bg_color_rgb, fill=bg_color_rgb)

            if is_deleted:
                continue

            text = el.get("text", "")
            if not text:
                continue
                
            font_size = float(el.get("fontSize") or max(10, orig_h * 0.85))
            color_hex = el.get("color", "#000000")
            font_weight = el.get("fontWeight", "normal")
            font_style = el.get("fontStyle", "normal")
            
            is_bold = font_weight in ("bold", "700", 700) or (isinstance(font_weight, int) and font_weight >= 700)
            is_italic = font_style == "italic"
            
            if is_bold and is_italic:
                font_name = "hebi"  # Helvetica-BoldOblique
            elif is_bold:
                font_name = "hebo"  # Helvetica-Bold
            elif is_italic:
                font_name = "heit"  # Helvetica-Oblique
            else:
                font_name = "helv"  # Helvetica
                
            color_rgb = hex_to_rgb(color_hex)

            # 2. Insert text cleanly over background image at canonical position matching Canvas baseline
            text_x = x + 2
            baseline_y = y + h * 0.85
            
            try:
                pdf_page.insert_text(
                    fitz.Point(text_x, baseline_y),
                    text,
                    fontsize=font_size,
                    fontname=font_name,
                    color=color_rgb
                )
            except Exception as e:
                print(f"Error inserting text '{text}' in PyMuPDF: {e}")
            
    pdf_bytes = out_pdf.write(deflate=True, garbage=4)
    out_pdf.close()
    return pdf_bytes
