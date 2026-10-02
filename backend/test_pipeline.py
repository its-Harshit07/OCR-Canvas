import os
import sys
from PIL import Image, ImageDraw, ImageFont
from ocr_engine import process_uploaded_file
from pdf_exporter import export_document_to_pdf

def run_tests():
    print("--- 1. Testing Image Processing ---")
    # Create sample image with text
    img = Image.new("RGB", (800, 400), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((100, 100), "Editable Document Test", fill=(0, 0, 0))
    draw.text((100, 200), "PaddleOCR Detection", fill=(30, 60, 200))
    
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    raw_img_data = img_bytes.getvalue()
    
    doc_model = process_uploaded_file(raw_img_data, "test_sample.png")
    print("Image Doc Model ID:", doc_model.get("id"))
    print("Page Count:", len(doc_model.get("pages", [])))
    print("Extracted Elements Count:", len(doc_model["pages"][0]["elements"]))
    for el in doc_model["pages"][0]["elements"]:
        print(f"  - Text: '{el['text']}' | BBox: [{el['x']}, {el['y']}, {el['width']}, {el['height']}] | Conf: {el['confidence']}")
        
    print("\n--- 2. Testing PDF Export ---")
    pdf_bytes = export_document_to_pdf(doc_model)
    print("PDF Export Bytes Length:", len(pdf_bytes))
    assert len(pdf_bytes) > 0, "Exported PDF bytes should be non-empty"
    print("SUCCESS: Image OCR and PDF export pipeline verified!")

if __name__ == "__main__":
    import io
    run_tests()
