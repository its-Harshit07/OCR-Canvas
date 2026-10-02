import os
import io
import sys
from typing import List, Dict, Any, Optional

# Ensure backend directory is in sys.path when running from project root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ocr_engine import process_uploaded_file
from pdf_exporter import export_document_to_pdf

app = FastAPI(
    title="Editable Image & PDF Editor API",
    description="Privacy-focused document OCR and editing API V1",
    version="1.0.0"
)

# Enable CORS for local dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "privacy_policy": "NO_PERSISTENT_STORAGE"}


@app.post("/api/process")
async def process_document(file: UploadFile = File(...)):
    """
    Process uploaded image or PDF document.
    Files are stored strictly in-memory during execution and discarded immediately.
    """
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    # Read file stream in memory
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file stream.")
        
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE // (1024*1024)} MB."
        )
        
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    try:
        # Process in memory / temporary context
        doc_model = process_uploaded_file(contents, filename)
        return doc_model
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Log generic error type without printing user document content
        print(f"Error processing file {filename}: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Failed to process document OCR/layout.")
    finally:
        # Guarantee byte buffer reference cleanup
        del contents


class PDFExportRequest(BaseModel):
    id: str
    name: str
    pages: List[Dict[str, Any]]


@app.post("/api/export/pdf")
async def export_pdf(doc_model: PDFExportRequest):
    """
    Reconstruct edited document back into a downloadable PDF stream.
    Does not save files to disk.
    """
    try:
        pdf_bytes = export_document_to_pdf(doc_model.model_dump())
        filename = os.path.splitext(doc_model.name)[0] + "_edited.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        print(f"Error exporting PDF: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF document.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
