# OCRCanvas

> A privacy-first OCR document editor for images and PDFs.

OCRCanvas lets users upload machine-generated documents, detect text,
edit detected text directly on the document, reposition and resize
elements, and export the result while preserving the original document
as the visual source of truth.

## Features

-   Image and multi-page PDF support
-   OCR-powered editing of computer-written text
-   Interactive red OCR hitboxes
-   Real-time text editing
-   X/Y/W/H positioning and sizing controls
-   Undo / redo
-   Zoom and free canvas panning
-   Responsive desktop and mobile editor
-   PNG and PDF export
-   Multi-file processing
-   Source-coordinate architecture independent of viewport zoom
-   Privacy-first, non-persistent document-processing design
-   Adaptive export optimization to avoid unnecessary file-size
    inflation

## Privacy

OCRCanvas is designed around processing uploaded documents without
persistent document storage.

The application does not require users to maintain a permanent document
library. Deployment-specific privacy claims should always be verified
against the actual production configuration.

## User Responsibility & Usage Notice

OCRCanvas is an editing utility. Any document uploaded, edited,
modified, exported, submitted, or shared using the application is the
user's responsibility.

Users are responsible for having the necessary rights or authorization
to upload and edit documents. The tool must not be used to falsify,
fraudulently alter, or misrepresent documents.

Use particular caution with sensitive or confidential material,
including:

-   Bank and financial details
-   Examination results and academic records
-   Identity documents and certificates
-   Employment records
-   Medical documents
-   Legal documents
-   Documents containing personal information

Users should carefully review edited documents against the original
before relying on, submitting, printing, or sharing them.

### OCR limitations

OCRCanvas is designed primarily for **digitally generated /
computer-written text**.

-   Handwritten text is not a reliable OCR use case.
-   OCR may miss text or produce imperfect bounding boxes.
-   Formatting, fonts, spacing, and layout may not always be reproduced
    perfectly.
-   OCR is currently optimized primarily for **English-language
    documents**.
-   Other languages, scripts, and mixed-language documents may have
    lower recognition accuracy.

## Architecture

OCRCanvas separates the original document from editable OCR metadata.

``` text
Original Image / PDF Page
          |
          v
   Immutable Visual Source
          |
          +----------------+
          |                |
          v                v
      OCR Metadata      Editor State
          |                |
          |                +-- position
          |                +-- size
          +-- text         +-- typography
          +-- x/y          +-- edit history
          +-- width/height
          |
          v
      Export Pipeline
        +-------+
        | PNG   |
        | PDF   |
        +-------+
```

Canonical document coordinates remain independent from display zoom,
panning, and responsive layout. This prevents viewport changes from
changing document geometry or causing OCR alignment drift.

## Technology

Core technologies include:

-   React / TypeScript
-   Vite
-   Python
-   FastAPI
-   RapidOCR / ONNX-based OCR
-   PDF and image processing libraries

Exact dependency versions should be taken from the repository's package
manifests and lockfiles.

## Running Locally

### Frontend

``` bash
npm install
npm run dev
```

### Backend

Create and activate a Python virtual environment:

``` bash
python -m venv .venv
```

Windows:

``` bash
.venv\Scripts\activate
```

macOS/Linux:

``` bash
source .venv/bin/activate
```

Install the backend dependencies from the project's dependency file and
start the FastAPI application using the repository's configured
development command.

Create a local `.env` from `.env.example` if provided.

Never commit secrets or private deployment credentials.

## Export Design

Exports use the canonical source-resolution document rather than taking
a screenshot of the visible viewport.

Therefore:

-   Canvas zoom does not increase export resolution.
-   Device pixel ratio should not unexpectedly upscale exports.
-   Source dimensions are preserved.
-   PNG uses lossless encoding where appropriate.
-   JPEG-compatible workflows avoid unnecessary repeated recompression
    where possible.
-   PDF export avoids unnecessary raster/resource duplication.
-   Optimization focuses on removing encoding overhead rather than
    simply reducing visual quality.

## Responsive Design

The editor supports desktop and mobile layouts.

On smaller screens:

-   The document canvas receives most of the available viewport.
-   The page/file panel can be collapsed.
-   Editing controls remain accessible through the mobile toolbar.
-   X/Y/W/H controls remain available.
-   Zoom and pan remain independent of document coordinates.

Representative viewport targets:

``` text
375 × 812
390 × 844
412 × 915
768 × 1024
1366 × 768
1920 × 1080
```

## Engineering Principles

1.  The original document is the visual source of truth.
2.  OCR metadata is separate from original pixels.
3.  Source coordinates never change because of zoom or responsive
    layout.
4.  Export resolution is independent of viewport resolution.
5.  Temporary editing layers must not become permanent duplicate text.
6.  Document processing must not introduce persistent uploaded-file
    storage.
7.  Production fixes should be verified through actual UI behavior, not
    code inspection alone.

## Security & Privacy Checklist

Before deployment:

-   Configure production environment variables correctly.
-   Verify upload-size limits.
-   Verify temporary files are cleaned up.
-   Verify uploaded documents are not written to persistent storage.
-   Review logs for accidental document or OCR-content leakage.
-   Keep secrets out of source control.
-   Protect document-processing endpoints with the application's consent
    requirement.
-   Test production PDF and PNG export separately from local
    development.


## Project Status

OCRCanvas is an actively developed OCR document editing project focused
on:

**OCR → Edit → Position → Review → Export**

with privacy, document alignment, responsive editing, and export
fidelity treated as core requirements.
