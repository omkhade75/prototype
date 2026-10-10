"""
ORBIT AI — Secure Docker-Isolated Code Runner.
Executes C++17 and Python 3.11 inside hardened, isolated Docker containers.

Mandatory security boundary:
- Docker containers isolate execution from host Express and FastAPI processes.
- Network disabled (--network=none).
- Strict resource limits (RAM: 256m / 512m compile, CPU: 1.0, PIDs: 64).
- Linux capabilities dropped (--cap-drop=ALL), no-new-privileges.
- Restricted temporary workspace mounted per execution.
- No mounting of host secrets, credentials, or parent files.
- Subprocess timeouts and output size bounding (64KB).
- Automatic cleanup of containers (--rm) and host temporary directories.
- Safe argument lists passed to subprocess.run (never shell=True with concatenation).
- If Docker is unavailable, fails safely with an actionable setup message without host fallback.
"""

import os
import shutil
import subprocess
import tempfile
import time
import json
from typing import Dict, Any, List, Optional, Tuple
from app.coding.harness import prepare_code

# Environment variables for configurable images
CPP_IMAGE = os.environ.get("ORBIT_DOCKER_CPP_IMAGE", "gcc:13-bookworm")
PYTHON_IMAGE = os.environ.get("ORBIT_DOCKER_PYTHON_IMAGE", "python:3.11-slim")

MAX_OUTPUT_BYTES = 64 * 1024  # 64 KB
COMPILE_TIMEOUT_SECONDS = 15.0
RUN_TIMEOUT_SECONDS = 5.0

COMPARISON_RULES = (
    "Output Comparison Rules:\n"
    "1. Line Trailing Whitespace: Stripped automatically from each line.\n"
    "2. Line Endings: Standardized to UNIX LF (\\n).\n"
    "3. Empty Boundary Lines: Leading and trailing empty lines are removed.\n"
    "4. Structural Data: JSON arrays (e.g., [0, 1] vs [0,1]) and booleans (true/True) are compared by parsed semantic value.\n"
    "5. Floating Point: Compared within an absolute tolerance of 1e-5."
)


def normalize_output(text: str) -> str:
    """
    Normalizes program output for truthful comparison:
    - Standardizes CRLF to LF.
    - Strips trailing whitespace on each line.
    - Strips leading and trailing blank lines.
    """
    if not text:
        return ""
    # Standardize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Strip trailing whitespace on each line
    lines = [line.rstrip() for line in text.split("\n")]
    # Strip leading and trailing empty lines
    while lines and lines[0] == "":
        lines.pop(0)
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def parse_as_json_or_primitive(text: str) -> Any:
    """Tries parsing a string as JSON or standard Python literal."""
    stripped = text.strip()
    if not stripped:
        return None
    try:
        return json.loads(stripped)
    except Exception:
        # Handle python-style True/False
        if stripped == "True":
            return True
        if stripped == "False":
            return False
        return None


def compare_outputs(actual_raw: str, expected_raw: str) -> bool:
    """
    Compares program actual output against expected output according to comparison rules.
    """
    actual_norm = normalize_output(actual_raw)
    expected_norm = normalize_output(expected_raw)

    # 1. Exact normalized string match
    if actual_norm == expected_norm:
        return True

    # 2. Case-insensitive boolean match
    if actual_norm.lower() in ["true", "false"] and expected_norm.lower() in ["true", "false"]:
        return actual_norm.lower() == expected_norm.lower()

    # 3. Structural JSON comparison (e.g. [0, 1] vs [0,1])
    actual_json = parse_as_json_or_primitive(actual_norm)
    expected_json = parse_as_json_or_primitive(expected_norm)
    if actual_json is not None and expected_json is not None:
        if actual_json == expected_json:
            return True

    # 4. Numerical comparison (float tolerance)
    try:
        actual_val = float(actual_norm)
        expected_val = float(expected_norm)
        if abs(actual_val - expected_val) < 1e-5:
            return True
    except (ValueError, TypeError):
        pass

    return False


def truncate_output(text: str, max_bytes: int = MAX_OUTPUT_BYTES) -> Tuple[str, bool]:
    """Truncates output if it exceeds max_bytes, returning (truncated_text, was_truncated)."""
    if not text:
        return "", False
    encoded = text.encode("utf-8", errors="replace")
    if len(encoded) > max_bytes:
        truncated = encoded[:max_bytes].decode("utf-8", errors="ignore")
        return truncated + "\n... [Output truncated after 64KB limit]", True
    return text, False


class CodeRunner:
    COMPARISON_RULES = COMPARISON_RULES

    @classmethod
    def check_docker(cls) -> Dict[str, Any]:
        """
        Verifies whether Docker CLI is installed and the Docker daemon is responding.
        Returns a dictionary with status, version, and actionable setup instructions.
        """
        docker_path = shutil.which("docker")
        if not docker_path:
            return {
                "available": False,
                "error": "Docker executable not found in system PATH.",
                "actionable_setup": (
                    "Docker Desktop is required for secure sandboxed code execution.\n"
                    "1. Install Docker Desktop for Windows from: https://www.docker.com/products/docker-desktop/\n"
                    "2. Enable WSL 2 backend in Docker Desktop settings.\n"
                    "3. Start Docker Desktop and ensure the engine status shows 'Engine running'.\n"
                    "4. Pre-pull the required sandbox images before going offline:\n"
                    f"   docker pull {CPP_IMAGE}\n"
                    f"   docker pull {PYTHON_IMAGE}\n"
                    "Untrusted code cannot be executed directly on the host without container isolation."
                )
            }

        try:
            # Check if docker daemon is running
            result = subprocess.run(
                ["docker", "version", "--format", "{{.Server.Version}}"],
                capture_output=True,
                text=True,
                timeout=3.0
            )
            if result.returncode != 0:
                return {
                    "available": False,
                    "error": f"Docker CLI found, but daemon is not responding: {result.stderr.strip() or 'Cannot connect to Docker daemon'}",
                    "actionable_setup": (
                        "Docker is installed, but the Docker daemon is not running.\n"
                        "1. Open Docker Desktop on Windows.\n"
                        "2. Wait until the whale icon in the taskbar becomes steady and states 'Engine running'.\n"
                        "3. Pre-pull the required sandbox images:\n"
                        f"   docker pull {CPP_IMAGE}\n"
                        f"   docker pull {PYTHON_IMAGE}"
                    )
                }

            version = result.stdout.strip()
            return {
                "available": True,
                "version": version,
                "error": None,
                "actionable_setup": None
            }
        except subprocess.TimeoutExpired:
            return {
                "available": False,
                "error": "Docker daemon connection timed out.",
                "actionable_setup": "Please start or restart Docker Desktop on Windows."
            }
        except Exception as e:
            return {
                "available": False,
                "error": f"Failed to check Docker status: {str(e)}",
                "actionable_setup": "Verify Docker Desktop is installed and running."
            }

    @classmethod
    def execute(
        cls,
        language: str,
        code: str,
        problem_id: Optional[str] = None,
        test_cases: Optional[List[Dict[str, Any]]] = None,
        custom_input: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes C++17 or Python 3.11 code inside a secure Docker container boundary.
        Fails safely without host fallback if Docker is unavailable.
        """
        # 1. Validate language
        lang = (language or "").strip().lower()
        if lang not in ["cpp", "python"]:
            return {
                "success": False,
                "docker_available": False,
                "status": "unsupported_language",
                "error": f"Unsupported language '{language}'. Permitted languages: 'cpp', 'python'.",
                "passed_count": 0,
                "total_count": 0,
                "results": [],
                "comparison_rules": cls.COMPARISON_RULES
            }

        # 2. Check Docker availability
        docker_status = cls.check_docker()
        if not docker_status["available"]:
            total_cases = len(test_cases) if test_cases else (1 if custom_input is not None else 0)
            return {
                "success": False,
                "docker_available": False,
                "status": "docker_unavailable",
                "error": docker_status["error"],
                "actionable_setup": docker_status["actionable_setup"],
                "passed_count": 0,
                "total_count": total_cases,
                "results": [],
                "comparison_rules": cls.COMPARISON_RULES
            }

        # 3. Prepare test cases
        prepared_cases = []
        if test_cases and len(test_cases) > 0:
            for idx, tc in enumerate(test_cases):
                prepared_cases.append({
                    "id": idx + 1,
                    "input": str(tc.get("input", "")),
                    "expected": str(tc.get("output", tc.get("expected", ""))),
                    "explanation": tc.get("explanation", "")
                })
        elif custom_input is not None:
            prepared_cases.append({
                "id": 1,
                "input": custom_input,
                "expected": None,
                "explanation": "Custom user input"
            })
        else:
            prepared_cases.append({
                "id": 1,
                "input": "",
                "expected": None,
                "explanation": "Default execution without input"
            })

        # 4. Execute within temporary workspace
        with tempfile.TemporaryDirectory(prefix="orbit_sandbox_") as temp_dir:
            if lang == "cpp":
                return cls._execute_cpp(temp_dir, code, problem_id, prepared_cases)
            else:
                return cls._execute_python(temp_dir, code, problem_id, prepared_cases)

    @classmethod
    def _execute_cpp(
        cls,
        temp_dir: str,
        code: str,
        problem_id: Optional[str],
        prepared_cases: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Compiles and executes C++17 inside the Docker container boundary.
        """
        # Determine if we can compile a single binary for all cases or need case-by-case harness
        # If user code has main() or problem has no harness, compile once
        first_input = prepared_cases[0]["input"] if prepared_cases else ""
        prepared_first_code = prepare_code("cpp", code, problem_id, first_input)

        src_path = os.path.join(temp_dir, "solution.cpp")
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(prepared_first_code)

        # Step A: Compile inside Docker
        compile_cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "512m",
            "--cpus", "1.0",
            "--security-opt", "no-new-privileges",
            "--cap-drop", "ALL",
            "-v", f"{temp_dir}:/workspace:rw",
            "-w", "/workspace",
            CPP_IMAGE,
            "g++", "-O2", "-std=c++17", "-Wall", "-Wextra", "solution.cpp", "-o", "solution"
        ]

        try:
            comp_res = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=COMPILE_TIMEOUT_SECONDS
            )
            if comp_res.returncode != 0:
                raw_compiler_err, _ = truncate_output(comp_res.stderr)
                return {
                    "success": False,
                    "docker_available": True,
                    "status": "compile_error",
                    "compiler_output": raw_compiler_err,
                    "error": "C++ compilation failed with non-zero exit code.",
                    "passed_count": 0,
                    "total_count": len(prepared_cases),
                    "results": [],
                    "comparison_rules": cls.COMPARISON_RULES
                }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "docker_available": True,
                "status": "compile_error",
                "compiler_output": f"Compilation timed out after {COMPILE_TIMEOUT_SECONDS}s.",
                "error": "Compiler timeout.",
                "passed_count": 0,
                "total_count": len(prepared_cases),
                "results": [],
                "comparison_rules": cls.COMPARISON_RULES
            }

        # Step B: Execute each test case
        results = []
        passed_count = 0

        for case in prepared_cases:
            # If problem required specific per-case harness recompilation:
            if case["id"] > 1 and problem_id and not ("int main" in code):
                case_code = prepare_code("cpp", code, problem_id, case["input"])
                with open(src_path, "w", encoding="utf-8") as f:
                    f.write(case_code)
                sub_comp = subprocess.run(compile_cmd, capture_output=True, text=True, timeout=COMPILE_TIMEOUT_SECONDS)
                if sub_comp.returncode != 0:
                    results.append({
                        "test_case_id": case["id"],
                        "input": case["input"],
                        "expected": case["expected"],
                        "actual": "",
                        "error": sub_comp.stderr,
                        "status": "compile_error",
                        "passed": False,
                        "execution_time_ms": 0.0,
                        "exit_code": sub_comp.returncode
                    })
                    continue

            exec_cmd = [
                "docker", "run", "--rm", "-i",
                "--network", "none",
                "--memory", "256m",
                "--memory-swap", "256m",
                "--cpus", "1.0",
                "--pids-limit", "64",
                "--security-opt", "no-new-privileges",
                "--cap-drop", "ALL",
                "-v", f"{temp_dir}:/workspace:ro",
                "-w", "/workspace",
                CPP_IMAGE,
                "./solution"
            ]

            start_t = time.perf_counter()
            try:
                run_res = subprocess.run(
                    exec_cmd,
                    input=case["input"],
                    capture_output=True,
                    text=True,
                    timeout=RUN_TIMEOUT_SECONDS
                )
                elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)
                stdout_text, _ = truncate_output(run_res.stdout)
                stderr_text, _ = truncate_output(run_res.stderr)

                if run_res.returncode != 0:
                    results.append({
                        "test_case_id": case["id"],
                        "input": case["input"],
                        "expected": case["expected"],
                        "actual": stdout_text,
                        "error": stderr_text or f"Process terminated with exit code {run_res.returncode}",
                        "status": "runtime_error",
                        "passed": False,
                        "execution_time_ms": elapsed_ms,
                        "exit_code": run_res.returncode
                    })
                else:
                    is_pass = False
                    status_name = "completed"
                    if case["expected"] is not None:
                        is_pass = compare_outputs(stdout_text, case["expected"])
                        status_name = "passed" if is_pass else "wrong_answer"
                        if is_pass:
                            passed_count += 1

                    results.append({
                        "test_case_id": case["id"],
                        "input": case["input"],
                        "expected": case["expected"],
                        "actual": stdout_text,
                        "error": stderr_text if stderr_text.strip() else None,
                        "status": status_name,
                        "passed": is_pass,
                        "execution_time_ms": elapsed_ms,
                        "exit_code": 0
                    })

            except subprocess.TimeoutExpired:
                results.append({
                    "test_case_id": case["id"],
                    "input": case["input"],
                    "expected": case["expected"],
                    "actual": "",
                    "error": f"Time Limit Exceeded ({RUN_TIMEOUT_SECONDS}s)",
                    "status": "timeout",
                    "passed": False,
                    "execution_time_ms": RUN_TIMEOUT_SECONDS * 1000,
                    "exit_code": -1
                })

        overall_status = "passed" if (passed_count == len(prepared_cases) and len(prepared_cases) > 0) else "wrong_answer"
        if not any(case["expected"] is not None for case in prepared_cases):
            overall_status = "completed"

        return {
            "success": True,
            "docker_available": True,
            "status": overall_status,
            "passed_count": passed_count,
            "total_count": len(prepared_cases),
            "compiler_output": comp_res.stderr if comp_res.stderr.strip() else None,
            "results": results,
            "comparison_rules": cls.COMPARISON_RULES
        }

    @classmethod
    def _execute_python(
        cls,
        temp_dir: str,
        code: str,
        problem_id: Optional[str],
        prepared_cases: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes Python 3.11 inside the Docker container boundary.
        """
        results = []
        passed_count = 0
        src_path = os.path.join(temp_dir, "solution.py")

        for case in prepared_cases:
            case_code = prepare_code("python", code, problem_id, case["input"])
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(case_code)

            exec_cmd = [
                "docker", "run", "--rm", "-i",
                "--network", "none",
                "--memory", "256m",
                "--memory-swap", "256m",
                "--cpus", "1.0",
                "--pids-limit", "64",
                "--security-opt", "no-new-privileges",
                "--cap-drop", "ALL",
                "-v", f"{temp_dir}:/workspace:ro",
                "-w", "/workspace",
                PYTHON_IMAGE,
                "python3", "-u", "solution.py"
            ]

            start_t = time.perf_counter()
            try:
                run_res = subprocess.run(
                    exec_cmd,
                    input=case["input"],
                    capture_output=True,
                    text=True,
                    timeout=RUN_TIMEOUT_SECONDS
                )
                elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)
                stdout_text, _ = truncate_output(run_res.stdout)
                stderr_text, _ = truncate_output(run_res.stderr)

                if run_res.returncode != 0:
                    status_name = "syntax_error" if "SyntaxError" in stderr_text else "runtime_error"
                    results.append({
                        "test_case_id": case["id"],
                        "input": case["input"],
                        "expected": case["expected"],
                        "actual": stdout_text,
                        "error": stderr_text or f"Python exited with error code {run_res.returncode}",
                        "status": status_name,
                        "passed": False,
                        "execution_time_ms": elapsed_ms,
                        "exit_code": run_res.returncode
                    })
                else:
                    is_pass = False
                    status_name = "completed"
                    if case["expected"] is not None:
                        is_pass = compare_outputs(stdout_text, case["expected"])
                        status_name = "passed" if is_pass else "wrong_answer"
                        if is_pass:
                            passed_count += 1

                    results.append({
                        "test_case_id": case["id"],
                        "input": case["input"],
                        "expected": case["expected"],
                        "actual": stdout_text,
                        "error": stderr_text if stderr_text.strip() else None,
                        "status": status_name,
                        "passed": is_pass,
                        "execution_time_ms": elapsed_ms,
                        "exit_code": 0
                    })

            except subprocess.TimeoutExpired:
                results.append({
                    "test_case_id": case["id"],
                    "input": case["input"],
                    "expected": case["expected"],
                    "actual": "",
                    "error": f"Time Limit Exceeded ({RUN_TIMEOUT_SECONDS}s)",
                    "status": "timeout",
                    "passed": False,
                    "execution_time_ms": RUN_TIMEOUT_SECONDS * 1000,
                    "exit_code": -1
                })

        overall_status = "passed" if (passed_count == len(prepared_cases) and len(prepared_cases) > 0) else "wrong_answer"
        if not any(case["expected"] is not None for case in prepared_cases):
            overall_status = "completed"

        return {
            "success": True,
            "docker_available": True,
            "status": overall_status,
            "passed_count": passed_count,
            "total_count": len(prepared_cases),
            "compiler_output": None,
            "results": results,
            "comparison_rules": cls.COMPARISON_RULES
        }
