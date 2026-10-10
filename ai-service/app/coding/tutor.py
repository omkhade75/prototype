"""
ORBIT AI — Smart Coding Tutor Engine
Provides pedagogical instruction, step-by-step scaffolding, error debugging,
and interview practice in C++ and Python across 10 DSA topics.
Supports both deterministic Demo Mode and local Ollama LLM mode with Knowledge Hub grounding.
"""

from typing import Dict, Any, List, Optional
from app.models.factory import get_provider
from app.coding.catalog import get_problem_by_id, get_topic_by_id

class CodingTutor:
    """
    Intelligent Coding Tutor for DSA, LeetCode preparation, C++ and Python.
    """

    @classmethod
    async def generate_response(
        cls,
        mode: str,  # 'learn', 'build', 'debug', 'practice'
        language: str,  # 'cpp', 'python'
        problem_id: Optional[str] = None,
        topic_id: Optional[str] = None,
        student_code: Optional[str] = None,
        user_query: Optional[str] = None,
        knowledge_passages: Optional[List[Dict[str, Any]]] = None,
        provider_name: Optional[str] = None
    ) -> Dict[str, Any]:
        mode = mode.lower().strip() if mode else "learn"
        language = "cpp" if language and "c" in language.lower() else "python"
        lang_label = "C++ (C++17)" if language == "cpp" else "Python (Python 3.11)"

        problem = get_problem_by_id(problem_id) if problem_id else None
        topic = get_topic_by_id(topic_id) if topic_id else (get_topic_by_id(problem["topic_id"]) if problem else None)

        provider = get_provider(provider_name)

        if provider.name == "ollama":
            return await cls._run_ollama_tutor(
                provider=provider,
                mode=mode,
                language=language,
                lang_label=lang_label,
                problem=problem,
                topic=topic,
                student_code=student_code,
                user_query=user_query,
                knowledge_passages=knowledge_passages
            )
        else:
            return cls._run_demo_tutor(
                mode=mode,
                language=language,
                lang_label=lang_label,
                problem=problem,
                topic=topic,
                student_code=student_code,
                user_query=user_query,
                knowledge_passages=knowledge_passages
            )

    @classmethod
    def _run_demo_tutor(
        cls,
        mode: str,
        language: str,
        lang_label: str,
        problem: Optional[Dict[str, Any]],
        topic: Optional[Dict[str, Any]],
        student_code: Optional[str],
        user_query: Optional[str],
        knowledge_passages: Optional[List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """
        Deterministic, grounded tutoring engine for Demo Mode.
        """
        title = problem["title"] if problem else (topic["name"] if topic else "DSA Concept")
        citations = []
        knowledge_snippet = ""

        if knowledge_passages and len(knowledge_passages) > 0:
            top_p = knowledge_passages[0]
            citations.append({
                "document_id": top_p.get("document_id"),
                "page_number": top_p.get("page_number", 1),
                "chunk_id": top_p.get("id") or top_p.get("chunk_index")
            })
            knowledge_snippet = f"\n> 📚 **Referenced from Knowledge Hub Document #{top_p.get('document_id')} (Page {top_p.get('page_number', 1)})**:\n> *\"{top_p.get('content', '')[:200]}...\"*\n"

        if mode == "learn":
            if problem:
                exp = problem["structured_explanation"]
                content = (
                    f"### 💡 Learn Mode: Concept & Intuition for **{title}** ({lang_label})\n\n"
                    f"{knowledge_snippet}\n"
                    f"#### 1. Core Problem Understanding\n{exp['problem_understanding']}\n\n"
                    f"#### 2. Why the Optimal Approach Works\n{exp['approach']}\n\n"
                    f"#### 3. Algorithmic Pseudocode\n```text\n{exp['pseudocode']}\n```\n\n"
                    f"#### 4. Time & Space Complexity\n"
                    f"- **Time**: {exp['complexity']['time']}\n"
                    f"- **Space**: {exp['complexity']['space']}\n\n"
                    f"🎯 **Student Tip**: In {lang_label}, pay special attention to standard library container choices "
                    f"(`{topic['containers'][language] if topic else 'standard collections'}`)."
                )
            else:
                topic_desc = topic["description"] if topic else "General DSA fundamentals."
                patterns = ", ".join(topic["patterns"]) if topic else "Two Pointers, Divide & Conquer"
                content = (
                    f"### 💡 Learn Mode: Topic Masterclass on **{title}** ({lang_label})\n\n"
                    f"{knowledge_snippet}\n"
                    f"#### Overview\n{topic_desc}\n\n"
                    f"#### Essential Patterns\n{patterns}\n\n"
                    f"#### Idiomatic Containers in {lang_label}\n`{topic['containers'][language] if topic else 'N/A'}`"
                )

        elif mode == "build":
            starter = problem["starter_code"][language] if problem else "// Starter template\n"
            content = (
                f"### 🛠️ Build With Me: Guided Step-by-Step Scaffolding for **{title}**\n\n"
                f"{knowledge_snippet}\n"
                f"Let's build the solution incrementally in **{lang_label}**:\n\n"
                f"**Step 1: Understand Input & Output**\n"
                f"Before typing code, identify your return type and inputs. For `{title}`, what is your expected output on edge cases (e.g., empty array or single element)?\n\n"
                f"**Step 2: Choose Your State / Data Structure**\n"
                f"In `{lang_label}`, use `{topic['containers'][language] if topic else 'appropriate container'}` to store visited elements.\n\n"
                f"**Step 3: Starter Code Skeleton**\n"
                f"```{'cpp' if language == 'cpp' else 'python'}\n{starter}\n```\n"
                f"**Step 4: Your Turn to Complete the Core Loop**\n"
                f"Try implementing the main loop condition inside the editor on your right, then switch to **Debug** mode to verify your logic!"
            )

        elif mode == "debug":
            analysis = []
            if student_code and len(student_code.strip()) > 30:
                has_return = "return" in student_code
                if not has_return:
                    analysis.append("⚠️ **Missing Return Statement**: Your code does not appear to return the expected result.")
                if language == "cpp":
                    if "std::vector" in student_code and "size()" in student_code and "int" not in student_code:
                        analysis.append("💡 **C++ Tip**: Watch out for unsigned vs signed comparisons when looping with `nums.size()`.")
                elif language == "python":
                    if "def " in student_code and ":" not in student_code:
                        analysis.append("⚠️ **Python Syntax**: Check for missing colon `:` after function headers or loops.")
            
            common_pitfalls = (
                "- Off-by-one errors in pointer initialization (e.g. `right = n - 1` vs `right = n`).\n"
                "- Missing base case handling when input is empty or has a single element.\n"
                "- Modifying an array while iterating over it.\n"
                f"- Using inefficient container lookups (e.g. O(N) search in list instead of O(1) in hash table)."
            )

            feedback = "\n".join(analysis) if analysis else "✅ No obvious syntax errors detected. Let's test edge cases!"
            content = (
                f"### 🐞 Debug Mode: Code Review & Edge-Case Analysis for **{title}**\n\n"
                f"{knowledge_snippet}\n"
                f"#### Code Diagnostics ({lang_label})\n{feedback}\n\n"
                f"#### Critical Edge Cases to Guard Against:\n{common_pitfalls}\n\n"
                f"#### Dry Run Check:\nTry passing the sample test case in the editor to see if the state variables transition as intended."
            )

        elif mode == "practice":
            content = (
                f"### 🎯 Practice Mode: Interview Simulation for **{title}**\n\n"
                f"{knowledge_snippet}\n"
                f"Imagine you are in a technical coding interview. Let's practice active communication:\n\n"
                f"**1. Clarifying Questions to Ask the Interviewer:**\n"
                f"- Are the input elements guaranteed to be non-empty?\n"
                f"- Can the input contain negative numbers, zeros, or duplicates?\n"
                f"- Is memory space restricted, or should we optimize strictly for time complexity?\n\n"
                f"**2. High-Level Approach Pitch:**\n"
                f"Explain: *'I can solve this initially in O(N^2) using brute force, but by using {topic['name'] if topic else 'an optimal data structure'}, we can reduce time complexity to optimal Big-O.'*\n\n"
                f"**3. Self-Test Checklist:**\n"
                f"- [ ] Clean variable names without single-letter ambiguity\n"
                f"- [ ] Guard clauses for empty or boundary inputs\n"
                f"- [ ] Correct time and space complexity stated\n"
            )
        else:
            content = f"[Demo Tutor] Operational guidance on {title} in {lang_label}."

        return {
            "mode": mode,
            "language": language,
            "title": title,
            "provider": "demo",
            "model": "grounded-dsa-tutor",
            "content": content,
            "citations": citations,
            "status": "successful"
        }

    @classmethod
    async def _run_ollama_tutor(
        cls,
        provider: Any,
        mode: str,
        language: str,
        lang_label: str,
        problem: Optional[Dict[str, Any]],
        topic: Optional[Dict[str, Any]],
        student_code: Optional[str],
        user_query: Optional[str],
        knowledge_passages: Optional[List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """
        Real local Ollama model instruction for Coding Tutor.
        """
        title = problem["title"] if problem else (topic["name"] if topic else "DSA Concept")

        # Health check
        if hasattr(provider, "get_health_status"):
            health = await provider.get_health_status()
            if not health.get("reachable"):
                raise RuntimeError(
                    f"Ollama is unreachable at {provider.base_url}. "
                    "Ensure Ollama is running (`ollama serve`) or switch provider to 'demo'."
                )

        # Context formulation
        context_parts = []
        citations = []
        if problem:
            context_parts.append(f"Problem: {problem['title']} (LeetCode #{problem['leetcode_num']}, Difficulty: {problem['difficulty']})")
            context_parts.append(f"Description:\n{problem['description']}")
            context_parts.append(f"Constraints:\n" + "\n".join(problem['constraints']))

        if knowledge_passages:
            context_parts.append("Referenced Study Material from Knowledge Hub:")
            for p in knowledge_passages[:2]:
                context_parts.append(f"- Doc #{p.get('document_id')} (Page {p.get('page_number', 1)}): {p.get('content', '')[:250]}")
                citations.append({
                    "document_id": p.get("document_id"),
                    "page_number": p.get("page_number", 1),
                    "chunk_id": p.get("id") or p.get("chunk_index")
                })

        context_str = "\n\n".join(context_parts)

        system_prompt = (
            f"You are ORBIT AI, an expert, patient Senior AI Programming & DSA Tutor. "
            f"You are tutoring a college student in {lang_label}. "
            f"Current Tutor Mode: {mode.upper()}.\n"
            f"- In 'learn' mode: Teach core intuition, patterns, and big-O.\n"
            f"- In 'build' mode: Guide step-by-step with scaffolding and skeletons.\n"
            f"- In 'debug' mode: Analyze the student's code, pinpoint bugs, and suggest edge cases.\n"
            f"- In 'practice' mode: Act as a friendly interviewer prompting the student.\n"
            f"Write clean, idiomatic code in {lang_label}. Never use TypeScript. Keep explanations clear, structured, and encouraging."
        )

        user_prompt = f"Problem / Context:\n{context_str}\n\n"
        if student_code:
            user_prompt += f"Student's Current Editor Code ({lang_label}):\n```\n{student_code}\n```\n\n"
        if user_query:
            user_prompt += f"Student's Question / Request:\n{user_query}\n"
        else:
            user_prompt += f"Please guide me on '{title}' in '{mode}' mode using {lang_label}."

        response_text = await provider.generate_text(user_prompt, system_prompt=system_prompt)

        return {
            "mode": mode,
            "language": language,
            "title": title,
            "provider": "ollama",
            "model": getattr(provider, "model", "llama3"),
            "content": response_text,
            "citations": citations,
            "status": "successful"
        }

    @classmethod
    def get_progressive_hint(
        cls,
        problem_id: str,
        hint_level: int,
        language: str = "cpp"
    ) -> Dict[str, Any]:
        """
        Provides progressive scaffolding hints:
        Level 1: Intuition (no spoilers)
        Level 2: Algorithmic steps & data structure choice
        Level 3: Concrete code scaffold & syntax template
        """
        problem = get_problem_by_id(problem_id)
        if not problem:
            return {
                "success": False,
                "problem_id": problem_id,
                "hint_level": hint_level,
                "message": f"Problem '{problem_id}' not found."
            }

        topic = get_topic_by_id(problem.get("topic_id", ""))
        language = "cpp" if "c" in language.lower() else "python"
        lang_label = "C++17" if language == "cpp" else "Python 3.11"
        exp = problem.get("structured_explanation", {})

        if hint_level <= 1:
            title = "Level 1 Hint: Conceptual Intuition (No Code Spoilers)"
            hint_text = (
                f"### 💡 Level 1 Hint for **{problem['title']}**\n\n"
                f"{exp.get('problem_understanding', 'Think about the core mathematical or invariant relationship between elements.')}\n\n"
                f"🔑 **Guiding Question**: What information from previous iterations could eliminate redundant nested loops?"
            )
        elif hint_level == 2:
            title = "Level 2 Hint: Algorithmic Strategy & Container Selection"
            container_info = topic['containers'].get(language, 'standard container') if topic else 'appropriate container'
            default_pseudo = "1. Initialize\n2. Loop\n3. Return"
            pseudocode_text = exp.get('pseudocode') or default_pseudo
            hint_text = (
                f"### 🛠️ Level 2 Hint for **{problem['title']}**\n\n"
                f"**Approach Strategy:**\n{exp.get('approach', 'Choose the optimal data structure.')}\n\n"
                f"**Optimal Data Structure ({lang_label}):** `{container_info}`\n\n"
                f"**Pseudocode Roadmap:**\n```text\n{pseudocode_text}\n```"
            )
        else:
            title = f"Level 3 Hint: Code Scaffold & Template ({lang_label})"
            starter = problem["starter_code"].get(language, "")
            hint_text = (
                f"### 💻 Level 3 Hint for **{problem['title']}** ({lang_label})\n\n"
                f"Here is your scaffold. Implement the inner block:\n\n"
                f"```{language}\n{starter}\n```\n\n"
                f"⚠️ **Syntax Reminder**: Make sure edge cases (e.g. empty collection or boundary values) are guarded at the very beginning of the function."
            )

        return {
            "success": True,
            "problem_id": problem_id,
            "problem_title": problem["title"],
            "hint_level": hint_level,
            "title": title,
            "hint_text": hint_text,
            "next_level_available": hint_level < 3
        }

    @classmethod
    def evaluate_quiz_answers(
        cls,
        topic_id: str,
        answers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluates student quiz submissions against the topic's canonical questions.
        Answers format: [{'question_id': 1, 'selected_option_index': 0}, ...]
        Returns score, percentage, correct answer breakdown, explanations, and mastery status (>= 80%).
        """
        from app.coding.lesson_generator import LessonGenerator
        lesson = LessonGenerator.generate_13_step_lesson(topic_id)
        sec13 = next((s for s in lesson.get("sections", []) if s.get("section_number") == 13), None)
        quiz_questions = sec13.get("quiz_questions", []) if sec13 else []

        eval_results = []
        correct_count = 0
        total_questions = len(quiz_questions)

        answers_map = {a.get("question_id"): a.get("selected_option_index") for a in answers}

        for q in quiz_questions:
            qid = q.get("id")
            selected = answers_map.get(qid)
            is_correct = (selected == q.get("correct_option_index"))
            if is_correct:
                correct_count += 1

            eval_results.append({
                "question_id": qid,
                "question": q.get("question"),
                "selected_option_index": selected,
                "correct_option_index": q.get("correct_option_index"),
                "is_correct": is_correct,
                "explanation": q.get("explanation"),
                "options": q.get("options")
            })

        percentage = round((correct_count / total_questions * 100), 1) if total_questions > 0 else 0
        passed = percentage >= 80.0

        return {
            "success": True,
            "topic_id": topic_id,
            "total_questions": total_questions,
            "correct_count": correct_count,
            "percentage": percentage,
            "passed": passed,
            "results": eval_results,
            "feedback": (
                f"🎉 Outstanding! You scored {percentage}% and demonstrated concept mastery."
                if passed else
                f"📚 You scored {percentage}%. Review the explanations and retry to reach 80% mastery."
            )
        }

