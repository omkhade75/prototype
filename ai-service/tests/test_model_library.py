"""
ORBIT AI — Phase 5: Comprehensive Test Suite for AI Model Library & Learning Center.
Tests catalog search, filtering, pagination, model card retrieval,
hardware recommendation engine (including HP Victus preset), model name validation,
disk storage calculation, mocked Ollama local operations, and FastAPI endpoints.
"""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.models.catalog_service import ModelCatalogService
from app.models.ollama_manager import OllamaManager
from app.models.catalog_data import HARDWARE_PRESETS

client = TestClient(app)


def test_catalog_listing_and_pagination():
    """Verify catalog pagination returns correct slices and total counts."""
    res = ModelCatalogService.search_catalog(page=1, page_size=4)
    assert res["total"] >= 10
    assert len(res["models"]) == 4
    assert res["page"] == 1
    assert res["page_size"] == 4
    assert res["total_pages"] >= 3

    page2 = ModelCatalogService.search_catalog(page=2, page_size=4)
    assert len(page2["models"]) == 4
    assert page2["models"][0]["id"] != res["models"][0]["id"]


def test_catalog_search_and_filtering():
    """Verify keyword search and task/modality/parameter filtering."""
    # Search by keyword
    search_res = ModelCatalogService.search_catalog(query="coder")
    assert any("coder" in item["id"].lower() for item in search_res["models"])

    # Filter by task
    coding_res = ModelCatalogService.search_catalog(task="coding")
    for item in coding_res["models"]:
        assert "coding" in item.get("tasks", []) or "coder" in item["id"].lower()

    # Filter by modality
    code_modality_res = ModelCatalogService.search_catalog(modality="code")
    assert any("code" in item.get("modalities", []) for item in code_modality_res["models"])


def test_model_card_and_learning_guide():
    """Verify retrieval of detailed model card and pedagogical guide."""
    card = ModelCatalogService.get_model_details("qwen2.5-coder:7b")
    assert card is not None
    assert "Qwen 2.5 Coder" in card["name"]
    assert "learning_guide" in card
    guide = card["learning_guide"]
    assert "strengths" in guide
    assert "limitations" in guide
    assert "prompt_pattern" in guide
    assert "orbit_workflow" in guide
    assert len(guide["strengths"]) > 0

    missing = ModelCatalogService.get_model_details("unknown-model-xyz")
    assert missing is None


def test_hardware_recommendations_hp_victus():
    """
    Verify recommendation algorithm for HP Victus preset
    (Intel i7, RTX 3050 6GB VRAM, 16GB RAM).
    """
    hp_victus = next(p for p in HARDWARE_PRESETS if p["id"] == "hp_victus")
    rec = ModelCatalogService.recommend_models(
        task="coding",
        ram_gb=hp_victus["ram_gb"],
        vram_gb=hp_victus["vram_gb"],
        disk_free_gb=100.0,
        speed_preference="balanced"
    )

    assert "hardware_evaluated" in rec
    assert rec["hardware_evaluated"]["vram_gb"] == 6.0
    assert rec["hardware_evaluated"]["system_ram_gb"] == 16.0
    assert "recommendations" in rec
    assert len(rec["recommendations"]) > 0

    top_model = rec["recommendations"][0]
    assert top_model["fit_badge"] in ["fit_gpu", "fit_hybrid"]
    assert top_model["score"] > 60
    assert "expected_compromise" in top_model
    assert "disclaimer" in rec


def test_model_name_validation():
    """Verify security sanitization for model names against shell injection."""
    assert OllamaManager.validate_model_name("llama3") is True
    assert OllamaManager.validate_model_name("llama3:latest") is True
    assert OllamaManager.validate_model_name("qwen2.5-coder:7b") is True
    assert OllamaManager.validate_model_name("deepseek-r1:7b") is True
    assert OllamaManager.validate_model_name("my_repo/custom-model:v1.0") is True

    # Malicious injection attempts
    assert OllamaManager.validate_model_name("llama3; rm -rf /") is False
    assert OllamaManager.validate_model_name("model & calc.exe") is False
    assert OllamaManager.validate_model_name("model | grep foo") is False
    assert OllamaManager.validate_model_name("model`whoami`") is False
    assert OllamaManager.validate_model_name("model$(id)") is False
    assert OllamaManager.validate_model_name("") is False


def test_disk_storage_calculation():
    """Verify actual disk storage metrics via shutil.disk_usage."""
    storage = OllamaManager.get_disk_storage()
    assert "total_gb" in storage
    assert "used_gb" in storage
    assert "free_gb" in storage
    assert storage["total_gb"] > 0
    assert storage["free_gb"] > 0


@pytest.mark.anyio
async def test_ollama_daemon_status_and_models_mocked():
    """Verify local models parsing and daemon status with mocked Ollama API."""
    mock_tags_response = {
        "models": [
            {
                "name": "llama3:latest",
                "model": "llama3:latest",
                "size": 4661224676,
                "modified_at": "2026-10-10T08:00:00Z",
                "details": {
                    "format": "gguf",
                    "family": "llama",
                    "parameter_size": "8.0B",
                    "quantization_level": "Q4_0"
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_tags_response

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp

        status = await OllamaManager.list_local_models()
        assert status["reachable"] is True
        assert len(status["models"]) == 1
        model = status["models"][0]
        assert model["name"] == "llama3:latest"
        assert model["family"] == "llama"
        assert model["parameter_size"] == "8.0B"


@pytest.mark.anyio
async def test_ollama_model_inspect_mocked():
    """Verify local model inspection with mocked Ollama show endpoint."""
    mock_show_response = {
        "details": {
            "format": "gguf",
            "family": "llama",
            "parameter_size": "8.0B",
            "quantization_level": "Q4_0"
        },
        "parameters": "temperature 0.7\nstop <|eot_id|>",
        "template": "{{ .Prompt }}",
        "system": "",
        "model_info": {}
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_show_response

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        details = await OllamaManager.inspect_model("llama3:latest")
        assert details["success"] is True
        assert details["name"] == "llama3:latest"
        assert details["details"]["parameter_size"] == "8.0B"


@pytest.mark.anyio
async def test_ollama_test_bench_mocked():
    """Verify prompt test bench execution and latency calculation."""
    mock_chat_response = {
        "message": {"role": "assistant", "content": "def hello_world(): return 'hello'"},
        "eval_count": 15,
        "eval_duration": 500000000
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_chat_response

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await OllamaManager.test_model_prompt(
            model_name="llama3:latest",
            prompt="Write a hello world function",
            system_prompt="You are an expert tutor."
        )

        assert result["success"] is True
        assert result["model"] == "llama3:latest"
        assert "hello_world" in result["response"]
        assert result["duration_ms"] >= 0
        assert result["tokens_per_second"] > 0
        assert result["total_tokens"] == 15


def test_api_endpoints_models():
    """Verify FastAPI routes under /models prefix."""
    # 1. Catalog listing
    res = client.get("/models/catalog?page=1&page_size=3")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) == 3

    # 2. Model Card
    res = client.get("/models/catalog/qwen2.5-coder:7b")
    assert res.status_code == 200
    assert "Qwen 2.5 Coder" in res.json()["name"]

    # 3. Model Card 404
    res = client.get("/models/catalog/non-existent-xyz")
    assert res.status_code == 404

    # 4. Hardware Presets
    res = client.get("/models/presets")
    assert res.status_code == 200
    presets_data = res.json()
    assert "presets" in presets_data
    assert any(p["id"] == "hp_victus" for p in presets_data["presets"])

    # 5. Recommend Endpoint
    res = client.post("/models/recommend", json={
        "vram_gb": 6.0,
        "ram_gb": 16.0,
        "task": "coding"
    })
    assert res.status_code == 200
    assert "recommendations" in res.json()

    # 6. Local Models Endpoint
    res = client.get("/models/local")
    assert res.status_code == 200
    assert "reachable" in res.json()

    # 7. Model inspect with invalid name -> 400
    res = client.post("/models/local/inspect", json={"model_name": "rm -rf /; foo"})
    assert res.status_code == 400

    # 8. Model delete with invalid name -> 400
    res = client.delete("/models/local/invalid name with spaces")
    assert res.status_code == 400
