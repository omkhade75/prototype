import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.tools.registry import tool_registry
from app.models.ollama_provider import OllamaProvider
from app.agents.executor import AgentExecutor

def test_ollama_tools_schema_format():
    """
    Verifies that tool definitions are properly formatted into OpenAI/Ollama function calling schema.
    """
    tools = tool_registry.get_ollama_tools()
    assert isinstance(tools, list)
    assert len(tools) >= 4

    for t in tools:
        assert t.get("type") == "function"
        func = t.get("function", {})
        assert "name" in func
        assert "description" in func
        params = func.get("parameters", {})
        assert params.get("type") == "object"
        assert "properties" in params
        assert "required" in params

def test_ollama_agent_successful_tool_call_flow():
    """
    Verifies the complete tool-calling loop:
    1. Model returns tool_calls for search_knowledge_base.
    2. Agent executes tool and returns result to model.
    3. Model returns final synthesis answer.
    """
    chunks = [
        {"id": 1, "document_id": 10, "page_number": 1, "content": "TF-IDF measures word relevance using term frequency and inverse document frequency."}
    ]

    mock_provider = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_provider.get_health_status = AsyncMock(return_value={
        "reachable": True,
        "base_url": "http://localhost:11434",
        "model": "llama3",
        "installed_models": ["llama3:latest"],
        "model_installed": True,
        "error": None
    })

    # Sequence of model chat responses:
    # Turn 1: Assistant requests search tool
    turn_1_msg = {
        "role": "assistant",
        "content": "",
        "tool_calls": [
            {
                "function": {
                    "name": "search_knowledge_base",
                    "arguments": {"query": "TF-IDF", "top_k": 1}
                }
            }
        ]
    }
    # Turn 2: Assistant observes tool result and generates final answer
    turn_2_msg = {
        "role": "assistant",
        "content": "Based on the retrieved passage, TF-IDF measures term frequency against inverse document frequency.",
        "tool_calls": []
    }

    mock_provider.chat = AsyncMock(side_effect=[turn_1_msg, turn_2_msg])

    executor = AgentExecutor(provider_name="ollama")
    executor.provider = mock_provider

    result = asyncio.run(executor.run(
        user_message="Explain what TF-IDF is from the documents",
        context_chunks=chunks,
        max_steps=5
    ))

    assert result["status"] == "successful"
    assert result["provider"] == "ollama"
    assert result["total_steps"] == 1
    assert len(result["steps"]) == 1

    step = result["steps"][0]
    assert step["tool_name"] == "search_knowledge_base"
    assert step["status"] == "successful"
    assert step["tool_args"]["query"] == "TF-IDF"
    assert step["tool_result"]["matched_count"] == 1
    assert "TF-IDF" in result["final_response"]

    # Verify provider chat was called twice
    assert mock_provider.chat.call_count == 2
    # Check that second chat invocation received the tool result message
    second_call_messages = mock_provider.chat.call_args_list[1][0][0]
    assert any(m.get("role") == "tool" for m in second_call_messages)

def test_ollama_agent_direct_response_without_tools():
    """
    Verifies that when Ollama answers directly without calling tools,
    the agent returns the response cleanly with 0 steps.
    """
    mock_provider = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_provider.get_health_status = AsyncMock(return_value={
        "reachable": True,
        "installed_models": ["llama3:latest"],
        "model_installed": True,
        "error": None
    })
    mock_provider.chat = AsyncMock(return_value={
        "role": "assistant",
        "content": "Hello! I am ORBIT AI running locally on Ollama.",
        "tool_calls": []
    })

    executor = AgentExecutor(provider_name="ollama")
    executor.provider = mock_provider

    result = asyncio.run(executor.run(
        user_message="Hello there!",
        context_chunks=[]
    ))

    assert result["status"] == "successful"
    assert result["provider"] == "ollama"
    assert result["total_steps"] == 0
    assert "Hello! I am ORBIT AI" in result["final_response"]

def test_ollama_agent_max_step_bounding():
    """
    Verifies that the agent strictly enforces the 5-step tool execution limit
    even if the model requests tools indefinitely.
    """
    mock_provider = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_provider.get_health_status = AsyncMock(return_value={"reachable": True, "error": None})

    # Endless tool call response
    infinite_tool_msg = {
        "role": "assistant",
        "content": "",
        "tool_calls": [
            {
                "function": {
                    "name": "summarize_document",
                    "arguments": {"document_id": 1}
                }
            }
        ]
    }
    mock_provider.chat = AsyncMock(return_value=infinite_tool_msg)

    executor = AgentExecutor(provider_name="ollama")
    executor.provider = mock_provider

    result = asyncio.run(executor.run(
        user_message="Summarize endlessly",
        context_chunks=[{"id": 1, "document_id": 1, "content": "Sample content"}],
        max_steps=5
    ))

    assert result["total_steps"] <= 5
    assert len(result["steps"]) <= 5
    assert "maximum" in result["final_response"].lower() or "limit" in result["final_response"].lower()

def test_ollama_agent_unauthorized_tool_rejected():
    """
    Verifies that if the model requests an unknown or unauthorized tool,
    the agent records the error, denies execution, and feeds an error message back.
    """
    mock_provider = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_provider.get_health_status = AsyncMock(return_value={"reachable": True, "error": None})

    unauthorized_msg = {
        "role": "assistant",
        "content": "",
        "tool_calls": [
            {
                "function": {
                    "name": "dangerous_shell_command",
                    "arguments": {"cmd": "rm -rf /"}
                }
            }
        ]
    }
    final_msg = {
        "role": "assistant",
        "content": "I apologize, that tool is not permitted in ORBIT AI.",
        "tool_calls": []
    }
    mock_provider.chat = AsyncMock(side_effect=[unauthorized_msg, final_msg])

    executor = AgentExecutor(provider_name="ollama")
    executor.provider = mock_provider

    result = asyncio.run(executor.run(
        user_message="Run dangerous command",
        context_chunks=[]
    ))

    assert len(result["steps"]) == 1
    step = result["steps"][0]
    assert step["status"] == "failed"
    assert "not in the permitted tool allowlist" in step["tool_result"]["error"]

def test_ollama_agent_schema_validation_error():
    """
    Verifies that malformed or schema-invalid arguments are caught,
    logged in the trace as failed steps, and returned as feedback to the model.
    """
    mock_provider = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_provider.get_health_status = AsyncMock(return_value={"reachable": True, "error": None})

    invalid_args_msg = {
        "role": "assistant",
        "content": "",
        "tool_calls": [
            {
                "function": {
                    "name": "search_knowledge_base",
                    "arguments": {} # Missing required 'query'
                }
            }
        ]
    }
    recovery_msg = {
        "role": "assistant",
        "content": "Corrected: I cannot search without a query.",
        "tool_calls": []
    }
    mock_provider.chat = AsyncMock(side_effect=[invalid_args_msg, recovery_msg])

    executor = AgentExecutor(provider_name="ollama")
    executor.provider = mock_provider

    result = asyncio.run(executor.run(
        user_message="Search with empty query",
        context_chunks=[]
    ))

    assert len(result["steps"]) == 1
    step = result["steps"][0]
    assert step["status"] == "failed"
    assert "Missing required parameter 'query'" in step["tool_result"]["error"]

def test_ollama_unreachable_does_not_fall_back_to_demo():
    """
    CRITICAL SAFETY REQUIREMENT:
    When Ollama is selected but unreachable, the system must FAIL HONESTLY.
    It must NOT silently switch to Demo Mode.
    """
    mock_provider = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_provider.get_health_status = AsyncMock(return_value={
        "reachable": False,
        "base_url": "http://localhost:11434",
        "model": "llama3",
        "installed_models": [],
        "model_installed": False,
        "error": "Connection refused at http://localhost:11434"
    })

    executor = AgentExecutor(provider_name="ollama")
    executor.provider = mock_provider

    result = asyncio.run(executor.run(
        user_message="What is RAG?",
        context_chunks=[]
    ))

    # Must be marked failed
    assert result["status"] == "failed"
    # Provider must remain 'ollama' - no silent switch to 'demo'
    assert result["provider"] == "ollama"
    # Error message must explain that Ollama is unreachable
    assert "Ollama is unreachable" in result["error_message"]
    assert "ollama serve" in result["error_message"]

def test_ollama_timeout_handling():
    """
    Verifies that network timeout when talking to Ollama is caught,
    reported truthfully, and does not crash or silently change modes.
    """
    mock_provider = OllamaProvider(base_url="http://localhost:11434", model="llama3")
    mock_provider.get_health_status = AsyncMock(return_value={"reachable": True, "error": None})
    mock_provider.chat = AsyncMock(side_effect=TimeoutError("Ollama request timed out after 30.0s"))

    executor = AgentExecutor(provider_name="ollama")
    executor.provider = mock_provider

    result = asyncio.run(executor.run(
        user_message="Long prompt that times out",
        context_chunks=[]
    ))

    assert result["status"] == "failed"
    assert result["provider"] == "ollama"
    assert "timed out" in result["error_message"].lower()
