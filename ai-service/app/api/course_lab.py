"""
ORBIT AI — Phase 6: FastAPI Endpoints for Course-to-Code Lab.
Provides material extraction, pedagogical assistant modes,
Jupyter Notebook generation, AST validation, and container execution.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.course.extractor import CourseExtractor
from app.course.assistant import CourseAssistant
from app.course.notebook_builder import NotebookBuilder
from app.course.notebook_validator import NotebookValidator

router = APIRouter(prefix="/course-lab", tags=["Course-to-Code Lab"])


class LearnRequest(BaseModel):
    lesson_title: str
    lesson_content: str
    source_filename: Optional[str] = None
    source_pages: Optional[List[int]] = None
    user_question: Optional[str] = None
    provider: Optional[str] = "demo"
    model: Optional[str] = None


class ExplainCodeRequest(BaseModel):
    code: str
    language: Optional[str] = "python"
    context_title: Optional[str] = None
    provider: Optional[str] = "demo"
    model: Optional[str] = None


class DebugRequest(BaseModel):
    code: str
    language: Optional[str] = "python"
    error_output: Optional[str] = None
    test_input: Optional[str] = None
    provider: Optional[str] = "demo"
    model: Optional[str] = None


class PractiseRequest(BaseModel):
    lesson_title: str
    lesson_content: str
    difficulty: Optional[str] = "medium"
    provider: Optional[str] = "demo"


class NotebookBuildRequest(BaseModel):
    title: str
    goal: str
    cells: List[Dict[str, Any]]
    course_name: Optional[str] = None
    author: Optional[str] = "ORBIT AI Course-to-Code Lab"
    dependencies: Optional[List[str]] = None


class NotebookValidateRequest(BaseModel):
    notebook_data: Any
    execute_cells: Optional[bool] = False


@router.post("/extract")
async def extract_material(file: UploadFile = File(...)):
    """
    Extracts text, pages, code snippets, and scans detection from uploaded PDF or code/text.
    """
    try:
        content = await file.read()
        return CourseExtractor.extract_material(content, file.filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process material: {str(e)}")


@router.post("/learn")
async def learn_lesson(req: LearnRequest):
    """
    Explains lesson fundamentals, terminology, examples, and verifiable source citations.
    """
    return await CourseAssistant.learn_lesson(
        lesson_title=req.lesson_title,
        lesson_content=req.lesson_content,
        source_filename=req.source_filename,
        source_pages=req.source_pages,
        user_question=req.user_question,
        provider_name=req.provider,
        model_name=req.model
    )


@router.post("/explain-code")
async def explain_code(req: ExplainCodeRequest):
    """
    Generates step-by-step code explanation, line-by-line breakdown, dry-run table, and complexity.
    """
    return await CourseAssistant.explain_code(
        code=req.code,
        language=req.language or "python",
        context_title=req.context_title,
        provider_name=req.provider,
        model_name=req.model
    )


@router.post("/debug")
async def debug_code(req: DebugRequest):
    """
    Diagnoses code errors, provides smallest useful fix, and runs Docker verification if available.
    """
    return await CourseAssistant.debug_code(
        code=req.code,
        language=req.language or "python",
        error_output=req.error_output,
        test_input=req.test_input,
        provider_name=req.provider,
        model_name=req.model
    )


@router.post("/practise")
async def generate_practise(req: PractiseRequest):
    """
    Generates lesson-grounded exercise with 3 progressive hints and verification test cases.
    """
    return await CourseAssistant.generate_practice(
        lesson_title=req.lesson_title,
        lesson_content=req.lesson_content,
        difficulty=req.difficulty or "medium",
        provider_name=req.provider
    )


@router.post("/notebook/build")
def build_notebook(req: NotebookBuildRequest):
    """
    Builds a compliant Jupyter Notebook v4 JSON with learning objectives,
    ordered cells, import deduplication, and Colab compatibility.
    """
    return NotebookBuilder.generate_notebook(
        title=req.title,
        goal=req.goal,
        snippets_or_cells=req.cells,
        course_name=req.course_name,
        author=req.author,
        dependencies=req.dependencies
    )


@router.post("/notebook/validate")
def validate_notebook(req: NotebookValidateRequest):
    """
    Validates Jupyter Notebook JSON schema, Python AST syntax,
    dependency ordering, credentials, and optional isolated container execution.
    """
    return NotebookValidator.validate_notebook(
        notebook_data=req.notebook_data,
        execute_cells=req.execute_cells or False
    )
