"""
FastAPI router for Coding Playground: DSA topics, LeetCode catalogue, and AI tutor.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.coding.catalog import get_all_topics, get_topic_by_id, get_all_problems, get_problem_by_id
from app.coding.tutor import CodingTutor
from app.coding.runner import CodeRunner
from app.coding.lesson_generator import LessonGenerator

router = APIRouter()

class RunCodeRequest(BaseModel):
    language: str = "cpp"  # 'cpp', 'python'
    code: str
    problem_id: Optional[str] = None
    custom_input: Optional[str] = None
    test_cases: Optional[List[Dict[str, Any]]] = None

class TutorRequest(BaseModel):
    mode: str = "learn"  # 'learn', 'build', 'debug', 'practice'
    language: str = "cpp"  # 'cpp', 'python'
    problem_id: Optional[str] = None
    topic_id: Optional[str] = None
    student_code: Optional[str] = None
    user_query: Optional[str] = None
    knowledge_passages: Optional[List[Dict[str, Any]]] = None
    provider: Optional[str] = None

class AnalyzeDocumentTopicsRequest(BaseModel):
    chunks: List[Dict[str, Any]]
    filename: Optional[str] = "Uploaded Document"

class GenerateLessonRequest(BaseModel):
    topic_id: str
    language: str = "cpp"
    document_chunks: Optional[List[Dict[str, Any]]] = None
    filename: Optional[str] = None
    provider: Optional[str] = "demo"

class LessonFollowupRequest(BaseModel):
    topic_id: str
    section_number: int
    question: str
    document_chunks: Optional[List[Dict[str, Any]]] = None
    filename: Optional[str] = None

class HintRequest(BaseModel):
    problem_id: str
    hint_level: int = 1
    language: str = "cpp"

class EvaluateQuizRequest(BaseModel):
    topic_id: str
    answers: List[Dict[str, Any]]

@router.get("/topics")
async def list_topics():
    """
    Returns the complete 10-topic DSA curriculum.
    """
    return {
        "success": True,
        "count": len(get_all_topics()),
        "topics": get_all_topics()
    }

@router.get("/topics/{topic_id}")
async def get_topic(topic_id: str):
    topic = get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found.")
    return {
        "success": True,
        "topic": topic
    }

@router.get("/problems")
async def list_problems(topic_id: Optional[str] = None):
    """
    Returns curated LeetCode practice catalogue, optionally filtered by topic.
    """
    all_probs = get_all_problems()
    if topic_id:
        filtered = [p for p in all_probs if p.get("topic_id") == topic_id]
    else:
        filtered = all_probs
    return {
        "success": True,
        "count": len(filtered),
        "problems": filtered
    }

@router.get("/problems/{problem_id}")
async def get_problem(problem_id: str):
    """
    Returns single problem with full starter code, test cases, and structured 7-part explanation.
    """
    problem = get_problem_by_id(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_id}' not found.")
    return {
        "success": True,
        "problem": problem
    }

@router.post("/tutor")
async def consult_tutor(req: TutorRequest):
    """
    Executes tutor consultation across the 4 modes (learn, build, debug, practice)
    using either Demo Mode or local Ollama LLM.
    """
    try:
        result = await CodingTutor.generate_response(
            mode=req.mode,
            language=req.language,
            problem_id=req.problem_id,
            topic_id=req.topic_id,
            student_code=req.student_code,
            user_query=req.user_query,
            knowledge_passages=req.knowledge_passages,
            provider_name=req.provider
        )
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tutor consultation failed: {str(e)}")

@router.get("/runner/status")
async def get_runner_status():
    """
    Returns Docker availability and status for C++ and Python execution sandbox.
    """
    status = CodeRunner.check_docker()
    return {
        "success": True,
        "docker_available": status["available"],
        "docker_version": status.get("version"),
        "error": status.get("error"),
        "actionable_setup": status.get("actionable_setup"),
        "cpp_image": CodeRunner.CPP_IMAGE if hasattr(CodeRunner, "CPP_IMAGE") else "gcc:13-bookworm",
        "python_image": CodeRunner.PYTHON_IMAGE if hasattr(CodeRunner, "PYTHON_IMAGE") else "python:3.11-slim"
    }

@router.post("/run")
async def run_code(req: RunCodeRequest):
    """
    Executes C++17 or Python 3.11 code inside a secure Docker container.
    Returns real execution results, test verdicts, compiler stderr, and duration.
    If Docker is unavailable, safely halts without executing untrusted code on host.
    """
    try:
        result = CodeRunner.execute(
            language=req.language,
            code=req.code,
            problem_id=req.problem_id,
            test_cases=req.test_cases,
            custom_input=req.custom_input
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution engine failed: {str(e)}")

@router.post("/document/analyze-topics")
async def analyze_document_topics(req: AnalyzeDocumentTopicsRequest):
    """
    Scans uploaded document chunks for DSA topics and returns matched curriculum areas with page citations.
    """
    return LessonGenerator.analyze_document_topics(
        chunks=req.chunks,
        filename=req.filename or "Uploaded Document"
    )

@router.post("/lesson/generate")
async def generate_lesson(req: GenerateLessonRequest):
    """
    Generates a complete 13-part structured DSA lesson grounded in document passages.
    """
    return LessonGenerator.generate_13_step_lesson(
        topic_id=req.topic_id,
        language=req.language,
        document_chunks=req.document_chunks,
        filename=req.filename,
        provider_name=req.provider or "demo"
    )

@router.post("/lesson/followup")
async def lesson_followup(req: LessonFollowupRequest):
    """
    Answers a targeted follow-up question for a specific lesson section, grounded in document passages.
    """
    return LessonGenerator.answer_followup_question(
        topic_id=req.topic_id,
        section_number=req.section_number,
        question=req.question,
        document_chunks=req.document_chunks,
        filename=req.filename
    )

@router.post("/hints")
async def get_progressive_hint(req: HintRequest):
    """
    Retrieves progressive scaffolding hints (Level 1 Intuition -> Level 2 Algorithm -> Level 3 Code scaffold).
    """
    return CodingTutor.get_progressive_hint(
        problem_id=req.problem_id,
        hint_level=req.hint_level,
        language=req.language
    )

@router.post("/quiz/evaluate")
async def evaluate_quiz(req: EvaluateQuizRequest):
    """
    Evaluates student quiz answers against canonical questions and computes score/mastery.
    """
    return CodingTutor.evaluate_quiz_answers(
        topic_id=req.topic_id,
        answers=req.answers
    )


