"""
ORBIT AI — Phase 5: Catalog Search, Recommendation & Hugging Face Integration Service.
Provides hardware-aware model ranking, memory calculations, task matching,
and offline-first cached catalogue operations.
"""

import httpx
from typing import Dict, Any, List, Optional
from app.models.catalog_data import CATALOG_MODELS, HARDWARE_PRESETS


class ModelCatalogService:
    """
    Search, recommendation, and metadata resolution service for local & open-weight models.
    """

    @classmethod
    def search_catalog(
        cls,
        query: Optional[str] = None,
        task: Optional[str] = None,
        modality: Optional[str] = None,
        publisher: Optional[str] = None,
        max_size_gb: Optional[float] = None,
        fits_vram_gb: Optional[float] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Filters and paginates models from the verified catalog.
        """
        results = list(CATALOG_MODELS)

        if query:
            q_clean = query.lower().strip()
            results = [
                m for m in results
                if q_clean in m["name"].lower()
                or q_clean in m["publisher"].lower()
                or q_clean in m["family"].lower()
                or q_clean in m["description"].lower()
                or q_clean in m.get("ollama_tag", "").lower()
            ]

        if task and task != "all":
            results = [m for m in results if task in m.get("tasks", [])]

        if modality and modality != "all":
            results = [m for m in results if modality in m.get("modalities", [])]

        if publisher and publisher != "all":
            results = [m for m in results if m.get("publisher", "").lower() == publisher.lower()]

        if max_size_gb:
            results = [m for m in results if (m.get("size_bytes", 0) / (1024**3)) <= max_size_gb]

        if fits_vram_gb:
            results = [m for m in results if m.get("vram_rec_gb", 999.0) <= fits_vram_gb]

        total = len(results)
        start_idx = (page - 1) * page_size
        paginated = results[start_idx : start_idx + page_size]

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
            "models": paginated
        }

    @classmethod
    def get_model_details(cls, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches detailed model card by ID or Ollama tag.
        """
        for m in CATALOG_MODELS:
            if m["id"] == model_id or m.get("ollama_tag") == model_id:
                return m
        return None

    @classmethod
    def recommend_models(
        cls,
        task: str = "coding",
        ram_gb: float = 16.0,
        vram_gb: float = 6.0,
        disk_free_gb: float = 100.0,
        speed_preference: str = "balanced",  # "fast", "balanced", "quality"
        license_constraint: str = "any"     # "any", "permissive"
    ) -> Dict[str, Any]:
        """
        Computes hardware-aware ranked recommendations for the user's specific setup.
        Accounts for user's starting profile: HP Victus i7 + RTX 3050 (6GB VRAM, 16GB RAM).
        """
        task_clean = task.lower().strip()
        scored_candidates = []

        for model in CATALOG_MODELS:
            # 1. Skip non-generative models for generative tasks
            if "embedding" in model.get("tasks", []) and task_clean != "rag":
                continue

            # 2. Check disk space
            model_size_gb = model.get("size_bytes", 0) / (1024**3)
            if model_size_gb > disk_free_gb:
                continue

            # 3. Check license
            if license_constraint == "permissive":
                lic = model.get("license", "").lower()
                if "apache" not in lic and "mit" not in lic:
                    continue

            # 4. Evaluate Memory Compatibility
            rec_vram = model.get("vram_rec_gb", 8.0)
            min_ram = model.get("ram_min_gb", 8.0)

            fits_in_gpu = vram_gb >= rec_vram
            fits_in_system = ram_gb >= min_ram

            if not fits_in_system:
                continue  # Out of memory even with CPU offload

            # Compute execution profile
            if fits_in_gpu:
                fit_status = "Full GPU Acceleration"
                fit_badge = "fit_gpu"
                speed_estimate = "Fast (45-80 tokens/sec)"
                compromise = "Minimal; full model weights loaded into GPU VRAM."
            else:
                fit_status = "Partial CPU/RAM Offload"
                fit_badge = "fit_hybrid"
                speed_estimate = "Moderate (10-25 tokens/sec)"
                compromise = "Model weights exceed 6GB VRAM; will offload layers to system RAM. Expect moderate generation speeds."

            # 5. Compute Task Fit Score (0 - 100)
            score = 50.0

            # Task affinity
            tasks = model.get("tasks", [])
            if task_clean in tasks:
                score += 30.0
            elif task_clean == "coding" and "coding" in tasks:
                score += 30.0
            elif task_clean == "dsa_tutor" and ("coding" in tasks or "dsa_tutor" in tasks):
                score += 28.0
            elif task_clean == "full_stack_dev" and "coding" in tasks:
                score += 25.0
            elif task_clean == "reasoning" and "reasoning" in tasks:
                score += 28.0
            elif task_clean == "rag" and ("rag" in tasks or "summarization" in tasks):
                score += 26.0

            # Speed preference weighting
            if speed_preference == "fast":
                if model_size_gb <= 2.5:
                    score += 15.0
                elif model_size_gb <= 5.0:
                    score += 5.0
            elif speed_preference == "quality":
                if model_size_gb >= 4.5:
                    score += 15.0
            else:  # balanced
                if 2.0 <= model_size_gb <= 5.0:
                    score += 15.0

            # GPU fit bonus
            if fits_in_gpu:
                score += 10.0

            # Generate bespoke rationale
            why_recommended = (
                f"Selected for '{task_clean}' on your {vram_gb:.0f}GB VRAM / {ram_gb:.0f}GB RAM configuration. "
                f"{model.get('description', '')}"
            )

            scored_candidates.append({
                "model_id": model["id"],
                "name": model["name"],
                "publisher": model["publisher"],
                "family": model["family"],
                "ollama_tag": model.get("ollama_tag"),
                "score": round(score, 1),
                "parameter_size": model["parameter_size"],
                "download_size": model["size_display"],
                "memory_fit": fit_status,
                "fit_badge": fit_badge,
                "speed_estimate": speed_estimate,
                "why_recommended": why_recommended,
                "expected_compromise": compromise,
                "resource_requirements": {
                    "vram_recommended_gb": rec_vram,
                    "ram_minimum_gb": min_ram,
                    "disk_gb": round(model_size_gb, 2)
                },
                "supports_task": task_clean in tasks or "coding" in tasks,
                "offline_ready": True,
                "install_command": model.get("learning_guide", {}).get("local_setup_command", f"ollama run {model.get('ollama_tag')}")
            })

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        top_shortlist = scored_candidates[:4]

        return {
            "task": task_clean,
            "hardware_evaluated": {
                "system_ram_gb": ram_gb,
                "vram_gb": vram_gb,
                "disk_free_gb": disk_free_gb,
                "preset_match": "HP Victus Laptop (RTX 3050 6GB VRAM)" if (ram_gb == 16.0 and vram_gb == 6.0) else "Custom Hardware Profile"
            },
            "disclaimer": (
                "Hardware compatibility calculations are based on verified GGUF Q4 quantization metrics. "
                "Actual tokens/sec throughput depends on GPU power limits, thermal throttling, background OS memory, and driver CUDA configuration."
            ),
            "recommendations": top_shortlist
        }

    @classmethod
    async def query_huggingface_hub(cls, query: str = "code", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Queries Hugging Face Hub metadata API for broader open-weights discovery.
        Falls back gracefully with timeout/connection handling.
        """
        url = f"https://huggingface.co/api/models?search={query}&limit={limit}&full=true"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    formatted = []
                    for item in data:
                        model_id = item.get("id") or item.get("modelId", "")
                        formatted.append({
                            "id": f"hf:{model_id}",
                            "name": model_id.split("/")[-1],
                            "publisher": model_id.split("/")[0] if "/" in model_id else "Community",
                            "family": "Hugging Face Hub",
                            "source": "huggingface",
                            "downloads": item.get("downloads", 0),
                            "likes": item.get("likes", 0),
                            "pipeline_tag": item.get("pipeline_tag", "text-generation"),
                            "license": item.get("cardData", {}).get("license", "Open-Weights"),
                            "tags": item.get("tags", [])[:5],
                            "url": f"https://huggingface.co/{model_id}"
                        })
                    return formatted
        except Exception:
            pass

        # Graceful fallback: return curated popular HF models
        return [
            {
                "id": "hf:Qwen/Qwen2.5-Coder-7B-Instruct",
                "name": "Qwen2.5-Coder-7B-Instruct",
                "publisher": "Qwen",
                "family": "Hugging Face Hub (Cached)",
                "source": "huggingface_cached",
                "downloads": 1450000,
                "likes": 4200,
                "pipeline_tag": "text-generation",
                "license": "Apache-2.0",
                "tags": ["code", "instruct", "qwen"],
                "url": "https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct"
            },
            {
                "id": "hf:deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
                "name": "DeepSeek-R1-Distill-Qwen-7B",
                "publisher": "deepseek-ai",
                "family": "Hugging Face Hub (Cached)",
                "source": "huggingface_cached",
                "downloads": 890000,
                "likes": 3100,
                "pipeline_tag": "text-generation",
                "license": "MIT",
                "tags": ["reasoning", "math", "deepseek-r1"],
                "url": "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
            }
        ]
