"""
ORBIT AI — Phase 5: Verified AI Model Catalog & Educational Reference Data.
Contains structured metadata, hardware requirements, benchmark references,
and pedagogical guides for premier local and open-weight model architectures.
"""

from typing import Dict, Any, List

CATALOG_MODELS: List[Dict[str, Any]] = [
    {
        "id": "ollama:llama3.2:1b",
        "name": "Llama 3.2 (1B)",
        "publisher": "Meta AI",
        "family": "Llama 3.2",
        "source": "ollama",
        "ollama_tag": "llama3.2:1b",
        "parameter_size": "1.23B",
        "quantization": "Q4_K_M (4-bit)",
        "context_length": 131072,  # 128k
        "modalities": ["text"],
        "tasks": ["summarization", "instruction", "edge_computing", "quick_chat"],
        "description": "Meta's highly optimized lightweight small language model designed for on-device summarization, multilingual dialog, and ultra-fast edge processing.",
        "license": "Llama 3.2 Community License (Free for < 700M monthly active users)",
        "size_bytes": 1300000000,  # ~1.3 GB
        "size_display": "1.3 GB",
        "ram_min_gb": 4.0,
        "vram_rec_gb": 2.0,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Fits completely in RTX 3050 6GB VRAM with minimal overhead. Expect 60-90 tokens/sec.",
        "benchmarks": {
            "mmlu": 49.3,
            "gsm8k": 44.4,
            "humaneval": 27.4,
            "source_type": "Published by Meta AI"
        },
        "learning_guide": {
            "overview": "Llama 3.2 1B is Meta's smallest instruct model. Built using pruned and distilled representations from Llama 3.1 8B, it operates at lightning speeds on laptops with zero GPU bottleneck.",
            "strengths": [
                "Ultra-fast latency and near-zero memory footprint (~1.3 GB).",
                "Exceptional 128K context window support for large documents.",
                "Ideal for low-power offline laptops and basic summarization."
            ],
            "limitations": [
                "Weak on complex algorithmic reasoning and multi-step DSA proofs.",
                "Prone to hallucination on intricate C++ syntax."
            ],
            "best_uses": ["Fast RAG synthesis", "Document skimming", "Quick prompt prototyping"],
            "orbit_workflow": "Use in Knowledge Hub for rapid extractive Q&A when battery life or latency is priority.",
            "prompt_pattern": "Provide clear single-turn instructions. Example:\n'Summarize the following 3 paragraphs in 5 bullet points with technical terms highlighted.'",
            "local_setup_command": "ollama run llama3.2:1b"
        }
    },
    {
        "id": "ollama:llama3.2:3b",
        "name": "Llama 3.2 (3B)",
        "publisher": "Meta AI",
        "family": "Llama 3.2",
        "source": "ollama",
        "ollama_tag": "llama3.2:3b",
        "parameter_size": "3.21B",
        "quantization": "Q4_K_M (4-bit)",
        "context_length": 131072,
        "modalities": ["text"],
        "tasks": ["reasoning", "summarization", "instruction", "dsa_tutor"],
        "description": "Meta's sweet-spot compact model delivering strong instruction following and balanced reasoning at high speeds.",
        "license": "Llama 3.2 Community License",
        "size_bytes": 2000000000,  # ~2.0 GB
        "size_display": "2.0 GB",
        "ram_min_gb": 6.0,
        "vram_rec_gb": 3.5,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Fits easily in 6GB VRAM with ~2.5GB headroom for KV-cache. High tokens/sec on RTX 3050.",
        "benchmarks": {
            "mmlu": 63.4,
            "gsm8k": 77.7,
            "humaneval": 42.1,
            "source_type": "Published by Meta AI"
        },
        "learning_guide": {
            "overview": "The 3B variant offers nearly double the reasoning density of 1B models while easily fitting in entry-level laptop GPUs.",
            "strengths": [
                "Crisp instruction-following and clean markdown formatting.",
                "Capable of solving introductory DSA problems (Arrays, Two-Pointers).",
                "Full GPU acceleration on laptop GPUs with 4GB-6GB VRAM."
            ],
            "limitations": [
                "Can struggle with intricate Dynamic Programming recurrence relations."
            ],
            "best_uses": ["Everyday assistant", "Coding explanation", "Workflow DAG execution"],
            "orbit_workflow": "Great default daily driver for ORBIT Agent Playground and Workflow Studio.",
            "prompt_pattern": "System: 'You are a patient computer science tutor.' User: 'Explain the sliding window technique on string problems.'",
            "local_setup_command": "ollama run llama3.2:3b"
        }
    },
    {
        "id": "ollama:qwen2.5-coder:1.5b",
        "name": "Qwen 2.5 Coder (1.5B)",
        "publisher": "Alibaba Cloud",
        "family": "Qwen 2.5 Coder",
        "source": "ollama",
        "ollama_tag": "qwen2.5-coder:1.5b",
        "parameter_size": "1.54B",
        "quantization": "Q4_K_M (4-bit)",
        "context_length": 32768,
        "modalities": ["text", "code"],
        "tasks": ["coding", "debugging", "syntax_completion", "dsa_tutor"],
        "description": "Specialized lightweight coding model trained on over 5.5 trillion code tokens across 92+ programming languages.",
        "license": "Apache 2.0 (Permissive Open Source)",
        "size_bytes": 1000000000,  # ~1.0 GB
        "size_display": "1.0 GB",
        "ram_min_gb": 4.0,
        "vram_rec_gb": 2.0,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Super-fast code completions. Takes only ~1.5 GB VRAM.",
        "benchmarks": {
            "humaneval": 61.6,
            "mbpp": 60.2,
            "evalplus": 54.3,
            "source_type": "Published by Qwen Team"
        },
        "learning_guide": {
            "overview": "Punches far above its weight for code generation. Outperforms many 7B generalist models on Python and C++ benchmarks.",
            "strengths": [
                "Exceptional code syntax precision relative to its tiny 1GB size.",
                "Apache 2.0 permissive open-source license.",
                "Native awareness of C++, Python, JavaScript, and SQL."
            ],
            "limitations": [
                "Lacks deep prose fluency for non-programming humanities queries."
            ],
            "best_uses": ["Coding Playground inline tutor", "Unit test generation", "Quick syntax debugging"],
            "orbit_workflow": "Pair with ORBIT Coding Playground in 'Build With Me' mode for instant responses.",
            "prompt_pattern": "Provide code with a problem description: 'Debug this C++ function that calculates binary search; identify the off-by-one condition.'",
            "local_setup_command": "ollama run qwen2.5-coder:1.5b"
        }
    },
    {
        "id": "ollama:qwen2.5-coder:7b",
        "name": "Qwen 2.5 Coder (7B)",
        "publisher": "Alibaba Cloud",
        "family": "Qwen 2.5 Coder",
        "source": "ollama",
        "ollama_tag": "qwen2.5-coder:7b",
        "parameter_size": "7.61B",
        "quantization": "Q4_K_M (4-bit)",
        "context_length": 32768,
        "modalities": ["text", "code"],
        "tasks": ["coding", "dsa_tutor", "full_stack_dev", "debugging", "reasoning"],
        "description": "State-of-the-art open-source coding engine rivaling GPT-4o-mini on Python, C++, and multi-file code synthesis.",
        "license": "Apache 2.0",
        "size_bytes": 4700000000,  # ~4.7 GB
        "size_display": "4.7 GB",
        "ram_min_gb": 8.0,
        "vram_rec_gb": 5.5,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Snug fit in RTX 3050 6GB VRAM (~4.8GB allocation). Provides near-full GPU acceleration.",
        "benchmarks": {
            "humaneval": 88.4,
            "mbpp": 81.2,
            "livecodebench": 37.6,
            "source_type": "Published by Qwen Team"
        },
        "learning_guide": {
            "overview": "The premier choice for local software engineering. High-density coding knowledge, capable of generating entire REST controllers, database schemas, and clean unit tests.",
            "strengths": [
                "Superior LeetCode Medium/Hard algorithmic capability.",
                "Robust understanding of modern Node.js, React JSX, and Python FastAPI.",
                "Reliable JSON tool-calling and structured output syntax."
            ],
            "limitations": [
                "Leaves limited VRAM headroom on a 6GB card for long multi-turn context >16k tokens."
            ],
            "best_uses": ["ORBIT Software Engineer Agent", "LeetCode interview prep", "Full-stack project generation"],
            "orbit_workflow": "Highly recommended engine for ORBIT Software Engineer and Coding Playground.",
            "prompt_pattern": "User: 'Write a Node.js Express router using node:sqlite that implements parameterized pagination for an inventory table.'",
            "local_setup_command": "ollama run qwen2.5-coder:7b"
        }
    },
    {
        "id": "ollama:llama3.1:8b",
        "name": "Llama 3.1 (8B)",
        "publisher": "Meta AI",
        "family": "Llama 3.1",
        "source": "ollama",
        "ollama_tag": "llama3.1:8b",
        "parameter_size": "8.03B",
        "quantization": "Q4_K_M (4-bit)",
        "context_length": 131072,
        "modalities": ["text"],
        "tasks": ["reasoning", "coding", "rag", "agent", "general"],
        "description": "Meta's flagship 8B foundational model with state-of-the-art multilingual comprehension, 128k context, and tool calling.",
        "license": "Llama 3.1 Community License",
        "size_bytes": 4900000000,  # ~4.9 GB
        "size_display": "4.9 GB",
        "ram_min_gb": 10.0,
        "vram_rec_gb": 6.0,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Fits in 6GB VRAM with partial CPU offload for long contexts. Excellent throughput on RTX 3050.",
        "benchmarks": {
            "mmlu": 73.0,
            "gsm8k": 84.5,
            "humaneval": 72.6,
            "source_type": "Published by Meta AI"
        },
        "learning_guide": {
            "overview": "The benchmark standard for open local intelligence. Delivers balanced versatility across agent tool calling, structured RAG grounding, and programming.",
            "strengths": [
                "Exemplary function-calling schema compliance.",
                "128k context window handles massive uploaded PDF textbooks.",
                "Rich, natural prose and balanced instructional tone."
            ],
            "limitations": [
                "Requires careful context budgeting on 6GB VRAM laptops to avoid RAM spilling."
            ],
            "best_uses": ["Knowledge Hub RAG", "Agent Playground tool calling", "General question answering"],
            "orbit_workflow": "Directly integrated with ORBIT Agent Playground tool execution loop.",
            "prompt_pattern": "Use with system instructions and JSON schemas for zero-shot function invocation.",
            "local_setup_command": "ollama run llama3.1:8b"
        }
    },
    {
        "id": "ollama:deepseek-r1:7b",
        "name": "DeepSeek R1 Distill (7B)",
        "publisher": "DeepSeek",
        "family": "DeepSeek R1",
        "source": "ollama",
        "ollama_tag": "deepseek-r1:7b",
        "parameter_size": "7.61B",
        "quantization": "Q4_K_M (4-bit)",
        "context_length": 65536,
        "modalities": ["text"],
        "tasks": ["reasoning", "math", "coding", "dsa_tutor"],
        "description": "Distilled from DeepSeek-R1, fine-tuned with reinforced reasoning patterns to output visible step-by-step thinking traces.",
        "license": "MIT (Permissive Open Source)",
        "size_bytes": 4700000000,  # ~4.7 GB
        "size_display": "4.7 GB",
        "ram_min_gb": 8.0,
        "vram_rec_gb": 5.5,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Comfortable fit in RTX 3050 6GB VRAM. Emits <think> tokens before answering.",
        "benchmarks": {
            "math": 84.1,
            "aime": 55.5,
            "codeforces": 1180,
            "source_type": "Published by DeepSeek"
        },
        "learning_guide": {
            "overview": "A specialized reasoning engine that produces a visible <think>...</think> block, revealing its internal chain-of-thought prior to emitting the final answer.",
            "strengths": [
                "World-class mathematical and algorithmic problem solving.",
                "Permissive MIT open-source license.",
                "Great for learning how an AI reasons through graph algorithms."
            ],
            "limitations": [
                "Slower generation speed because it generates internal reasoning steps.",
                "Overthinks simple greeting and summarization tasks."
            ],
            "best_uses": ["Hard DSA algorithms", "Mathematical proofs", "Logic riddles & debug tracing"],
            "orbit_workflow": "Ideal for Coding Playground 'Learn' mode to see step-by-step logic proofs.",
            "prompt_pattern": "Ask open algorithmic questions: 'Prove that Dijkstra's algorithm fails with negative edge weights.'",
            "local_setup_command": "ollama run deepseek-r1:7b"
        }
    },
    {
        "id": "ollama:mistral:7b",
        "name": "Mistral (7B-Instruct v0.3)",
        "publisher": "Mistral AI",
        "family": "Mistral",
        "source": "ollama",
        "ollama_tag": "mistral:7b",
        "parameter_size": "7.25B",
        "quantization": "Q4_0 (4-bit)",
        "context_length": 32768,
        "modalities": ["text"],
        "tasks": ["reasoning", "coding", "summarization", "instruction"],
        "description": "High-efficiency balanced generalist utilizing sliding window attention and native function calling.",
        "license": "Apache 2.0",
        "size_bytes": 4100000000,  # ~4.1 GB
        "size_display": "4.1 GB",
        "ram_min_gb": 8.0,
        "vram_rec_gb": 5.0,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Great fit in 6GB VRAM with ~1GB buffer. Very consistent throughput.",
        "benchmarks": {
            "mmlu": 62.5,
            "humaneval": 40.2,
            "source_type": "Published by Mistral AI"
        },
        "learning_guide": {
            "overview": "The pioneer of efficient 7B models. Highly reliable for concise output without verbosity.",
            "strengths": [
                "Fast, concise, and direct answers without unnecessary fluff.",
                "Mature Ollama integration and tool execution stability."
            ],
            "limitations": [
                "Context window capped at 32k compared to Llama 3.1's 128k."
            ],
            "best_uses": ["Workflow automation nodes", "Fast instruction following", "API integration"],
            "orbit_workflow": "Works reliably in Workflow Studio AI Task nodes.",
            "prompt_pattern": "[INST] Transform the following user profile into a clean JSON structure [/INST]",
            "local_setup_command": "ollama run mistral:7b"
        }
    },
    {
        "id": "ollama:phi3:3.8b",
        "name": "Phi-3 Mini (3.8B)",
        "publisher": "Microsoft",
        "family": "Phi",
        "source": "ollama",
        "ollama_tag": "phi3:3.8b",
        "parameter_size": "3.82B",
        "quantization": "Q4_K_M (4-bit)",
        "context_length": 131072,
        "modalities": ["text"],
        "tasks": ["reasoning", "coding", "math", "instruction"],
        "description": "Microsoft's textbook-trained compact model achieving outsized reasoning and math scores from curated synthetic data.",
        "license": "MIT",
        "size_bytes": 2200000000,  # ~2.2 GB
        "size_display": "2.2 GB",
        "ram_min_gb": 6.0,
        "vram_rec_gb": 3.0,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Ultra-light memory usage in 6GB VRAM (~2.5GB). Excellent for multitasking.",
        "benchmarks": {
            "mmlu": 68.8,
            "gsm8k": 82.5,
            "humaneval": 58.5,
            "source_type": "Published by Microsoft Research"
        },
        "learning_guide": {
            "overview": "Trained on 'textbooks are all you need' data, Phi-3 exhibits academic, structured explanations perfect for students.",
            "strengths": [
                "Extremely high reasoning capability per gigabyte of memory.",
                "Pedagogical explanations that break down tricky concepts cleanly."
            ],
            "limitations": [
                "Strict formatting instructions sometimes require explicit reinforcement."
            ],
            "best_uses": ["DSA student tutoring", "Algorithmic explanations", "Math verification"],
            "orbit_workflow": "Great tutor for Coding Playground explanations.",
            "prompt_pattern": "User: 'Teach me the concept of dynamic programming memoization like a textbook author.'",
            "local_setup_command": "ollama run phi3:3.8b"
        }
    },
    {
        "id": "ollama:gemma2:9b",
        "name": "Gemma 2 (9B)",
        "publisher": "Google",
        "family": "Gemma 2",
        "source": "ollama",
        "ollama_tag": "gemma2:9b",
        "parameter_size": "9.24B",
        "quantization": "Q4_K_M (4-bit)",
        "context_length": 8192,
        "modalities": ["text"],
        "tasks": ["reasoning", "writing", "general", "instruction"],
        "description": "Google's open-weights model utilizing sliding-window attention and logit capping for smooth, human-like prose.",
        "license": "Gemma Terms of Use",
        "size_bytes": 5500000000,  # ~5.5 GB
        "size_display": "5.5 GB",
        "ram_min_gb": 12.0,
        "vram_rec_gb": 6.5,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Requires slight CPU memory offload on 6GB VRAM (model ~5.5GB). Runs cleanly with 16GB system RAM.",
        "benchmarks": {
            "mmlu": 71.3,
            "gsm8k": 76.6,
            "source_type": "Published by Google DeepMind"
        },
        "learning_guide": {
            "overview": "Engineered with knowledge distillation from Gemini, Gemma 2 delivers nuanced writing and solid reasoning.",
            "strengths": ["Deep semantic comprehension and articulate explanations."],
            "limitations": ["Capped 8K context length; tightly utilizes 6GB VRAM."],
            "best_uses": ["Knowledge exploration", "Writing assistance"],
            "orbit_workflow": "Use in Knowledge Hub for rich conceptual answers.",
            "prompt_pattern": "User: 'Explain how modern database engines manage write-ahead logs for crash recovery.'",
            "local_setup_command": "ollama run gemma2:9b"
        }
    },
    {
        "id": "ollama:nomic-embed-text",
        "name": "Nomic Embed Text",
        "publisher": "Nomic AI",
        "family": "Nomic",
        "source": "ollama",
        "ollama_tag": "nomic-embed-text",
        "parameter_size": "137M",
        "quantization": "FP16 / Q4",
        "context_length": 8192,
        "modalities": ["text"],
        "tasks": ["embedding", "rag", "retrieval"],
        "description": "High-performance open embedding model with 8192 context window, outperforming OpenAI text-embedding-ada-002 on MTEB.",
        "license": "Apache 2.0",
        "size_bytes": 274000000,  # ~274 MB
        "size_display": "274 MB",
        "ram_min_gb": 2.0,
        "vram_rec_gb": 1.0,
        "fits_rtx_3050_6gb": True,
        "gpu_fit_note": "Tiny footprint (~0.4 GB). Runs instantaneously on laptop hardware.",
        "benchmarks": {
            "mteb": 62.4,
            "source_type": "Published by Nomic AI"
        },
        "learning_guide": {
            "overview": "Specialized embedding model for converting document chunks into dense vector representations.",
            "strengths": ["Huge 8k context embedding window; sub-millisecond latency."],
            "limitations": ["Not a generative chat model; produces vector embeddings only."],
            "best_uses": ["Vector RAG", "Semantic search indexing"],
            "orbit_workflow": "Foundation for scaling ORBIT TF-IDF into dense vector retrieval.",
            "prompt_pattern": "search_document: <chunk text> or search_query: <user question>",
            "local_setup_command": "ollama run nomic-embed-text"
        }
    }
]

HARDWARE_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "hp_victus",
        "name": "HP Victus Laptop (User Current Rig)",
        "cpu_info": "Intel Core i7 (12th/13th Gen, 14 Cores / 20 Threads)",
        "gpu_info": "NVIDIA GeForce RTX 3050 Laptop GPU (6 GB GDDR6 VRAM)",
        "ram_gb": 16.0,
        "vram_gb": 6.0,
        "disk_free_gb": 150.0,
        "description": "Balanced gaming & development laptop. 6 GB VRAM comfortably runs models up to 7B/8B (Q4 quantization) with high GPU acceleration."
    },
    {
        "id": "budget_laptop",
        "name": "Integrated Graphics Laptop (No Dedicated GPU)",
        "cpu_info": "Intel Core i5 / AMD Ryzen 5",
        "gpu_info": "Intel Iris Xe / AMD Radeon Integrated",
        "ram_gb": 8.0,
        "vram_gb": 0.0,
        "disk_free_gb": 50.0,
        "description": "Standard university laptop. Models run on CPU via system RAM. Recommended models: 1B-3B quantized (Llama 3.2 1B/3B, Qwen 2.5 Coder 1.5B)."
    },
    {
        "id": "pro_workstation",
        "name": "AI Developer Workstation (RTX 4070 / 4090)",
        "cpu_info": "AMD Ryzen 9 / Intel Core i9",
        "gpu_info": "NVIDIA RTX 4070 / 4080 (12 GB - 16 GB VRAM)",
        "ram_gb": 32.0,
        "vram_gb": 12.0,
        "disk_free_gb": 500.0,
        "description": "High-tier local development rig. Easily runs 14B models and 32B quantized models with full GPU context acceleration."
    }
]
