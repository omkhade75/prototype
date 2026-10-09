import pytest
import asyncio
from app.agents.quiz_generator import extract_quiz_parameters, GroundedQuizGenerator
from app.agents.executor import AgentExecutor
from app.tools.registry import tool_registry

# Seeded document chunk representing Chunk 1 in Orbit AI Architectural Specification
SEEDED_RAG_CHUNK = {
    "id": 2,
    "document_id": 1,
    "chunk_index": 1,
    "page_number": 1,
    "content": (
        "Knowledge Hub uses a transparent TF-IDF retriever for keyword ranking. "
        "The retriever calculates term frequency (TF) and inverse document frequency (IDF) "
        "with cosine similarity, ensuring that retrieved passages have verifiable citations."
    ),
    "filename": "Orbit AI Architectural Specification.md"
}

def test_extract_quiz_parameters_user_prompt():
    """
    Test 1: Verifies concise topic and number of questions extraction from various prompts
    without using the entire instruction as the topic.
    """
    prompt1 = "Generate a 3-question quiz on RAG retrieval principles using the knowledge available in ORBIT AI."
    topic1, num1 = extract_quiz_parameters(prompt1)
    assert topic1 == "RAG retrieval principles"
    assert num1 == 3
    assert "Generate" not in topic1
    assert "using the knowledge" not in topic1

    prompt2 = "Create a 5-question quiz about workflow DAG execution from the documentation"
    topic2, num2 = extract_quiz_parameters(prompt2)
    assert topic2 == "workflow DAG execution"
    assert num2 == 5

    prompt3 = "Quiz me on TF-IDF"
    topic3, num3 = extract_quiz_parameters(prompt3)
    assert topic3 == "TF-IDF"
    assert num3 == 3  # default

    prompt4 = "Give me 2 questions on agent tools"
    topic4, num4 = extract_quiz_parameters(prompt4)
    assert topic4 == "agent tools"
    assert num4 == 2

def test_generate_three_distinct_questions_from_seeded_rag_doc():
    """
    Test 2: Verifies generating three distinct questions from seeded retrieval documentation.
    """
    res = GroundedQuizGenerator.generate_demo_quiz(
        topic="RAG retrieval principles",
        num_questions=3,
        context_chunks=[SEEDED_RAG_CHUNK]
    )

    assert res["supported"] is True
    assert res["questions_count"] == 3
    assert len(res["questions"]) == 3

    questions_text = [q["question"] for q in res["questions"]]
    # All 3 questions must be distinct
    assert len(set(questions_text)) == 3
    # No question should blindly repeat the prompt or topic string as the whole question
    for q_text in questions_text:
        assert q_text != "RAG retrieval principles"
        assert not q_text.startswith("Generate a 3-question quiz")

def test_correct_options_and_grounded_answers():
    """
    Test 3: Verifies options and answers are grounded in source passages with truthful citations.
    """
    res = GroundedQuizGenerator.generate_demo_quiz(
        topic="RAG retrieval principles",
        num_questions=3,
        context_chunks=[SEEDED_RAG_CHUNK]
    )

    for q in res["questions"]:
        # Exactly 4 distinct options
        assert len(q["options"]) == 4
        assert len(set(q["options"])) == 4
        # Exactly one correct answer (A, B, C, or D)
        assert q["correct_answer"] in ["A", "B", "C", "D"]
        # Has meaningful explanation and citation to Document #1
        assert "citation" in q
        assert "Document #1" in q["citation"]
        assert len(q["explanation"]) > 10

    # Specifically verify the TF-IDF and Cosine similarity questions exist
    all_q_text = " ".join([q["question"] for q in res["questions"]])
    assert "TF-IDF" in all_q_text or "retrieval method" in all_q_text
    assert "TF and IDF" in all_q_text or "cosine similarity" in all_q_text

def test_rejection_when_relevant_knowledge_is_missing():
    """
    Test 4: Verifies rejection or clarification when relevant knowledge is missing (e.g. Mars).
    """
    res = GroundedQuizGenerator.generate_demo_quiz(
        topic="current population of Mars",
        num_questions=3,
        context_chunks=[SEEDED_RAG_CHUNK]
    )

    assert res["supported"] is False
    assert res["questions_count"] == 0
    assert len(res["questions"]) == 0
    assert "does not contain sufficient information" in res["message"]
    assert "current population of Mars" in res["message"]

def test_handling_request_for_more_questions_than_supported():
    """
    Test 5: Handling a request for more questions than the source can support.
    """
    res = GroundedQuizGenerator.generate_demo_quiz(
        topic="RAG retrieval principles",
        num_questions=5,
        context_chunks=[SEEDED_RAG_CHUNK]
    )

    # SEEDED_RAG_CHUNK supports 4 distinct facts (retriever, TF/IDF definitions, cosine similarity, citations)
    assert res["supported"] is True
    assert res["questions_count"] == 4
    assert res["notes"] is not None
    assert "Requested 5 questions" in res["notes"]
    assert "only support 4" in res["notes"]

def test_malformed_llm_model_output_validation():
    """
    Test 6: Validates that malformed LLM outputs are caught and rejected by schema validation.
    """
    # 1. Invalid JSON
    res_bad_json = GroundedQuizGenerator.validate_llm_quiz_output(
        "Here is a quiz: not valid json at all",
        [SEEDED_RAG_CHUNK]
    )
    assert res_bad_json["valid"] is False
    assert "did not contain a valid JSON" in res_bad_json["error"]

    # 2. Missing questions array
    res_missing_q = GroundedQuizGenerator.validate_llm_quiz_output(
        '{"topic": "Test", "output": "something"}',
        [SEEDED_RAG_CHUNK]
    )
    assert res_bad_json["valid"] is False

    # 3. Malformed question item (e.g. only 2 options or bad correct_answer)
    bad_schema = '''{
        "topic": "RAG",
        "questions": [
            {
                "question": "What is TF-IDF?",
                "options": ["A. Option 1", "B. Option 2"],
                "correct_answer": "Z"
            }
        ]
    }'''
    res_bad_item = GroundedQuizGenerator.validate_llm_quiz_output(
        bad_schema,
        [SEEDED_RAG_CHUNK]
    )
    assert res_bad_item["valid"] is False
    assert "malformed" in res_bad_item["error"]

def test_agent_executor_end_to_end_quiz_quality():
    """
    Test 7: End-to-end test ensuring the raw user prompt is not blindly reused
    as every question or topic in AgentExecutor output.
    """
    executor = AgentExecutor(provider_name="demo")
    user_prompt = "Generate a 3-question quiz on RAG retrieval principles using the knowledge available in ORBIT AI."

    result = asyncio.run(executor.run(
        user_message=user_prompt,
        context_chunks=[SEEDED_RAG_CHUNK],
        max_steps=5
    ))

    assert result["status"] == "successful"
    assert len(result["steps"]) > 0
    step = result["steps"][0]

    # Tool args must have extracted concise topic
    assert step["tool_args"]["topic"] == "RAG retrieval principles"
    assert step["tool_args"]["num_questions"] == 3
    assert step["tool_args"]["topic"] != user_prompt

    final_resp = result["final_response"]
    # Final response must contain 3 questions with options and explanations
    assert "Q1:" in final_resp
    assert "Q2:" in final_resp
    assert "Q3:" in final_resp
    assert "Correct Answer:" in final_resp
    assert "Explanation:" in final_resp

    # Raw prompt should NOT be repeated as the topic or question body
    assert "Q1: Which core principle describes Generate a 3-question" not in final_resp
