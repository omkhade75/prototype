"""
ORBIT AI — Phase 3C: Automated Test Suite for PDF-Based DSA Tutor & Personalized Learning.
Tests topic scanning, 13-part structured lessons, progressive scaffolding hints,
quiz evaluation, and authentic citation grounding.
"""

import pytest
from app.coding.lesson_generator import LessonGenerator
from app.coding.tutor import CodingTutor
from app.coding.catalog import get_all_topics, get_topic_by_id, get_all_problems, get_problem_by_id


def test_analyze_document_topics_with_dsa_content():
    """
    Verifies that chunks containing DSA keywords are correctly identified with authentic page numbers.
    """
    chunks = [
        {
            "chunk_index": 0,
            "page_number": 3,
            "content": "A hash table or hashmap provides average O(1) time complexity for insertion and lookup using key-value pairs."
        },
        {
            "chunk_index": 1,
            "page_number": 7,
            "content": "Binary search divides the search space in half at each iteration, resulting in O(log N) logarithmic lookup time."
        }
    ]

    result = LessonGenerator.analyze_document_topics(chunks, filename="Algorithms_Handbook.pdf")
    assert result["success"] is True
    assert result["filename"] == "Algorithms_Handbook.pdf"
    assert result["total_chunks_analyzed"] == 2
    assert len(result["topics_found"]) >= 2

    found_ids = [t["topic_id"] for t in result["topics_found"]]
    assert "hashing" in found_ids
    assert "binary-search" in found_ids

    # Check page citations
    hashing_match = next(t for t in result["topics_found"] if t["topic_id"] == "hashing")
    assert 3 in hashing_match["pages_referenced"]
    assert hashing_match["citations"][0]["page_number"] == 3


def test_analyze_document_topics_with_irrelevant_content_honestly_returns_empty():
    """
    Verifies that documents without DSA concepts honestly return topics_found: [] without hallucination.
    """
    chunks = [
        {
            "chunk_index": 0,
            "page_number": 1,
            "content": "The atmospheric pressure on Mars is approximately 610 pascals, less than 1% of Earth's surface pressure."
        },
        {
            "chunk_index": 1,
            "page_number": 2,
            "content": "To bake chocolate chip cookies, preheat your oven to 375 degrees Fahrenheit and mix dry ingredients."
        }
    ]

    result = LessonGenerator.analyze_document_topics(chunks, filename="Science_And_Baking.pdf")
    assert result["success"] is True
    assert result["topics_found"] == []
    assert "No standard DSA topics were identified" in result["message"]


def test_generate_13_step_lesson_structure():
    """
    Verifies that generate_13_step_lesson generates all 13 structured sections with correct titles and badges.
    """
    lesson = LessonGenerator.generate_13_step_lesson(topic_id="arrays", language="cpp")
    assert lesson["success"] is True
    assert lesson["topic_id"] == "arrays"
    assert lesson["language"] == "cpp"

    sections = lesson["sections"]
    assert len(sections) == 13

    # Verify key sections
    sec_titles = [s["title"] for s in sections]
    assert any("1. What the Concept Means" in t for t in sec_titles)
    assert any("2. Everyday Analogy" in t for t in sec_titles)
    assert any("3. How It Works Step by Step" in t for t in sec_titles)
    assert any("5. Algorithmic Pseudocode" in t for t in sec_titles)
    assert any("6. C++17 Implementation" in t for t in sec_titles)
    assert any("7. Python 3.11 Implementation" in t for t in sec_titles)
    assert any("9. Dry Run" in t for t in sec_titles)
    assert any("10. Time and Space Complexity" in t for t in sec_titles)
    assert any("11. Common Mistakes & Edge Cases" in t for t in sec_titles)
    assert any("12. Real-World Industry Applications" in t for t in sec_titles)
    assert any("13. Quick Quiz" in t for t in sec_titles)

    # Check executable code sections
    sec6 = next(s for s in sections if s["section_number"] == 6)
    assert sec6["language"] == "cpp"
    assert "class Solution" in sec6["code"] or "#include" in sec6["code"]

    sec7 = next(s for s in sections if s["section_number"] == 7)
    assert sec7["language"] == "python"
    assert "class Solution" in sec7["code"] or "def " in sec7["code"]


def test_generate_13_step_lesson_with_pdf_grounding():
    """
    Verifies that when document chunks are provided, authentic citations and provenance badges are preserved.
    """
    doc_chunks = [
        {
            "chunk_index": 5,
            "page_number": 42,
            "document_id": 9,
            "content": "A binary tree is a hierarchical data structure where each node has at most two children referred to as left and right."
        }
    ]

    lesson = LessonGenerator.generate_13_step_lesson(
        topic_id="trees",
        language="cpp",
        document_chunks=doc_chunks,
        filename="CS_Notes.pdf"
    )

    assert lesson["has_pdf_evidence"] is True
    assert lesson["document_name"] == "CS_Notes.pdf"
    assert len(lesson["pdf_citations"]) > 0
    assert lesson["pdf_citations"][0]["page_number"] == 42

    sec1 = lesson["sections"][0]
    assert "Page 42" in sec1["provenance_badge"]
    assert "CS_Notes.pdf" in sec1["provenance_badge"]


def test_lesson_followup_question():
    """
    Verifies answering targeted student follow-up questions for a specific lesson section.
    """
    doc_chunks = [
        {
            "chunk_index": 1,
            "page_number": 14,
            "content": "Always initialize pointers low = 0 and high = n - 1 to prevent out of bounds errors in binary search."
        }
    ]

    ans = LessonGenerator.answer_followup_question(
        topic_id="binary-search",
        section_number=3,
        question="What are the initial boundaries for binary search?",
        document_chunks=doc_chunks,
        filename="Algorithms.pdf"
    )

    assert ans["success"] is True
    assert ans["section_number"] == 3
    assert "Key Intuition" in ans["answer"]
    assert ans["citation"] is not None
    assert ans["citation"]["page_number"] == 14


def test_progressive_hints_levels():
    """
    Verifies that get_progressive_hint returns levels 1, 2, and 3 with increasing specificity.
    """
    # Level 1: Intuition without spoilers
    h1 = CodingTutor.get_progressive_hint("two-sum", hint_level=1, language="cpp")
    assert h1["success"] is True
    assert h1["hint_level"] == 1
    assert "Level 1" in h1["title"]
    assert "Guiding Question" in h1["hint_text"]

    # Level 2: Algorithmic Strategy
    h2 = CodingTutor.get_progressive_hint("two-sum", hint_level=2, language="cpp")
    assert h2["success"] is True
    assert h2["hint_level"] == 2
    assert "Optimal Data Structure" in h2["hint_text"]

    # Level 3: Code Scaffold
    h3 = CodingTutor.get_progressive_hint("two-sum", hint_level=3, language="python")
    assert h3["success"] is True
    assert h3["hint_level"] == 3
    assert "Code Scaffold" in h3["title"]
    assert "class Solution" in h3["hint_text"] or "def twoSum" in h3["hint_text"]


def test_evaluate_quiz_answers_scoring():
    """
    Verifies quiz evaluation scoring and >= 80% mastery threshold.
    """
    # Test perfect score: 3 / 3 correct
    answers_perfect = [
        {"question_id": 1, "selected_option_index": 0},
        {"question_id": 2, "selected_option_index": 0},
        {"question_id": 3, "selected_option_index": 0}
    ]
    res_perfect = CodingTutor.evaluate_quiz_answers("arrays", answers_perfect)
    assert res_perfect["success"] is True
    assert res_perfect["percentage"] == 100.0
    assert res_perfect["passed"] is True
    assert "Outstanding" in res_perfect["feedback"]

    # Test failing score: 0 / 3 correct
    answers_failing = [
        {"question_id": 1, "selected_option_index": 3},
        {"question_id": 2, "selected_option_index": 3},
        {"question_id": 3, "selected_option_index": 3}
    ]
    res_failing = CodingTutor.evaluate_quiz_answers("arrays", answers_failing)
    assert res_failing["success"] is True
    assert res_failing["percentage"] == 0.0
    assert res_failing["passed"] is False
    assert "Review" in res_failing["feedback"]


def test_all_15_curriculum_topics_and_problems_integrity():
    """
    Verifies that all 15 curriculum areas are present with verified official LeetCode problems.
    """
    topics = get_all_topics()
    assert len(topics) >= 15

    expected_topics = [
        "arrays", "strings", "two-pointers-sliding-window", "hashing",
        "linked-lists", "stacks", "queues", "binary-search", "trees",
        "heaps", "graphs", "recursion-backtracking", "dynamic-programming",
        "greedy", "intervals"
    ]

    for tid in expected_topics:
        topic = get_topic_by_id(tid)
        assert topic is not None, f"Topic '{tid}' must exist"
        assert topic["name"]
        assert topic["containers"]["cpp"]
        assert topic["containers"]["python"]

    problems = get_all_problems()
    assert len(problems) >= 15
    for p in problems:
        assert p["official_url"].startswith("https://leetcode.com/problems/")
        assert p["starter_code"]["cpp"]
        assert p["starter_code"]["python"]
        assert p["solution_code"]["cpp"]
        assert p["solution_code"]["python"]
