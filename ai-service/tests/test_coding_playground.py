import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from app.coding.catalog import (
    get_all_topics,
    get_topic_by_id,
    get_all_problems,
    get_problem_by_id,
    DSA_TOPICS,
    LEETCODE_PROBLEMS
)
from app.coding.tutor import CodingTutor
from app.models.ollama_provider import OllamaProvider

def test_dsa_topics_all_ten_covered():
    """
    Verifies that all core DSA topics are present with complete metadata.
    """
    topics = get_all_topics()
    assert len(topics) >= 10

    expected_topics = [
        "arrays", "strings", "hashing", "linked-lists", "stacks",
        "queues", "binary-search", "trees", "graphs", "dynamic-programming"
    ]
    topic_ids = [t["id"] for t in topics]
    for exp in expected_topics:
        assert exp in topic_ids, f"Topic '{exp}' must be present in DSA topics"

    for t in topics:
        assert t["name"]
        assert isinstance(t["patterns"], list) and len(t["patterns"]) > 0
        assert "cpp" in t["containers"] and t["containers"]["cpp"]
        assert "python" in t["containers"] and t["containers"]["python"]

def test_leetcode_catalogue_integrity():
    """
    Verifies that problems have verified official links, C++ and Python starter code,
    and complete 7-part structured explanations.
    """
    problems = get_all_problems()
    assert len(problems) >= 10

    for p in problems:
        assert p["id"]
        assert p["title"]
        assert p["difficulty"] in ["Easy", "Medium", "Hard"]
        assert p["official_url"].startswith("https://leetcode.com/problems/")
        assert p["starter_code"]["cpp"]
        assert p["starter_code"]["python"]
        assert p["solution_code"]["cpp"]
        assert p["solution_code"]["python"]

        # Verify all 7 structured explanation components
        exp = p["structured_explanation"]
        assert "problem_understanding" in exp and len(exp["problem_understanding"]) > 0
        assert "approach" in exp and len(exp["approach"]) > 0
        assert "pseudocode" in exp and len(exp["pseudocode"]) > 0
        assert "line_by_line" in exp
        assert "cpp" in exp["line_by_line"] and "python" in exp["line_by_line"]
        assert "dry_run" in exp and len(exp["dry_run"]) > 0
        assert "complexity" in exp and "time" in exp["complexity"] and "space" in exp["complexity"]

def test_tutor_demo_mode_learn():
    """
    Verifies tutor response in Learn mode with C++.
    """
    result = asyncio.run(CodingTutor.generate_response(
        mode="learn",
        language="cpp",
        problem_id="two-sum",
        provider_name="demo"
    ))
    assert result["status"] == "successful"
    assert result["provider"] == "demo"
    assert "Two Sum" in result["title"]
    assert "Learn Mode" in result["content"]
    assert "Problem Understanding" in result["content"]
    assert "Complexity" in result["content"]

def test_tutor_demo_mode_build():
    """
    Verifies tutor response in Build With Me mode with Python.
    """
    result = asyncio.run(CodingTutor.generate_response(
        mode="build",
        language="python",
        problem_id="valid-parentheses",
        provider_name="demo"
    ))
    assert result["status"] == "successful"
    assert result["mode"] == "build"
    assert "Build With Me" in result["content"]
    assert "def isValid" in result["content"]

def test_tutor_demo_mode_debug():
    """
    Verifies tutor response in Debug mode analyzing student code.
    """
    buggy_code = "class Solution:\n    def twoSum(self, nums, target):\n        for i in range(len(nums))\n"
    result = asyncio.run(CodingTutor.generate_response(
        mode="debug",
        language="python",
        problem_id="two-sum",
        student_code=buggy_code,
        provider_name="demo"
    ))
    assert result["status"] == "successful"
    assert result["mode"] == "debug"
    assert "Debug Mode" in result["content"]
    assert "Missing colon" in result["content"] or "Syntax" in result["content"] or "Diagnostics" in result["content"]

def test_tutor_demo_mode_practice():
    """
    Verifies tutor response in Practice mode.
    """
    result = asyncio.run(CodingTutor.generate_response(
        mode="practice",
        language="cpp",
        problem_id="binary-search",
        provider_name="demo"
    ))
    assert result["status"] == "successful"
    assert result["mode"] == "practice"
    assert "Practice Mode" in result["content"]
    assert "Clarifying Questions" in result["content"]

def test_tutor_knowledge_hub_passage_grounding():
    """
    Verifies that attached Knowledge Hub passages are incorporated with citations.
    """
    passages = [{
        "id": 101,
        "document_id": 5,
        "page_number": 2,
        "content": "In LeetCode #1 Two Sum, standard hash map complements yield O(1) lookup speed."
    }]
    result = asyncio.run(CodingTutor.generate_response(
        mode="learn",
        language="cpp",
        problem_id="two-sum",
        knowledge_passages=passages,
        provider_name="demo"
    ))
    assert len(result["citations"]) == 1
    assert result["citations"][0]["document_id"] == 5
    assert "Knowledge Hub Document #5" in result["content"]

def test_tutor_ollama_unreachable_fails_honestly():
    """
    Verifies that if Ollama mode is selected but unreachable,
    an explicit RuntimeError is raised rather than falling back silently to Demo Mode.
    """
    mock_prov = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_prov.get_health_status = AsyncMock(return_value={"reachable": False, "error": "Connection refused"})

    with patch("app.coding.tutor.get_provider", return_value=mock_prov):
        with pytest.raises(RuntimeError) as exc:
            asyncio.run(CodingTutor.generate_response(
                mode="learn",
                language="cpp",
                problem_id="two-sum",
                provider_name="ollama"
            ))
        assert "Ollama is unreachable" in str(exc.value)

def test_tutor_ollama_mock_success():
    """
    Verifies successful Ollama response generation when model is reachable.
    """
    mock_prov = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_prov.get_health_status = AsyncMock(return_value={"reachable": True, "error": None})
    mock_prov.generate_text = AsyncMock(return_value="[Ollama Tutor] Here is the step-by-step breakdown in C++ using std::unordered_map...")

    with patch("app.coding.tutor.get_provider", return_value=mock_prov):
        result = asyncio.run(CodingTutor.generate_response(
            mode="learn",
            language="cpp",
            problem_id="two-sum",
            provider_name="ollama"
        ))
        assert result["status"] == "successful"
        assert result["provider"] == "ollama"
        assert "[Ollama Tutor]" in result["content"]
