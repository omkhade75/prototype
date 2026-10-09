from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class ModelProvider(ABC):
    """
    Abstract interface for AI Model Providers.
    Allows ORBIT AI to switch seamlessly between Demo Mode (no LLM required)
    and Ollama (local LLM inference).
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Returns the provider name, e.g., 'demo' or 'ollama'."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Checks if the provider is currently reachable and operational."""
        pass

    @abstractmethod
    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generates a text completion for a given prompt."""
        pass

    @abstractmethod
    async def answer_question(self, question: str, passages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Answers a user question grounded strictly on retrieved source passages.
        Returns a dictionary containing the answer and citation references.
        """
        pass

    @abstractmethod
    async def execute_task(self, task_type: str, input_text: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes bounded AI tasks such as 'summarize', 'extract', or 'transform'.
        """
        pass
