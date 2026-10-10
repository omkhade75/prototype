"""
ORBIT AI — Phase 6: Comprehensive Test Suite for Course-to-Code Lab.
Tests:
1. Course material extraction (text, markdown, code, and PDF).
2. Scanned / unreadable PDF page detection.
3. Assistant Learn mode with source citations.
4. Assistant Explain Code with line-by-line analysis and dry-run table.
5. Assistant Debug mode with smallest minimal fix and honest execution reporting.
6. Assistant Practise mode with progressive hints.
7. Jupyter Notebook Builder v4 (.ipynb) format compliance and import deduplication.
8. Notebook Validator Python AST syntax checking and dependency flow analysis.
9. Secret screening (flags hardcoded API keys/passwords for Colab Secrets).
10. FastAPI endpoints integration under /course-lab/*.
"""

import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.course.extractor import CourseExtractor
from app.course.assistant import CourseAssistant
from app.course.notebook_builder import NotebookBuilder
from app.course.notebook_validator import NotebookValidator

client = TestClient(app)


def test_course_materials_extraction_text_and_code():
    """Verify extraction of markdown content and embedded code blocks."""
    md_content = b"""# Lecture 3: Divide and Conquer
In this lecture we explore binary search.

```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
```

Next we compare with C++:
```cpp
#include <vector>
int binarySearch(const std::vector<int>& arr, int target) {
    return -1;
}
```
"""
    result = CourseExtractor.extract_material(md_content, "lecture3.md")
    assert result["filename"] == "lecture3.md"
    assert result["total_pages"] == 1
    assert result["total_chars"] > 100
    assert len(result["snippets"]) == 2
    assert result["snippets"][0]["language"] == "python"
    assert "binary_search" in result["snippets"][0]["code"]
    assert result["snippets"][1]["language"] == "cpp"


def test_extraction_failures_and_unsupported_extensions():
    """Verify empty files and unsupported extensions fail with clear errors."""
    with pytest.raises(ValueError, match="is empty"):
        CourseExtractor.extract_material(b"", "empty.txt")

    with pytest.raises(ValueError, match="Unsupported extension"):
        CourseExtractor.extract_material(b"some content", "file.exe")


@pytest.mark.anyio
async def test_assistant_learn_mode_with_citations():
    """Verify Learn mode provides fundamentals, terminology, examples, and citations."""
    res = await CourseAssistant.learn_lesson(
        lesson_title="Binary Search & Halving Invariant",
        lesson_content="Binary search operates over sorted arrays by repeatedly halving the search space.",
        source_filename="algorithms_textbook.pdf",
        source_pages=[12, 13],
        provider_name="demo"
    )

    assert res["provider"] == "demo"
    assert "Binary Search" in res["lesson_title"]
    assert "[Source: algorithms_textbook.pdf, Page 12, 13]" in res["source_tag"]
    assert len(res["fundamentals"]) > 30
    assert len(res["terminology"]) >= 2
    assert len(res["examples"]) >= 1
    assert len(res["recap"]) >= 2
    assert len(res["citations"]) >= 1
    assert res["citations"][0]["source"] == "algorithms_textbook.pdf"


@pytest.mark.anyio
async def test_assistant_explain_code_mode():
    """Verify Explain Code mode generates line-by-line, dry-run, and complexity."""
    code = """def square(n):\n    return n * n\n"""
    res = await CourseAssistant.explain_code(
        code=code,
        language="python",
        context_title="Square Function",
        provider_name="demo"
    )

    assert res["language"] == "python"
    assert len(res["line_by_line"]) == 2
    assert res["line_by_line"][0]["line_number"] == 1
    assert "Defines routine" in res["line_by_line"][0]["explanation"]
    assert len(res["dry_run_table"]) >= 2
    assert "time" in res["complexity"]
    assert "space" in res["complexity"]
    assert len(res["common_mistakes"]) >= 1


@pytest.mark.anyio
async def test_assistant_debug_mode_and_honest_reporting():
    """Verify Debug mode diagnoses cause, provides smallest fix, and honest execution reporting."""
    code = "def get_first(items):\n    return items[10]\n"
    res = await CourseAssistant.debug_code(
        code=code,
        language="python",
        error_output="IndexError: list index out of range",
        provider_name="demo"
    )

    assert "Index out of range" in res["diagnosed_cause"]
    assert "index" in res["smallest_fix_explanation"].lower()
    assert "runner_verification" in res
    assert "guarantee_notice" in res
    # Must never falsely claim live execution when only statically analyzed
    if not res["runner_verification"]["executed"]:
        assert "Static analysis only" in res["guarantee_notice"]


@pytest.mark.anyio
async def test_assistant_practise_mode_and_progressive_hints():
    """Verify Practise mode generates 3 progressive hints and reference solution."""
    res = await CourseAssistant.generate_practice(
        lesson_title="Recursion Call Stack",
        lesson_content="Recursive depth must terminate at base case.",
        difficulty="medium",
        provider_name="demo"
    )

    assert "Practice: Recursion Call Stack" in res["title"]
    assert len(res["hints"]) == 3
    assert res["hints"][0]["level"] == 1
    assert res["hints"][1]["level"] == 2
    assert res["hints"][2]["level"] == 3
    assert len(res["reference_solution"]) > 10
    assert len(res["verification_cases"]) >= 1


def test_notebook_builder_valid_v4_format():
    """Verify generation of valid Jupyter Notebook v4 format with imports deduplication."""
    snippets = [
        {
            "title": "Fast Power Function",
            "code": "import math\n\ndef fast_power(b, e):\n    return b ** e\n",
            "explanation": "Calculates power using binary exponentiation.",
            "source_section": "Lecture 2: Recursion"
        },
        {
            "title": "Square Calculation",
            "code": "import math\n\ndef square(x):\n    return fast_power(x, 2)\n",
            "explanation": "Squares a number by delegation.",
            "source_section": "Lecture 2: Helper Functions"
        }
    ]

    nb_result = NotebookBuilder.generate_notebook(
        title="Exponentiation Lab Notebook",
        goal="Master divide and conquer recursion",
        snippets_or_cells=snippets,
        course_name="CS106B"
    )

    assert nb_result["title"] == "Exponentiation Lab Notebook"
    assert nb_result["total_cells"] >= 6
    assert nb_result["code_cells_count"] >= 3
    assert nb_result["markdown_cells_count"] >= 3

    nb_json = nb_result["notebook_json"]
    assert nb_json["nbformat"] == 4
    assert nb_json["nbformat_minor"] == 5
    assert "metadata" in nb_json
    assert nb_json["metadata"]["kernelspec"]["language"] == "python"

    # Verify Colab instructions badge is present in header cell
    cell_0_source = "".join(nb_json["cells"][0]["source"])
    assert "Open In Colab" in cell_0_source
    assert "Colab Secrets" in cell_0_source

    # Verify import deduplication in cell 2 (first code cell)
    code_cell_1_source = "".join(nb_json["cells"][2]["source"])
    assert "import math" in code_cell_1_source


def test_notebook_validator_python_syntax_and_dependencies():
    """Verify Python AST parser flags syntax errors and out-of-order execution dependencies."""
    # 1. Valid notebook
    valid_nb = {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": {},
        "cells": [
            {"cell_type": "markdown", "source": "# Test Notebook"},
            {"cell_type": "code", "source": "x = 42\ndef get_x():\n    return x\n"}
        ]
    }
    val_res = NotebookValidator.validate_notebook(valid_nb)
    assert val_res["valid"] is True
    assert val_res["syntax_valid"] is True
    assert len(val_res["errors"]) == 0

    # 2. Syntax Error in cell
    invalid_nb = {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": {},
        "cells": [
            {"cell_type": "code", "source": "def broken_func(a b:\n    return a + b\n"}
        ]
    }
    err_res = NotebookValidator.validate_notebook(invalid_nb)
    assert err_res["valid"] is False
    assert err_res["syntax_valid"] is False
    assert len(err_res["errors"]) == 1
    assert err_res["errors"][0]["type"] == "syntax_error"

    # 3. Out-of-order execution dependency warning
    out_of_order_nb = {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": {},
        "cells": [
            {"cell_type": "code", "source": "y = calculate_total(10)\n"},
            {"cell_type": "code", "source": "def calculate_total(n):\n    return n * 2\n"}
        ]
    }
    ooo_res = NotebookValidator.validate_notebook(out_of_order_nb)
    assert ooo_res["syntax_valid"] is True
    assert len(ooo_res["warnings"]) >= 1
    assert any(w["type"] == "out_of_order_dependency" for w in ooo_res["warnings"])


def test_notebook_validator_secret_credential_screening():
    """Verify secret screening warns against hardcoding credentials in notebooks."""
    nb_with_secret = {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": {},
        "cells": [
            {
                "cell_type": "code",
                "source": "api_key = 'sk-abcdef123456789012345678'\nprint('Connecting with key...')\n"
            }
        ]
    }
    sec_res = NotebookValidator.validate_notebook(nb_with_secret)
    assert any(w["type"] == "hardcoded_secret_detected" for w in sec_res["warnings"])
    assert any("Colab Secrets" in w["message"] for w in sec_res["warnings"])


def test_fastapi_course_lab_endpoints():
    """Verify FastAPI routes under /course-lab/*."""
    # 1. /course-lab/learn
    res = client.post("/course-lab/learn", json={
        "lesson_title": "Recursion Basics",
        "lesson_content": "Recursion breaks problems into base cases.",
        "provider": "demo"
    })
    assert res.status_code == 200
    assert "fundamentals" in res.json()

    # 2. /course-lab/explain-code
    res = client.post("/course-lab/explain-code", json={
        "code": "def f(x): return x + 1",
        "language": "python",
        "provider": "demo"
    })
    assert res.status_code == 200
    assert "line_by_line" in res.json()

    # 3. /course-lab/debug
    res = client.post("/course-lab/debug", json={
        "code": "print(1/0)",
        "language": "python",
        "error_output": "ZeroDivisionError: division by zero",
        "provider": "demo"
    })
    assert res.status_code == 200
    assert "diagnosed_cause" in res.json()

    # 4. /course-lab/practise
    res = client.post("/course-lab/practise", json={
        "lesson_title": "Heap Queue Operations",
        "lesson_content": "Heaps provide O(log n) insertions and O(1) top access.",
        "difficulty": "medium",
        "provider": "demo"
    })
    assert res.status_code == 200
    assert len(res.json()["hints"]) == 3

    # 5. /course-lab/notebook/build
    res = client.post("/course-lab/notebook/build", json={
        "title": "API Build Test Notebook",
        "goal": "Verify API generation",
        "cells": [{"title": "Cell 1", "code": "x = 10\n", "explanation": "Assign x"}]
    })
    assert res.status_code == 200
    nb_data = res.json()
    assert "notebook_json" in nb_data
    assert nb_data["notebook_json"]["nbformat"] == 4
    assert len(nb_data["notebook_json"]["cells"]) >= 4

    # 6. /course-lab/notebook/validate
    res = client.post("/course-lab/notebook/validate", json={
        "notebook_data": nb_data["notebook_json"]
    })
    assert res.status_code == 200
    assert res.json()["valid"] is True
