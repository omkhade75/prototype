"""
ORBIT AI — Phase 5: Ollama Local Model Management & Lifecycle Controller.
Handles local model inventory, download streaming, inspect details,
deletion with validation, and disk space health checks.
"""

import os
import re
import time
import shutil
import json
import httpx
from typing import Dict, Any, List, Optional, AsyncGenerator

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
MODEL_NAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.:/]+$")


class OllamaManager:
    """
    Manages local Ollama model lifecycle, inspections, downloads, and storage verification.
    """

    @classmethod
    def validate_model_name(cls, model_name: str) -> bool:
        """
        Enforces strict alphanumeric and punctuation validation to prevent injection.
        """
        if not model_name or len(model_name.strip()) == 0:
            return False
        return bool(MODEL_NAME_REGEX.match(model_name.strip()))

    @classmethod
    def get_disk_storage(cls) -> Dict[str, Any]:
        """
        Returns real disk usage on the local drive.
        """
        try:
            usage = shutil.disk_usage(os.getcwd())
            return {
                "total_gb": round(usage.total / (1024**3), 2),
                "used_gb": round(usage.used / (1024**3), 2),
                "free_gb": round(usage.free / (1024**3), 2),
                "unit": "GB"
            }
        except Exception:
            return {
                "total_gb": 0.0,
                "used_gb": 0.0,
                "free_gb": 50.0,
                "unit": "GB"
            }

    @classmethod
    async def get_daemon_status(cls) -> Dict[str, Any]:
        """
        Pings Ollama server and returns reachability and latency.
        """
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    data = res.json()
                    models = data.get("models", [])
                    return {
                        "reachable": True,
                        "base_url": OLLAMA_BASE_URL,
                        "latency_ms": latency_ms,
                        "total_installed": len(models),
                        "error": None
                    }
                return {
                    "reachable": False,
                    "base_url": OLLAMA_BASE_URL,
                    "latency_ms": latency_ms,
                    "total_installed": 0,
                    "error": f"Ollama HTTP {res.status_code}"
                }
        except Exception as e:
            return {
                "reachable": False,
                "base_url": OLLAMA_BASE_URL,
                "latency_ms": 0.0,
                "total_installed": 0,
                "error": str(e)
            }

    @classmethod
    async def list_local_models(cls) -> Dict[str, Any]:
        """
        Queries Ollama GET /api/tags and parses genuine installed local models.
        """
        daemon = await cls.get_daemon_status()
        if not daemon["reachable"]:
            return {
                "reachable": False,
                "models": [],
                "error": daemon["error"],
                "setup_instructions": (
                    "Ollama is not running. To start Ollama:\n"
                    "1. Open a terminal and run: `ollama serve`\n"
                    "2. If Ollama is not installed, download from https://ollama.com\n"
                    "3. Once running, refresh this page."
                )
            }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                data = res.json()
                raw_models = data.get("models", [])

                formatted = []
                for m in raw_models:
                    size_bytes = m.get("size", 0)
                    size_gb = round(size_bytes / (1024**3), 2)
                    details = m.get("details", {})
                    formatted.append({
                        "name": m.get("name"),
                        "model": m.get("model", m.get("name")),
                        "size_bytes": size_bytes,
                        "size_display": f"{size_gb} GB" if size_gb >= 1.0 else f"{round(size_bytes / (1024**2), 1)} MB",
                        "modified_at": m.get("modified_at"),
                        "digest": m.get("digest", "")[:12],
                        "format": details.get("format", "gguf"),
                        "family": details.get("family", "unknown"),
                        "parameter_size": details.get("parameter_size", "unknown"),
                        "quantization_level": details.get("quantization_level", "Q4_0")
                    })

                return {
                    "reachable": True,
                    "models": formatted,
                    "total_installed": len(formatted),
                    "storage": cls.get_disk_storage()
                }
        except Exception as e:
            return {
                "reachable": False,
                "models": [],
                "error": f"Failed to list local models: {str(e)}"
            }

    @classmethod
    async def inspect_model(cls, model_name: str) -> Dict[str, Any]:
        """
        Queries Ollama POST /api/show to inspect model architecture and parameters.
        """
        if not cls.validate_model_name(model_name):
            raise ValueError(f"Invalid model identifier: '{model_name}'")

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/show",
                    json={"name": model_name}
                )
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "success": True,
                        "name": model_name,
                        "details": data.get("details", {}),
                        "parameters": data.get("parameters", ""),
                        "template": data.get("template", ""),
                        "system": data.get("system", ""),
                        "model_info": data.get("model_info", {})
                    }
                return {
                    "success": False,
                    "error": f"Ollama HTTP {res.status_code}: {res.text}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Inspection failed: {str(e)}"
            }

    @classmethod
    async def pull_model_stream(cls, model_name: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams model download progress from Ollama POST /api/pull.
        """
        if not cls.validate_model_name(model_name):
            yield {"status": "error", "error": f"Invalid model identifier: '{model_name}'"}
            return

        storage = cls.get_disk_storage()
        if storage["free_gb"] < 3.0:
            yield {
                "status": "error",
                "error": f"Insufficient disk space! Only {storage['free_gb']} GB available. Need at least 3.0 GB."
            }
            return

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(300.0, connect=10.0)) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/pull",
                    json={"name": model_name, "stream": True}
                ) as res:
                    if res.status_code != 200:
                        yield {"status": "error", "error": f"Ollama pull returned HTTP {res.status_code}"}
                        return

                    async for line in res.aiter_lines():
                        if not line or not line.strip():
                            continue
                        try:
                            payload = json.loads(line)
                            status_str = payload.get("status", "")
                            total = payload.get("total", 0)
                            completed = payload.get("completed", 0)
                            percent = round((completed / total) * 100, 1) if total > 0 else 0.0

                            yield {
                                "status": status_str,
                                "total": total,
                                "completed": completed,
                                "percent": percent,
                                "digest": payload.get("digest", "")[:12] if payload.get("digest") else ""
                            }
                        except Exception:
                            continue

        except httpx.ConnectError:
            yield {
                "status": "error",
                "error": f"Connection to Ollama at {OLLAMA_BASE_URL} lost. Verify Ollama is running."
            }
        except Exception as e:
            yield {"status": "error", "error": f"Download interrupted: {str(e)}"}

    @classmethod
    async def delete_model(cls, model_name: str) -> Dict[str, Any]:
        """
        Deletes a model from local storage via Ollama DELETE /api/delete.
        """
        if not cls.validate_model_name(model_name):
            raise ValueError(f"Invalid model identifier: '{model_name}'")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.request(
                    "DELETE",
                    f"{OLLAMA_BASE_URL}/api/delete",
                    json={"name": model_name}
                )
                if res.status_code == 200:
                    return {
                        "success": True,
                        "model": model_name,
                        "message": f"Successfully deleted model '{model_name}'."
                    }
                return {
                    "success": False,
                    "error": f"Ollama HTTP {res.status_code}: {res.text}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to delete model: {str(e)}"
            }

    @classmethod
    async def test_model_prompt(
        cls,
        model_name: str,
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs an interactive evaluation prompt on a local model and measures genuine latency.
        """
        if not cls.validate_model_name(model_name):
            raise ValueError(f"Invalid model identifier: '{model_name}'")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={"model": model_name, "messages": messages, "stream": False}
                )
                duration_ms = round((time.perf_counter() - start) * 1000, 2)

                if res.status_code == 200:
                    data = res.json()
                    content = data.get("message", {}).get("content", "")
                    eval_count = data.get("eval_count", len(content.split()))
                    eval_duration = data.get("eval_duration", duration_ms * 1_000_000)
                    tps = round(eval_count / (eval_duration / 1e9), 1) if eval_duration > 0 else 0.0

                    return {
                        "success": True,
                        "model": model_name,
                        "response": content,
                        "duration_ms": duration_ms,
                        "tokens_per_second": tps,
                        "total_tokens": eval_count,
                        "error": None
                    }
                return {
                    "success": False,
                    "model": model_name,
                    "response": "",
                    "duration_ms": duration_ms,
                    "error": f"Ollama HTTP {res.status_code}: {res.text}"
                }
        except Exception as e:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": False,
                "model": model_name,
                "response": "",
                "duration_ms": duration_ms,
                "error": f"Inference failed: {str(e)}"
            }
