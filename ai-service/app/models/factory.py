import os
from typing import Optional, Dict, Any
from app.models.provider import ModelProvider
from app.models.demo_provider import DemoProvider
from app.models.ollama_provider import OllamaProvider

_demo_provider_instance = DemoProvider()
_ollama_provider_instance: Optional[OllamaProvider] = None

def get_provider(provider_name: Optional[str] = None) -> ModelProvider:
    """
    Returns the requested ModelProvider or falls back to the configured environment provider.
    Defaults to 'demo' mode if unspecified.
    """
    global _ollama_provider_instance
    target = (provider_name or os.getenv("AI_PROVIDER", "demo")).lower().strip()

    if target == "ollama":
        if _ollama_provider_instance is None:
            _ollama_provider_instance = OllamaProvider()
        return _ollama_provider_instance
    
    # Default is DemoProvider
    return _demo_provider_instance

async def get_system_ai_status() -> Dict[str, Any]:
    """
    Returns the current AI provider configuration and connectivity status.
    """
    configured_provider = os.getenv("AI_PROVIDER", "demo").lower()
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3")

    ollama_prov = OllamaProvider(base_url=ollama_url, model=ollama_model)
    ollama_reachable = await ollama_prov.is_available()

    return {
        "active_provider": configured_provider,
        "is_demo_mode": configured_provider == "demo",
        "configured_model": ollama_model if configured_provider == "ollama" else "extractive-demo-engine",
        "ollama_base_url": ollama_url,
        "ollama_reachable": ollama_reachable,
        "supported_providers": ["demo", "ollama"]
    }
