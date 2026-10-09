import pytest
from app.tools.registry import tool_registry
from app.agents.executor import AgentExecutor

def test_tool_registry_schemas():
    tools = tool_registry.get_tool_definitions()
    assert len(tools) >= 4
    tool_names = [t["name"] for t in tools]
    assert "search_knowledge_base" in tool_names
    assert "summarize_document" in tool_names
    assert "generate_quiz" in tool_names
    assert "structured_result" in tool_names

def test_tool_argument_validation_missing_param():
    with pytest.raises(ValueError) as exc:
        # 'query' is required for search_knowledge_base
        tool_registry.execute_tool("search_knowledge_base", {})
    assert "Missing required parameter" in str(exc.value)

def test_tool_argument_validation_invalid_type():
    with pytest.raises(ValueError) as exc:
        # 'top_k' must be integer
        tool_registry.execute_tool("search_knowledge_base", {"query": "test", "top_k": "not-an-int"})
    assert "must be an integer" in str(exc.value)

def test_tool_search_execution():
    chunks = [
        {"id": 1, "document_id": 5, "page_number": 1, "content": "Node.js Express backend coordinates SQLite database and REST APIs."}
    ]
    res = tool_registry.execute_tool("search_knowledge_base", {"query": "Express backend", "top_k": 2}, context_chunks=chunks)
    assert res["status"] == "successful"
    assert res["duration_ms"] >= 0
    assert res["result"]["matched_count"] == 1

def test_agent_executor_bounded_steps():
    import asyncio
    executor = AgentExecutor(provider_name="demo")
    result = asyncio.run(executor.run(
        user_message="Please create a quiz on machine learning models",
        context_chunks=[],
        max_steps=5
    ))
    assert result["status"] == "successful"
    assert result["total_steps"] <= 5
    assert len(result["steps"]) > 0
    step = result["steps"][0]
    assert "step_number" in step
    assert "thought" in step
    assert "tool_name" in step
    assert "duration_ms" in step
    assert "quiz" in result["final_response"].lower()

def test_agent_executor_empty_prompt_rejected():
    import asyncio
    executor = AgentExecutor(provider_name="demo")
    with pytest.raises(ValueError) as exc:
        asyncio.run(executor.run(user_message="   "))
    assert "cannot be empty" in str(exc.value)
