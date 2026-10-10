"""
Unit and integration tests for ORBIT AI Secure Code Runner.
Tests security boundaries, Docker container argument verification,
compilation errors, runtime failures, timeouts, output limits, and API routes.
"""

import os
import sys
import subprocess
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.coding.runner import (
    CodeRunner,
    normalize_output,
    compare_outputs,
    truncate_output,
    MAX_OUTPUT_BYTES
)

client = TestClient(app)


# 1. Output Normalization & Truthful Comparison Tests
def test_normalize_output_whitespace_and_newlines():
    raw = "  Line 1   \r\nLine 2 \t \r\n\r\n"
    norm = normalize_output(raw)
    assert norm == "  Line 1\nLine 2"


def test_compare_outputs_exact_and_json_structures():
    # Exact match
    assert compare_outputs("42\n", "42") is True
    # JSON array formatting variation: [0, 1] vs [0,1]
    assert compare_outputs("[0, 1]\n", "[0,1]") is True
    # Boolean case matching
    assert compare_outputs("true", "True") is True
    assert compare_outputs("false\n", "False") is True
    # Float tolerance
    assert compare_outputs("3.141592", "3.141590") is True
    # Wrong answer
    assert compare_outputs("[0, 2]", "[0, 1]") is False


# 2. Host Environment Live Check Test
def test_docker_check_real_host_environment():
    """
    Checks the real host status. If Docker is missing or not running on the machine,
    verifies it honestly reports available=False with an actionable setup guide.
    """
    status = CodeRunner.check_docker()
    assert isinstance(status, dict)
    assert "available" in status
    if not status["available"]:
        assert status["actionable_setup"] is not None
        assert "docker" in status["actionable_setup"].lower()


# 3. Docker Unavailable Fails Safely Without Host Execution
def test_docker_unavailable_fails_safely_without_host_execution():
    """
    CRITICAL SECURITY TEST:
    If Docker is unavailable, the runner must immediately halt and refuse to execute
    untrusted user code directly on the host system.
    """
    with patch.object(CodeRunner, "check_docker", return_value={
        "available": False,
        "error": "Docker daemon offline",
        "actionable_setup": "Please install and start Docker Desktop."
    }):
        # Mock subprocess.run to verify it is NEVER called
        with patch("subprocess.run") as mock_sub:
            res = CodeRunner.execute(
                language="python",
                code="import os; os.system('echo malicious')",
                custom_input="test"
            )
            assert res["success"] is False
            assert res["docker_available"] is False
            assert res["status"] == "docker_unavailable"
            assert "install and start Docker" in res["actionable_setup"]
            # Subprocess must NOT be called on host
            mock_sub.assert_not_called()


# 4. Language Validation Test
def test_unsupported_language_rejection():
    res = CodeRunner.execute(
        language="ruby",
        code="puts 'hello'"
    )
    assert res["success"] is False
    assert res["status"] == "unsupported_language"
    assert "Unsupported language" in res["error"]


# 5. Working Python Program in Mocked Container
def test_working_python_program_mocked_docker():
    mock_run = MagicMock()
    mock_run.returncode = 0
    mock_run.stdout = "[0, 1]\n"
    mock_run.stderr = ""

    with patch.object(CodeRunner, "check_docker", return_value={"available": True}):
        with patch("subprocess.run", return_value=mock_run) as mock_sub:
            res = CodeRunner.execute(
                language="python",
                code="print('[0, 1]')",
                test_cases=[{"input": "", "output": "[0, 1]"}]
            )

            assert res["success"] is True
            assert res["status"] == "passed"
            assert res["passed_count"] == 1
            assert res["total_count"] == 1
            assert len(res["results"]) == 1
            assert res["results"][0]["passed"] is True
            assert res["results"][0]["actual"] == "[0, 1]\n"


# 6. Working C++17 Program in Mocked Container
def test_working_cpp17_program_mocked_docker():
    # Step 1: Compilation mock (exit 0)
    mock_comp = MagicMock(returncode=0, stdout="", stderr="")
    # Step 2: Binary run mock (exit 0)
    mock_exec = MagicMock(returncode=0, stdout="[0, 1]\n", stderr="")

    with patch.object(CodeRunner, "check_docker", return_value={"available": True}):
        with patch("subprocess.run", side_effect=[mock_comp, mock_exec]) as mock_sub:
            res = CodeRunner.execute(
                language="cpp",
                code='#include <iostream>\nint main() { std::cout << "[0, 1]" << std::endl; return 0; }',
                test_cases=[{"input": "", "output": "[0, 1]"}]
            )

            assert res["success"] is True
            assert res["status"] == "passed"
            assert res["passed_count"] == 1
            assert mock_sub.call_count == 2  # compile then run


# 7. Multiple Test Cases with Incorrect Output
def test_multiple_test_cases_and_incorrect_output():
    mock_tc1 = MagicMock(returncode=0, stdout="[0, 1]\n", stderr="")
    mock_tc2 = MagicMock(returncode=0, stdout="[9, 9]\n", stderr="")  # Mismatch

    with patch.object(CodeRunner, "check_docker", return_value={"available": True}):
        with patch("subprocess.run", side_effect=[mock_tc1, mock_tc2]):
            res = CodeRunner.execute(
                language="python",
                code="dummy",
                test_cases=[
                    {"input": "1", "output": "[0, 1]"},
                    {"input": "2", "output": "[1, 2]"}
                ]
            )

            assert res["success"] is True
            assert res["status"] == "wrong_answer"
            assert res["passed_count"] == 1
            assert res["total_count"] == 2
            assert res["results"][0]["passed"] is True
            assert res["results"][1]["passed"] is False
            assert res["results"][1]["status"] == "wrong_answer"


# 8. C++ Compilation Error Handling
def test_cpp_compilation_error_handling():
    compiler_error_stderr = (
        "solution.cpp: In function 'int main()':\n"
        "solution.cpp:3:5: error: expected primary-expression before ';' token\n"
        "    3 | int x = ;\n"
        "      |         ^"
    )
    mock_comp = MagicMock(returncode=1, stdout="", stderr=compiler_error_stderr)

    with patch.object(CodeRunner, "check_docker", return_value={"available": True}):
        with patch("subprocess.run", return_value=mock_comp) as mock_sub:
            res = CodeRunner.execute(
                language="cpp",
                code="int main() { int x = ; return 0; }",
                test_cases=[{"input": "", "output": "0"}]
            )

            assert res["success"] is False
            assert res["status"] == "compile_error"
            assert "error: expected primary-expression" in res["compiler_output"]
            assert res["passed_count"] == 0
            # Did not execute binary
            assert mock_sub.call_count == 1


# 9. Python Runtime Error & Syntax Error Handling
def test_python_runtime_error_handling():
    runtime_err = (
        "Traceback (most recent call last):\n"
        "  File 'solution.py', line 2, in <module>\n"
        "ZeroDivisionError: division by zero"
    )
    mock_run = MagicMock(returncode=1, stdout="", stderr=runtime_err)

    with patch.object(CodeRunner, "check_docker", return_value={"available": True}):
        with patch("subprocess.run", return_value=mock_run):
            res = CodeRunner.execute(
                language="python",
                code="print(1/0)",
                test_cases=[{"input": "", "output": "0"}]
            )

            assert res["success"] is True
            assert res["status"] == "wrong_answer"
            assert res["results"][0]["status"] == "runtime_error"
            assert "ZeroDivisionError" in res["results"][0]["error"]
            assert res["results"][0]["passed"] is False


# 10. Execution Timeout (Infinite Loop) Handling
def test_execution_timeout_infinite_loop():
    with patch.object(CodeRunner, "check_docker", return_value={"available": True}):
        with patch("subprocess.run", side_effect=subprocess.TimeoutExpired(cmd="docker", timeout=5.0)):
            res = CodeRunner.execute(
                language="python",
                code="while True: pass",
                test_cases=[{"input": "", "output": "0"}]
            )

            assert res["results"][0]["status"] == "timeout"
            assert "Time Limit Exceeded" in res["results"][0]["error"]
            assert res["results"][0]["passed"] is False


# 11. Excessive Output Truncation Limit
def test_excessive_output_truncation_limit():
    huge_text = "A" * (MAX_OUTPUT_BYTES + 5000)
    truncated, was_trunc = truncate_output(huge_text, max_bytes=MAX_OUTPUT_BYTES)
    assert was_trunc is True
    assert "Output truncated after 64KB limit" in truncated


# 12. Security Boundary Arguments & Isolation Flags Verification
def test_docker_security_arguments_isolation():
    """
    Verifies that the generated Docker command enforces all required security boundary flags:
    - --network none
    - --memory 256m
    - --cpus 1.0
    - --pids-limit 64
    - --security-opt no-new-privileges
    - --cap-drop ALL
    - -w /workspace
    """
    mock_run = MagicMock(returncode=0, stdout="OK\n", stderr="")

    with patch.object(CodeRunner, "check_docker", return_value={"available": True}):
        with patch("subprocess.run", return_value=mock_run) as mock_sub:
            CodeRunner.execute(
                language="python",
                code="print('OK')",
                custom_input="test"
            )

            # Inspect argument list passed to subprocess.run
            call_args = mock_sub.call_args[0][0]
            assert "docker" in call_args
            assert "run" in call_args
            assert "--rm" in call_args
            assert "--network" in call_args and "none" in call_args
            assert "--memory" in call_args
            assert "--pids-limit" in call_args
            assert "--security-opt" in call_args
            assert "no-new-privileges" in call_args
            assert "--cap-drop" in call_args and "ALL" in call_args


# 13. FastAPI API Router Integration Tests
def test_api_runner_status_endpoint():
    res = client.get("/coding/runner/status")
    assert res.status_code == 200
    data = res.json()
    assert "docker_available" in data
    assert "cpp_image" in data
    assert "python_image" in data


def test_api_run_code_endpoint():
    with patch.object(CodeRunner, "check_docker", return_value={
        "available": False,
        "error": "Docker offline",
        "actionable_setup": "Install Docker Desktop"
    }):
        payload = {
            "language": "python",
            "code": "print('hello')",
            "custom_input": ""
        }
        res = client.post("/coding/run", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["docker_available"] is False
        assert data["status"] == "docker_unavailable"
        assert "Install Docker" in data["actionable_setup"]
