"""
ORBIT AI — Phase 6: Course Materials Extractor.
Extracts text, code snippets, and page-aware metadata from course PDFs,
text files, markdown documents, and programming source files (.py, .cpp, .js).
Detects scanned/unreadable PDF pages and explains limitations honestly.
"""

import io
import re
from typing import List, Dict, Any, Optional
import pypdf

ALLOWED_EXTENSIONS = {"pdf", "txt", "md", "py", "cpp", "c", "js", "json", "html"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB limit


class CourseExtractor:
    """
    Extracts text and code snippets with page metadata and scan detection.
    """

    @classmethod
    def extract_material(cls, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Parses course materials. Returns structured metadata, pages, warnings,
        and extracted code snippets.
        """
        if not file_bytes:
            raise ValueError(f"Document '{filename}' is empty (0 bytes).")

        if len(file_bytes) > MAX_FILE_SIZE:
            raise ValueError(f"File '{filename}' exceeds {MAX_FILE_SIZE // (1024*1024)}MB size limit.")

        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported extension '.{ext}'. Supported: PDF, TXT, MD, PY, CPP, JS.")

        pages: List[Dict[str, Any]] = []
        snippets: List[Dict[str, Any]] = []
        warnings: List[str] = []
        total_chars = 0

        if ext == "pdf":
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                total_pages = len(reader.pages)
                if total_pages == 0:
                    raise ValueError(f"PDF document '{filename}' contains no pages.")

                unreadable_pages = []
                for idx, page in enumerate(reader.pages, start=1):
                    extracted = page.extract_text() or ""
                    cleaned = extracted.strip()

                    # Detect scanned/unreadable page (less than 20 chars of text)
                    if len(cleaned) < 20:
                        unreadable_pages.append(idx)
                        pages.append({
                            "page_number": idx,
                            "text": "",
                            "char_count": 0,
                            "is_unreadable": True,
                            "notice": f"Page {idx} contains no selectable text (scanned or image-only)."
                        })
                    else:
                        pages.append({
                            "page_number": idx,
                            "text": cleaned,
                            "char_count": len(cleaned),
                            "is_unreadable": False,
                            "notice": None
                        })
                        total_chars += len(cleaned)
                        # Extract code blocks from text
                        extracted_code = cls._extract_code_blocks(cleaned, f"Page {idx}")
                        snippets.extend(extracted_code)

                if unreadable_pages:
                    warnings.append(
                        f"Pages {unreadable_pages} contain scanned or image-only content with no selectable text. "
                        "OCR is not run silently; readable text pages were preserved."
                    )

                if total_chars == 0:
                    raise ValueError(
                        f"PDF '{filename}' contains no readable selectable text across all {total_pages} pages. "
                        "It appears to be entirely scanned or image-based."
                    )

            except Exception as e:
                if "no readable selectable text" in str(e) or "empty" in str(e):
                    raise
                raise ValueError(f"Failed to parse PDF '{filename}': {str(e)}")

        elif ext in ("txt", "md"):
            try:
                text_content = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                text_content = file_bytes.decode("latin-1", errors="replace")

            cleaned = text_content.strip()
            total_chars = len(cleaned)
            pages.append({
                "page_number": 1,
                "text": cleaned,
                "char_count": total_chars,
                "is_unreadable": False,
                "notice": None
            })
            snippets.extend(cls._extract_code_blocks(cleaned, filename))

        elif ext in ("py", "cpp", "c", "js"):
            # Direct code file upload
            try:
                code_text = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                code_text = file_bytes.decode("latin-1", errors="replace")

            cleaned = code_text.strip()
            total_chars = len(cleaned)
            lang_map = {"py": "python", "cpp": "cpp", "c": "cpp", "js": "javascript"}
            lang = lang_map.get(ext, "python")

            pages.append({
                "page_number": 1,
                "text": cleaned,
                "char_count": total_chars,
                "is_unreadable": False,
                "notice": None
            })

            snippets.append({
                "title": f"Full source: {filename}",
                "language": lang,
                "code": cleaned,
                "source_section": filename,
                "line_count": len(cleaned.splitlines())
            })

        return {
            "filename": filename,
            "extension": ext,
            "total_pages": len(pages),
            "total_chars": total_chars,
            "pages": pages,
            "snippets": snippets,
            "warnings": warnings
        }

    @classmethod
    def _extract_code_blocks(cls, text: str, source_label: str) -> List[Dict[str, Any]]:
        """
        Extracts fenced code blocks (```lang ... ```) from markdown or notes.
        """
        snippets = []
        pattern = re.compile(r"```([a-zA-Z0-9_\-\+]*)\n(.*?)```", re.DOTALL)
        matches = pattern.findall(text)

        for idx, (lang_tag, code_body) in enumerate(matches, start=1):
            clean_code = code_body.strip()
            if len(clean_code) < 10:
                continue

            lang = lang_tag.lower().strip()
            if not lang:
                # Infer language
                if "def " in clean_code or "import " in clean_code:
                    lang = "python"
                elif "#include" in clean_code or "std::" in clean_code or "cout" in clean_code:
                    lang = "cpp"
                elif "const " in clean_code or "function" in clean_code or "let " in clean_code:
                    lang = "javascript"
                else:
                    lang = "python"

            snippets.append({
                "title": f"Snippet {idx} ({source_label})",
                "language": lang,
                "code": clean_code,
                "source_section": source_label,
                "line_count": len(clean_code.splitlines())
            })

        return snippets
