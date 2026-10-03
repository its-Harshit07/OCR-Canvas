import os
os.environ["FLAGS_use_onednn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

import io
import uuid
import tempfile
import base64
from typing import List, Dict, Any, Tuple
from PIL import Image, ImageOps
import pymupdf as fitz
import numpy as np

# Ensure paddle is imported before torch C++ DLLs to prevent shm.dll conflicts on Windows
try:
    import paddle  # type: ignore
    paddle.set_flags({'FLAGS_use_onednn': False})
except Exception:
    pass

# Lazy load RapidOCR instance
_rapid_ocr_instance = None

def get_rapid_ocr():
    global _rapid_ocr_instance
    if _rapid_ocr_instance is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            # text_score=0.25, box_thresh=0.25, unclip_ratio=1.6 maximizes detection recall across all machine-printed text
            _rapid_ocr_instance = RapidOCR(text_score=0.25, box_thresh=0.25, unclip_ratio=1.6)
        except Exception as e:
            _rapid_ocr_instance = False
    return _rapid_ocr_instance

# Lazy load PaddleOCR instance to speed up startup
_paddle_ocr_instance = None

def get_paddle_ocr():
    global _paddle_ocr_instance
    if _paddle_ocr_instance is None:
        try:
            import paddle  # type: ignore
            try:
                paddle.set_flags({'FLAGS_use_onednn': False})
            except Exception:
                pass
            from paddleocr import PaddleOCR  # type: ignore
            # device='cpu'
            _paddle_ocr_instance = PaddleOCR(device='cpu')
        except Exception as e:
            # Silent fallback if PaddleOCR is not installed or supported
            _paddle_ocr_instance = False
    return _paddle_ocr_instance


def rgb_to_hex(rgb_tuple: Tuple[int, int, int]) -> str:
    """Convert RGB tuple to Hex string."""
    return f"#{rgb_tuple[0]:02x}{rgb_tuple[1]:02x}{rgb_tuple[2]:02x}"


def int_color_to_hex(color_int: int) -> str:
    """Convert PyMuPDF integer color to Hex string."""
    r = (color_int >> 16) & 0xFF
    g = (color_int >> 8) & 0xFF
    b = color_int & 0xFF
    return f"#{r:02x}{g:02x}{b:02x}"


def extract_local_background_color(img_np: np.ndarray, bbox: List[float]) -> str:
    """Sample pixels surrounding bbox to estimate dominant local background color."""
    try:
        h, w = img_np.shape[:2]
        x1 = max(0, int(bbox[0]))
        y1 = max(0, int(bbox[1]))
        x2 = min(w, int(bbox[0] + bbox[2]))
        y2 = min(h, int(bbox[1] + bbox[3]))
        
        pad = 6
        sx1 = max(0, x1 - pad)
        sy1 = max(0, y1 - pad)
        sx2 = min(w, x2 + pad)
        sy2 = min(h, y2 + pad)

        border_pixels = []
        if sy1 < y1:
            border_pixels.append(img_np[sy1:y1, sx1:sx2].reshape(-1, 3))
        if y2 < sy2:
            border_pixels.append(img_np[y2:sy2, sx1:sx2].reshape(-1, 3))
        if sx1 < x1:
            border_pixels.append(img_np[sy1:sy2, sx1:x1].reshape(-1, 3))
        if x2 < sx2:
            border_pixels.append(img_np[sy1:sy2, x2:sx2].reshape(-1, 3))

        if border_pixels:
            all_border = np.vstack(border_pixels)
            bg_rgb = np.median(all_border, axis=0).astype(int)
            return rgb_to_hex((int(bg_rgb[0]), int(bg_rgb[1]), int(bg_rgb[2])))
    except Exception:
        pass
    return "#ffffff"


def extract_dominant_text_color(img_np: np.ndarray, bbox: List[float], bg_hex: str = "#ffffff") -> str:
    """Sample text pixels inside bbox by filtering against background color."""
    try:
        h, w = img_np.shape[:2]
        x1 = max(0, int(bbox[0]))
        y1 = max(0, int(bbox[1]))
        x2 = min(w, int(bbox[0] + bbox[2]))
        y2 = min(h, int(bbox[1] + bbox[3]))
        
        if x2 <= x1 or y2 <= y1:
            return "#000000"
            
        crop = img_np[y1:y2, x1:x2]
        if crop.size == 0:
            return "#000000"
            
        crop_rgb = crop[:, :, :3] if len(crop.shape) == 3 and crop.shape[2] >= 3 else crop
        
        # Parse bg_hex
        bg_rgb = np.array([int(bg_hex[1:3], 16), int(bg_hex[3:5], 16), int(bg_hex[5:7], 16)])
        
        # Calculate color distance from background for each pixel in crop
        diffs = np.linalg.norm(crop_rgb.astype(float) - bg_rgb.astype(float), axis=2)
        
        # Select pixels with significant contrast from background
        high_contrast = diffs > 30.0
        if np.any(high_contrast):
            text_pixels = crop_rgb[high_contrast]
            # Take median text color among contrasting pixels
            med_rgb = np.median(text_pixels, axis=0).astype(int)
            return rgb_to_hex((int(med_rgb[0]), int(med_rgb[1]), int(med_rgb[2])))
        else:
            # Fallback to darkest pixels if contrast distance is low
            gray = np.mean(crop_rgb, axis=2)
            dark_mask = gray < np.median(gray)
            if np.any(dark_mask):
                dark_pixels = crop_rgb[dark_mask]
                avg_rgb = np.mean(dark_pixels, axis=0).astype(int)
                return rgb_to_hex((int(avg_rgb[0]), int(avg_rgb[1]), int(avg_rgb[2])))
    except Exception:
        pass
    return "#000000"


def restore_background_image(img_pil: Image.Image, elements: List[Dict[str, Any]], orig_format: str = "JPEG") -> str:
    """
    Remove detected OCR text bounding boxes from original image using localized
    OpenCV inpainting or local surrounding background reconstruction.
    Returns base64 data URL matching original format (JPEG or PNG).
    """
    is_png = (img_pil.mode in ("RGBA", "LA")) or (str(orig_format).upper() == "PNG")
    fmt = "PNG" if is_png else "JPEG"
    mime = "image/png" if is_png else "image/jpeg"

    if not elements:
        buffered = io.BytesIO()
        if fmt == "JPEG":
            if img_pil.mode != "RGB":
                img_pil = img_pil.convert("RGB")
            img_pil.save(buffered, format="JPEG", quality=95, subsampling=0)
        else:
            img_pil.save(buffered, format="PNG", optimize=True)
        return f"data:{mime};base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

    clean_img = img_pil.copy().convert("RGB")
    clean_np = np.array(clean_img)
    img_h, img_w = clean_np.shape[:2]

    # Attempt OpenCV Telea inpainting first for smooth texture/gradient preservation
    try:
        import cv2  # type: ignore
        mask = np.zeros((img_h, img_w), dtype=np.uint8)
        for el in elements:
            x = max(0, int(el.get("x", 0)))
            y = max(0, int(el.get("y", 0)))
            w = max(1, int(el.get("width", 10)))
            h = max(1, int(el.get("height", 10)))
            x2 = min(img_w, x + w)
            y2 = min(img_h, y + h)
            if x2 > x and y2 > y:
                cv2.rectangle(mask, (x, y), (x2, y2), 255, -1)
                
        inpainted = cv2.inpaint(clean_np, mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)
        clean_pil = Image.fromarray(inpainted)
    except Exception:
        # Fallback to local surrounding median pixel sampling
        for el in elements:
            x = max(0, int(el.get("x", 0)))
            y = max(0, int(el.get("y", 0)))
            w = max(1, int(el.get("width", 10)))
            h = max(1, int(el.get("height", 10)))
            x2 = min(img_w, x + w)
            y2 = min(img_h, y + h)

            if x2 <= x or y2 <= y:
                continue

            pad = 6
            sx1 = max(0, x - pad)
            sy1 = max(0, y - pad)
            sx2 = min(img_w, x2 + pad)
            sy2 = min(img_h, y2 + pad)

            border_pixels = []
            if sy1 < y:
                border_pixels.append(clean_np[sy1:y, sx1:sx2].reshape(-1, 3))
            if y2 < sy2:
                border_pixels.append(clean_np[y2:sy2, sx1:sx2].reshape(-1, 3))
            if sx1 < x:
                border_pixels.append(clean_np[sy1:sy2, sx1:x].reshape(-1, 3))
            if x2 < sx2:
                border_pixels.append(clean_np[sy1:sy2, x2:sx2].reshape(-1, 3))

            if border_pixels:
                all_border = np.vstack(border_pixels)
                bg_color = np.median(all_border, axis=0).astype(np.uint8)
            else:
                bg_color = np.array([255, 255, 255], dtype=np.uint8)

            clean_np[y:y2, x:x2] = bg_color

        clean_pil = Image.fromarray(clean_np)

    buffered = io.BytesIO()
    if fmt == "JPEG":
        if clean_pil.mode != "RGB":
            clean_pil = clean_pil.convert("RGB")
        clean_pil.save(buffered, format="JPEG", quality=95, subsampling=0)
    else:
        clean_pil.save(buffered, format="PNG", optimize=True)

    return f"data:{mime};base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")


def compute_box_iou(box1: List[float], box2: List[float]) -> float:
    """Compute Intersection over Union between two [x, y, w, h] boxes."""
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2
    
    inter_x1 = max(x1, x2)
    inter_y1 = max(y1, y2)
    inter_x2 = min(x1 + w1, x2 + w2)
    inter_y2 = min(y1 + h1, y2 + h2)
    
    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0
        
    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    area1 = w1 * h1
    area2 = w2 * h2
    union_area = area1 + area2 - inter_area
    
    return inter_area / union_area if union_area > 0 else 0.0


def merge_ocr_elements(elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merge overlapping OCR detections from multi-pass analysis using NMS & IoU."""
    if not elements:
        return []
        
    # Sort elements by area descending (largest bounding boxes evaluated first)
    sorted_elems = sorted(elements, key=lambda e: (e.get("width", 1) * e.get("height", 1)), reverse=True)
    merged: List[Dict[str, Any]] = []
    
    for elem in sorted_elems:
        box_e = [elem["x"], elem["y"], elem["width"], elem["height"]]
        is_duplicate = False
        
        for m in merged:
            box_m = [m["x"], m["y"], m["width"], m["height"]]
            iou = compute_box_iou(box_e, box_m)
            
            # Check if box centers are close
            cx_e, cy_e = elem["x"] + elem["width"] / 2.0, elem["y"] + elem["height"] / 2.0
            cx_m, cy_m = m["x"] + m["width"] / 2.0, m["y"] + m["height"] / 2.0
            center_dist = float(np.hypot(cx_e - cx_m, cy_e - cy_m))
            
            # Check if one box is substantially contained inside another
            v_overlap = max(0, min(elem["y"] + elem["height"], m["y"] + m["height"]) - max(elem["y"], m["y"]))
            min_h = min(elem["height"], m["height"])
            same_line = (v_overlap / min_h > 0.6) if min_h > 0 else False
            
            e_text_clean = elem["text"].strip().lower()
            m_text_clean = m["text"].strip().lower()
            is_sub = (e_text_clean in m_text_clean) or (m_text_clean in e_text_clean) if (e_text_clean and m_text_clean) else False
            
            if iou > 0.35 or (center_dist < 30 and is_sub) or (same_line and is_sub):
                is_duplicate = True
                # Always take the longer string representation
                if len(elem["text"].strip()) > len(m["text"].strip()):
                    m["text"] = elem["text"]
                    m["originalText"] = elem["originalText"]
                
                # TRUE Bounding Box UNION (min_x, min_y, max_x2, max_y2)
                x1 = min(m["x"], elem["x"])
                y1 = min(m["y"], elem["y"])
                x2 = max(m["x"] + m["width"], elem["x"] + elem["width"])
                y2 = max(m["y"] + m["height"], elem["y"] + elem["height"])
                
                m["x"] = round(x1, 2)
                m["y"] = round(y1, 2)
                m["width"] = round(x2 - x1, 2)
                m["height"] = round(y2 - y1, 2)
                m["originalX"] = m["x"]
                m["originalY"] = m["y"]
                m["originalWidth"] = m["width"]
                m["originalHeight"] = m["height"]
                m["fontSize"] = max(m["fontSize"], elem["fontSize"])
                break
                
        if not is_duplicate and elem["width"] >= 4 and elem["height"] >= 4:
            merged.append(elem)
            
    return merged


def group_adjacent_line_elements(elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group horizontally adjacent word/fragment boxes on the same line into a single line box."""
    if not elements:
        return []

    # Sort elements by y-coordinate (top to bottom), then x-coordinate (left to right)
    sorted_elems = sorted(elements, key=lambda e: (e["y"], e["x"]))
    grouped: List[Dict[str, Any]] = []
    visited = [False] * len(sorted_elems)

    for i in range(len(sorted_elems)):
        if visited[i]:
            continue

        current_line = [sorted_elems[i]]
        visited[i] = True

        for j in range(i + 1, len(sorted_elems)):
            if visited[j]:
                continue

            last = current_line[-1]
            cand = sorted_elems[j]

            # Check vertical alignment (same baseline)
            y_diff = abs(last["y"] - cand["y"])
            max_h = max(last["height"], cand["height"])
            same_baseline = y_diff < (max_h * 0.45)

            # Check horizontal distance between last element end and candidate start
            last_end_x = last["x"] + last["width"]
            gap_x = cand["x"] - last_end_x

            # Allow gap up to 2.2x font size/height for spaces between words in a line
            if same_baseline and (-5 <= gap_x <= max_h * 2.2):
                current_line.append(cand)
                visited[j] = True

        if len(current_line) == 1:
            grouped.append(current_line[0])
        else:
            # Union all elements in current_line
            min_x = min(e["x"] for e in current_line)
            min_y = min(e["y"] for e in current_line)
            max_x2 = max(e["x"] + e["width"] for e in current_line)
            max_y2 = max(e["y"] + e["height"] for e in current_line)

            combined_text = " ".join(e["text"].strip() for e in current_line if e["text"].strip())
            first_el = current_line[0]

            grouped.append({
                "id": f"elem-{uuid.uuid4().hex[:8]}",
                "type": "text",
                "text": combined_text,
                "originalText": combined_text,
                "x": round(min_x, 2),
                "y": round(min_y, 2),
                "width": round(max_x2 - min_x, 2),
                "height": round(max_y2 - min_y, 2),
                "originalX": round(min_x, 2),
                "originalY": round(min_y, 2),
                "originalWidth": round(max_x2 - min_x, 2),
                "originalHeight": round(max_y2 - min_y, 2),
                "fontSize": max(e["fontSize"] for e in current_line),
                "fontFamily": first_el.get("fontFamily", "Inter, Arial, sans-serif"),
                "fontWeight": first_el.get("fontWeight", "normal"),
                "fontStyle": first_el.get("fontStyle", "normal"),
                "color": first_el.get("color", "#000000"),
                "bgColor": first_el.get("bgColor", "#ffffff"),
                "rotation": 0,
                "confidence": round(sum(e.get("confidence", 0.9) for e in current_line) / len(current_line), 2)
            })

    return grouped



def process_image_with_ocr(img_pil: Image.Image, orig_format: str = "JPEG") -> Tuple[List[Dict[str, Any]], str, int, int]:
    """
    Run Multi-Pass OCR (RapidOCR Native -> RapidOCR Upscaled -> PaddleOCR)
    with intelligent NMS deduplication.
    Returns extracted text elements, base64 background string, raw count, and normalized count.
    """
    # Ensure RGB
    if img_pil.mode != "RGB":
        img_pil = img_pil.convert("RGB")
        
    width, height = img_pil.size
    img_np = np.array(img_pil)
    raw_elements = []
    
    rapid_ocr = get_rapid_ocr()
    
    # 1. Primary Pass: RapidOCR on native resolution image
    if rapid_ocr:
        try:
            results, elapse = rapid_ocr(img_np)
            if results:
                for item in results:
                    if not item or len(item) < 2:
                        continue
                    box = item[0]
                    text = item[1]
                    confidence = item[2] if len(item) > 2 else 0.9
                    
                    if not text or not str(text).strip():
                        continue
                    text_str = str(text).strip()
                    
                    min_x, min_y, w, h = 0, 0, 100, 30
                    if box is not None:
                        try:
                            box_arr = np.array(box)
                            if len(box_arr.shape) == 2:
                                xs = box_arr[:, 0]
                                ys = box_arr[:, 1]
                                min_x, max_x = float(np.min(xs)), float(np.max(xs))
                                min_y, max_y = float(np.min(ys)), float(np.max(ys))
                                w = max_x - min_x
                                h = max_y - min_y
                        except Exception:
                            pass
                    
                    font_size = max(12, int(h * 0.85))
                    bg_color = extract_local_background_color(img_np, [min_x, min_y, w, h])
                    color = extract_dominant_text_color(img_np, [min_x, min_y, w, h], bg_color)
                    
                    raw_elements.append({
                        "id": f"elem-{uuid.uuid4().hex[:8]}",
                        "type": "text",
                        "text": text_str,
                        "originalText": text_str,
                        "x": round(min_x, 2),
                        "y": round(min_y, 2),
                        "width": round(w, 2),
                        "height": round(h, 2),
                        "originalX": round(min_x, 2),
                        "originalY": round(min_y, 2),
                        "originalWidth": round(w, 2),
                        "originalHeight": round(h, 2),
                        "fontSize": font_size,
                        "fontFamily": "Inter, Arial, sans-serif",
                        "fontWeight": "normal",
                        "fontStyle": "normal",
                        "color": color,
                        "bgColor": bg_color,
                        "rotation": 0,
                        "confidence": round(float(confidence), 2)
                    })
        except Exception as e:
            print(f"RapidOCR primary pass notice: {e}")

    # 2. Secondary Pass: RapidOCR on 1.5x Upscaled Image for fine print / small text
    if rapid_ocr and (width < 2500 or height < 2500):
        try:
            scale_factor = 1.5
            up_w = int(width * scale_factor)
            up_h = int(height * scale_factor)
            up_img = img_pil.resize((up_w, up_h), Image.Resampling.LANCZOS)
            up_np = np.array(up_img)
            
            up_results, _ = rapid_ocr(up_np)
            if up_results:
                for item in up_results:
                    if not item or len(item) < 2:
                        continue
                    box = item[0]
                    text = item[1]
                    confidence = item[2] if len(item) > 2 else 0.85
                    
                    if not text or not str(text).strip():
                        continue
                    text_str = str(text).strip()
                    
                    if box is not None:
                        try:
                            box_arr = np.array(box) / scale_factor
                            xs = box_arr[:, 0]
                            ys = box_arr[:, 1]
                            min_x, max_x = float(np.min(xs)), float(np.max(xs))
                            min_y, max_y = float(np.min(ys)), float(np.max(ys))
                            w = max_x - min_x
                            h = max_y - min_y
                            
                            font_size = max(12, int(h * 0.85))
                            bg_color = extract_local_background_color(img_np, [min_x, min_y, w, h])
                            color = extract_dominant_text_color(img_np, [min_x, min_y, w, h], bg_color)
                            
                            raw_elements.append({
                                "id": f"elem-{uuid.uuid4().hex[:8]}",
                                "type": "text",
                                "text": text_str,
                                "originalText": text_str,
                                "x": round(min_x, 2),
                                "y": round(min_y, 2),
                                "width": round(w, 2),
                                "height": round(h, 2),
                                "originalX": round(min_x, 2),
                                "originalY": round(min_y, 2),
                                "originalWidth": round(w, 2),
                                "originalHeight": round(h, 2),
                                "fontSize": font_size,
                                "fontFamily": "Inter, Arial, sans-serif",
                                "fontWeight": "normal",
                                "fontStyle": "normal",
                                "color": color,
                                "bgColor": bg_color,
                                "rotation": 0,
                                "confidence": round(float(confidence), 2)
                            })
                        except Exception:
                            pass
        except Exception as e:
            print(f"RapidOCR upscaled pass notice: {e}")

    # 3. Tertiary Pass: PaddleOCR Integration for Maximum Text Recall
    paddle_ocr = get_paddle_ocr()
    if paddle_ocr:
        try:
            results = paddle_ocr.ocr(img_np)
            if results:
                items_to_process = []
                if isinstance(results, list):
                    for sub in results:
                        if isinstance(sub, list):
                            items_to_process.extend(sub)
                        else:
                            items_to_process.append(sub)
                elif isinstance(results, dict):
                    items_to_process.append(results)
                    
                for item in items_to_process:
                    box = None
                    text = ""
                    confidence = 0.9
                    if isinstance(item, dict):
                        text = item.get('rec_text') or item.get('text') or item.get('label', '')
                        confidence = item.get('rec_score') or item.get('score') or item.get('confidence', 0.9)
                        box = item.get('dt_polys') or item.get('box') or item.get('points') or item.get('bbox')
                    elif isinstance(item, (list, tuple)) and len(item) >= 2:
                        box = item[0]
                        text_data = item[1]
                        if isinstance(text_data, (list, tuple)):
                            text = text_data[0] if len(text_data) > 0 else ""
                            confidence = text_data[1] if len(text_data) > 1 else 0.9
                        elif isinstance(text_data, str):
                            text = text_data
                            
                    if not text or not str(text).strip():
                        continue
                        
                    text_str = str(text).strip()
                    min_x, min_y, w, h = 0, 0, 100, 30
                    
                    if box is not None:
                        try:
                            box_arr = np.array(box)
                            if len(box_arr.shape) == 2:
                                xs = box_arr[:, 0]
                                ys = box_arr[:, 1]
                                min_x, max_x = float(np.min(xs)), float(np.max(xs))
                                min_y, max_y = float(np.min(ys)), float(np.max(ys))
                                w = max_x - min_x
                                h = max_y - min_y
                        except Exception:
                            pass
                            
                    font_size = max(12, int(h * 0.85))
                    
                    # SANITY CHECK: Discard corrupt downscaled feature-map polygons (e.g. 30px width for 100 chars)
                    if len(text_str) > 5 and w < (len(text_str) * 3.0):
                        continue

                    bg_color = extract_local_background_color(img_np, [min_x, min_y, w, h])
                    color = extract_dominant_text_color(img_np, [min_x, min_y, w, h], bg_color)
                    
                    raw_elements.append({
                        "id": f"elem-{uuid.uuid4().hex[:8]}",
                        "type": "text",
                        "text": text_str,
                        "originalText": text_str,
                        "x": round(min_x, 2),
                        "y": round(min_y, 2),
                        "width": round(w, 2),
                        "height": round(h, 2),
                        "originalX": round(min_x, 2),
                        "originalY": round(min_y, 2),
                        "originalWidth": round(w, 2),
                        "originalHeight": round(h, 2),
                        "fontSize": font_size,
                        "fontFamily": "Inter, Arial, sans-serif",
                        "fontWeight": "normal",
                        "fontStyle": "normal",
                        "color": color,
                        "bgColor": bg_color,
                        "rotation": 0,
                        "confidence": round(float(confidence), 2)
                    })
        except Exception as e:
            print(f"PaddleOCR processing notice: {e}")

    # 4. Merge overlapping detections cleanly using NMS
    merged_elements = merge_ocr_elements(raw_elements)
    # 5. Group horizontally adjacent word/fragment elements into complete line boxes
    final_elements = group_adjacent_line_elements(merged_elements)

    is_png = (img_pil.mode in ("RGBA", "LA")) or (str(orig_format).upper() == "PNG")
    fmt = "PNG" if is_png else "JPEG"
    mime = "image/png" if is_png else "image/jpeg"

    buffered = io.BytesIO()
    if fmt == "JPEG":
        if img_pil.mode != "RGB":
            img_pil = img_pil.convert("RGB")
        img_pil.save(buffered, format="JPEG", quality=95, subsampling=0)
    else:
        img_pil.save(buffered, format="PNG", optimize=True)

    original_bg_base64 = f"data:{mime};base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")
    return final_elements, original_bg_base64, len(raw_elements), len(final_elements)


def process_pdf_document(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Process PDF bytes strictly without persisting to disk long-term.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_data = []
    doc_id = f"doc-{uuid.uuid4().hex[:10]}"
    total_raw = 0
    total_final = 0
    
    try:
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            rect = page.rect
            width, height = rect.width, rect.height
            
            # Extract text blocks dictionary from PDF native layer
            text_dict = page.get_text("dict")
            elements = []
            
            # Check if native text exists
            has_native_text = False
            if "blocks" in text_dict:
                for block in text_dict["blocks"]:
                    if block.get("type") == 0:  # Text block
                        for line in block.get("lines", []):
                            line_text = ""
                            line_bbox = list(line.get("bbox", [0, 0, 0, 0]))
                            font_size = 14
                            font_family = "Arial"
                            color_hex = "#000000"
                            is_bold = False
                            is_italic = False
                            
                            spans = line.get("spans", [])
                            if not spans:
                                continue
                                
                            has_native_text = True
                            line_text = "".join([span.get("text", "") for span in spans]).strip()
                            if not line_text:
                                continue
                                
                            # Take styling from first span
                            first_span = spans[0]
                            font_size = round(first_span.get("size", 14), 1)
                            font_name = first_span.get("font", "Arial")
                            color_int = first_span.get("color", 0)
                            color_hex = int_color_to_hex(color_int)
                            
                            flags = first_span.get("flags", 0)
                            if flags & 2:  # Italic
                                is_italic = True
                            if flags & 262144 or "bold" in font_name.lower():  # Bold
                                is_bold = True
                                
                            # Font family mapping
                            if "serif" in font_name.lower() or "times" in font_name.lower():
                                font_family = "Times New Roman, serif"
                            elif "mono" in font_name.lower() or "courier" in font_name.lower():
                                font_family = "Courier New, monospace"
                            else:
                                font_family = "Inter, Arial, sans-serif"
                                
                            x1, y1, x2, y2 = line_bbox
                            elements.append({
                                "id": f"elem-{uuid.uuid4().hex[:8]}",
                                "type": "text",
                                "text": line_text,
                                "originalText": line_text,
                                "x": round(x1, 2),
                                "y": round(y1, 2),
                                "width": round(x2 - x1, 2),
                                "height": round(y2 - y1, 2),
                                "originalX": round(x1, 2),
                                "originalY": round(y1, 2),
                                "originalWidth": round(x2 - x1, 2),
                                "originalHeight": round(y2 - y1, 2),
                                "fontSize": font_size,
                                "fontFamily": font_family,
                                "fontWeight": "bold" if is_bold else "normal",
                                "fontStyle": "italic" if is_italic else "normal",
                                "color": color_hex,
                                "rotation": 0,
                                "confidence": 1.0
                            })
                            
            # Render high-resolution page image for visual background canvas & small-font OCR precision
            pix = page.get_pixmap(dpi=220)
            img_pil = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            buffered = io.BytesIO()
            img_pil.save(buffered, format="JPEG", quality=95, subsampling=0)
            bg_base64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            raw_cnt = len(elements)
            final_cnt = len(elements)

            # For scanned PDFs or mixed PDFs with uncaptured raster text, run OCR on rendered page image
            ocr_elements, _, ocr_raw, ocr_final = process_image_with_ocr(img_pil, orig_format="JPEG")
            scale_x = width / pix.width
            scale_y = height / pix.height
            scaled_ocr = []
            for el in ocr_elements:
                scaled_el = dict(el)
                scaled_el["x"] = round(el["x"] * scale_x, 2)
                scaled_el["y"] = round(el["y"] * scale_y, 2)
                scaled_el["width"] = round(el["width"] * scale_x, 2)
                scaled_el["height"] = round(el["height"] * scale_y, 2)
                scaled_el["originalX"] = scaled_el["x"]
                scaled_el["originalY"] = scaled_el["y"]
                scaled_el["originalWidth"] = scaled_el["width"]
                scaled_el["originalHeight"] = scaled_el["height"]
                scaled_el["fontSize"] = round(el["fontSize"] * scale_y, 1)
                scaled_ocr.append(scaled_el)

            if not has_native_text or len(elements) == 0:
                elements = scaled_ocr
                raw_cnt = ocr_raw
                final_cnt = ocr_final
            else:
                # Merge native PDF text blocks with OCR image text blocks using spatial NMS deduplication
                all_combined = elements + scaled_ocr
                elements = merge_ocr_elements(all_combined)
                elements = group_adjacent_line_elements(elements)
                raw_cnt = len(all_combined)
                final_cnt = len(elements)
                
            total_raw += raw_cnt
            total_final += final_cnt

            pages_data.append({
                "id": f"{doc_id}-page-{page_idx}",
                "pageIndex": page_idx + 1,
                "width": round(width, 2),
                "height": round(height, 2),
                "backgroundImage": bg_base64,
                "mimeType": "image/jpeg",
                "elements": elements
            })
            
    finally:
        doc.close()
        
    return {
        "id": doc_id,
        "name": "Uploaded Document",
        "mimeType": "application/pdf",
        "raw_ocr_count": total_raw,
        "normalized_count": total_final,
        "pages": pages_data
    }


def process_uploaded_file(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Main processing entry point. Operates purely on memory bytes.
    Temporary files if required are purged immediately in finally blocks.
    """
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == ".pdf":
        doc_data = process_pdf_document(file_bytes)
        doc_data["name"] = filename
        return doc_data
    elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
        img_pil = Image.open(io.BytesIO(file_bytes))
        orig_format = "PNG" if ext == ".png" or img_pil.mode in ("RGBA", "LA") else "JPEG"
        orig_mime = "image/png" if orig_format == "PNG" else "image/jpeg"
        
        img_pil = ImageOps.exif_transpose(img_pil)
        width, height = img_pil.size
        elements, bg_base64, raw_cnt, final_cnt = process_image_with_ocr(img_pil, orig_format=orig_format)
        doc_id = f"doc-{uuid.uuid4().hex[:10]}"
        
        return {
            "id": doc_id,
            "name": filename,
            "mimeType": orig_mime,
            "raw_ocr_count": raw_cnt,
            "normalized_count": final_cnt,
            "pages": [{
                "id": f"{doc_id}-page-0",
                "pageIndex": 1,
                "width": width,
                "height": height,
                "backgroundImage": bg_base64,
                "mimeType": orig_mime,
                "elements": elements
            }]
        }
    else:
        raise ValueError(f"Unsupported file format: {ext}")

