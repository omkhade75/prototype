"""
ORBIT AI — Phase 4B: Secure & Container-Isolated Command Runner.
Enforces genuine container isolation for untrusted generated code,
Docker availability checks, resource caps, network isolation,
and strict rejection of unsandboxed host execution without explicit override.
"""

import time
import subprocess
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.engineer.security import is_safe_command, resolve_canonical_path
from app.coding.runner import CodeRunner

NODE_CONTAINER_IMAGE = "node:20-alpine"


class SafeCommandRunner:
    """
    Sandboxed execution engine enforcing container isolation, resource caps,
    network restriction, and binary allowlisting.
    """

    @classmethod
    def check_isolation_environment(cls) -> Dict[str, Any]:
        """
        Inspects whether Docker container isolation is available on the system.
        Reuses the existing CodeRunner Docker verification logic.
        """
        return CodeRunner.check_docker()

    @classmethod
    def run_command(
        cls,
        workspace_root: str,
        command: str,
        args: Optional[List[str]] = None,
        timeout_seconds: float = 30.0,
        require_isolation: bool = True,
        allow_host_override: bool = False,
        network_allowed: bool = False
    ) -> Dict[str, Any]:
        """
        Executes a development command with strict container isolation when available.
        If Docker is unavailable and require_isolation is True without host override,
        safely refuses execution with an actionable setup guide.
        """
        args_list = args or []
        is_safe, err_msg = is_safe_command(command, args_list)
        if not is_safe:
            return {
                "success": False,
                "isolated": False,
                "command": f"{command} {' '.join(args_list)}",
                "exit_code": -1,
                "stdout": "",
                "stderr": err_msg,
                "duration_ms": 0.0,
                "timed_out": False
            }

        ws_dir = resolve_canonical_path(workspace_root, "")
        docker_status = cls.check_isolation_environment()
        docker_available = docker_status.get("available", False)

        # 1. Preferred Path: Genuine Container Isolation
        if docker_available:
            return cls._run_containerized(
                ws_dir=ws_dir,
                command=command,
                args_list=args_list,
                timeout_seconds=timeout_seconds,
                network_allowed=network_allowed
            )

        # 2. Docker is unavailable: Enforce Security Boundary
        if require_isolation and not allow_host_override:
            return {
                "success": False,
                "isolated": False,
                "docker_available": False,
                "command": f"{command} {' '.join(args_list)}",
                "exit_code": -1,
                "stdout": "",
                "stderr": (
                    "Execution Refused: Docker container isolation is required to safely run untrusted generated code.\n"
                    "Direct host execution of arbitrary project code is disabled by security policy.\n"
                    f"{docker_status.get('actionable_setup', '')}"
                ),
                "duration_ms": 0.0,
                "timed_out": False,
                "actionable_setup": docker_status.get("actionable_setup")
            }

        # 3. Explicit Development Host Override (with visible security warning)
        return cls._run_host_with_warning(
            ws_dir=ws_dir,
            command=command,
            args_list=args_list,
            timeout_seconds=timeout_seconds
        )

    @classmethod
    def _run_containerized(
        cls,
        ws_dir: Path,
        command: str,
        args_list: List[str],
        timeout_seconds: float,
        network_allowed: bool
    ) -> Dict[str, Any]:
        """
        Runs inside an isolated Docker container with strict memory, CPU, PID and network limits.
        Only the project workspace directory is mounted. Host roots and Docker sockets are NEVER mounted.
        """
        docker_cmd = [
            "docker", "run", "--rm",
            "-v", f"{str(ws_dir)}:/workspace:rw",
            "-w", "/workspace",
            "-m", "512m",
            "--cpus", "1.0",
            "--pids-limit", "64",
            "--cap-drop=ALL"
        ]

        if not network_allowed:
            docker_cmd.append("--network=none")

        docker_cmd.extend([NODE_CONTAINER_IMAGE, command] + args_list)

        start_time = time.perf_counter()
        try:
            proc = subprocess.run(
                docker_cmd,
                shell=False,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                encoding="utf-8",
                errors="replace"
            )

            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": proc.returncode == 0,
                "isolated": True,
                "isolation_engine": "docker",
                "command": f"{command} {' '.join(args_list)}",
                "exit_code": proc.returncode,
                "stdout": proc.stdout.strip(),
                "stderr": proc.stderr.strip(),
                "duration_ms": duration_ms,
                "timed_out": False
            }

        except subprocess.TimeoutExpired as te:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            stdout = te.stdout or ""
            stderr = te.stderr or ""
            return {
                "success": False,
                "isolated": True,
                "isolation_engine": "docker",
                "command": f"{command} {' '.join(args_list)}",
                "exit_code": -1,
                "stdout": str(stdout).strip(),
                "stderr": f"Container execution timed out after {timeout_seconds}s.\n{stderr}".strip(),
                "duration_ms": duration_ms,
                "timed_out": True
            }

        except Exception as e:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": False,
                "isolated": False,
                "command": f"{command} {' '.join(args_list)}",
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Container execution error: {str(e)}",
                "duration_ms": duration_ms,
                "timed_out": False
            }

    @classmethod
    def _run_host_with_warning(
        cls,
        ws_dir: Path,
        command: str,
        args_list: List[str],
        timeout_seconds: float
    ) -> Dict[str, Any]:
        """
        Executes on host OS when explicitly authorized under development override.
        Clearly tags the result with isolation: False and a prominent security warning.
        """
        cmd_full = [command] + args_list
        start_time = time.perf_counter()

        try:
            proc = subprocess.run(
                cmd_full,
                cwd=str(ws_dir),
                shell=False,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                encoding="utf-8",
                errors="replace"
            )

            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": proc.returncode == 0,
                "isolated": False,
                "warning": "Warning: Executed on host operating system under explicit development override without container isolation. Container sandbox was inactive.",
                "host_execution_warning": "Warning: Executed on host operating system under explicit development override without container isolation. Container sandbox was inactive.",
                "command": f"{command} {' '.join(args_list)}",
                "exit_code": proc.returncode,
                "stdout": proc.stdout.strip(),
                "stderr": proc.stderr.strip(),
                "duration_ms": duration_ms,
                "timed_out": False
            }

        except subprocess.TimeoutExpired as te:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            stdout = te.stdout or ""
            stderr = te.stderr or ""
            return {
                "success": False,
                "isolated": False,
                "command": f"{command} {' '.join(args_list)}",
                "exit_code": -1,
                "stdout": str(stdout).strip(),
                "stderr": f"Execution timed out after {timeout_seconds}s.\n{stderr}".strip(),
                "duration_ms": duration_ms,
                "timed_out": True
            }

        except Exception as e:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": False,
                "isolated": False,
                "command": f"{command} {' '.join(args_list)}",
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Host execution error: {str(e)}",
                "duration_ms": duration_ms,
                "timed_out": False
            }
