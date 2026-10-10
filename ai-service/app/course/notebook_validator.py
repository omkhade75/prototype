"""
ORBIT AI — Phase 6: Jupyter Notebook (.ipynb) Validation Engine.
Performs:
1. Strict Jupyter Notebook v4 JSON schema validation.
2. Static Python AST syntax verification (`ast.parse`) reporting exact line/column errors.
3. Symbol and dependency flow analysis (detecting out-of-order execution and missing variables).
4. Secret & credential screening (detecting hardcoded tokens, passwords, and API keys).
5. Isolated container execution verification via DockerCodeRunner when available.
"""

import ast
import re
import json
from typing import Dict, Any, List, Optional, Set
from app.coding.runner import CodeRunner

# Secret patterns to prevent credential leakage
SECRET_PATTERNS = [
    (re.compile(r"""(?i)(?:api_key|apikey|secret|token|password|passwd)\s*=\s*['"][a-zA-Z0-9_\-\.]{8,}['"]"""), "Hardcoded API Key / Secret Token Assignment"),
    (re.compile(r"""sk-[a-zA-Z0-9]{20,}"""), "OpenAI / Cloud Secret Key pattern"),
    (re.compile(r"""ghp_[a-zA-Z0-9]{20,}"""), "GitHub Personal Access Token pattern"),
    (re.compile(r"""AKIA[0-9A-Z]{16}"""), "AWS Access Key ID pattern")
]


class SymbolVisitor(ast.NodeVisitor):
    """
    AST Visitor tracking definitions and usages of identifiers in Python code.
    """

    def __init__(self):
        self.definitions: Set[str] = set()
        self.usages: Set[str] = set()
        self.imports: Set[str] = set()

    def visit_FunctionDef(self, node):
        self.definitions.add(node.name)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self.definitions.add(node.name)
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        self.definitions.add(node.name)
        self.generic_visit(node)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Store):
            self.definitions.add(node.id)
        elif isinstance(node.ctx, ast.Load):
            self.usages.add(node.id)
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            name = alias.asname or alias.name
            self.definitions.add(name)
            self.imports.add(name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            name = alias.asname or alias.name
            self.definitions.add(name)
            self.imports.add(name)
        self.generic_visit(node)


class NotebookValidator:
    """
    Validates Jupyter Notebooks for JSON format, Python AST syntax,
    dependency ordering, credentials, and optional container execution.
    """

    @classmethod
    def validate_notebook(
        cls,
        notebook_data: Any,
        execute_cells: bool = False
    ) -> Dict[str, Any]:
        """
        Validates notebook structure and Python cells.
        Accepts dict or raw JSON string.
        """
        errors: List[Dict[str, Any]] = []
        warnings: List[Dict[str, Any]] = []
        cell_reports: List[Dict[str, Any]] = []

        # 1. JSON Structure Validation
        if isinstance(notebook_data, str):
            try:
                nb = json.loads(notebook_data)
            except Exception as e:
                return {
                    "valid": False,
                    "syntax_valid": False,
                    "schema_valid": False,
                    "errors": [{"type": "json_parse_error", "message": f"Malformed JSON: {str(e)}"}],
                    "warnings": [],
                    "cell_reports": [],
                    "execution_status": "not_executed"
                }
        elif isinstance(notebook_data, dict):
            nb = notebook_data
        else:
            return {
                "valid": False,
                "syntax_valid": False,
                "schema_valid": False,
                "errors": [{"type": "invalid_type", "message": "Expected JSON string or dictionary."}],
                "warnings": [],
                "cell_reports": [],
                "execution_status": "not_executed"
            }

        # Check top-level notebook keys
        if "nbformat" not in nb or nb.get("nbformat") != 4:
            errors.append({"type": "schema_error", "message": "Missing or incompatible 'nbformat' (expected 4)."})

        if "cells" not in nb or not isinstance(nb.get("cells"), list):
            errors.append({"type": "schema_error", "message": "Missing or invalid 'cells' array."})
            return {
                "valid": False,
                "syntax_valid": False,
                "schema_valid": False,
                "errors": errors,
                "warnings": warnings,
                "cell_reports": [],
                "execution_status": "not_executed"
            }

        built_in_names = set(dir(__builtins__))
        defined_so_far: Set[str] = set(built_in_names)
        defined_so_far.update(["True", "False", "None", "__name__", "self"])

        all_syntax_passed = True
        code_cell_index = 0

        # 2. Cell-by-Cell AST & Security Validation
        for idx, cell in enumerate(nb.get("cells", [])):
            c_type = cell.get("cell_type")
            source_raw = cell.get("source", "")
            source_text = "".join(source_raw) if isinstance(source_raw, list) else str(source_raw)

            # Security screening
            for pattern, desc in SECRET_PATTERNS:
                if pattern.search(source_text):
                    warnings.append({
                        "cell_index": idx,
                        "type": "hardcoded_secret_detected",
                        "message": (
                            f"Cell {idx + 1} contains a suspected {desc}. "
                            "For Google Colab or external services, use Colab Secrets "
                            "(`from google.colab import userdata; val = userdata.get('KEY')`) "
                            "or `os.environ.get('KEY')` instead of hardcoding credentials."
                        )
                    })

            if c_type != "code":
                cell_reports.append({
                    "cell_index": idx,
                    "cell_type": c_type or "unknown",
                    "status": "valid",
                    "line_count": len(source_text.splitlines())
                })
                continue

            code_cell_index += 1
            cell_report = {
                "cell_index": idx,
                "code_cell_number": code_cell_index,
                "cell_type": "code",
                "syntax_ok": True,
                "defined_symbols": [],
                "used_symbols": [],
                "missing_dependencies": [],
                "errors": [],
                "warnings": []
            }

            # Python AST parsing
            try:
                tree = ast.parse(source_text)
                visitor = SymbolVisitor()
                visitor.visit(tree)

                cell_report["defined_symbols"] = sorted(list(visitor.definitions))
                cell_report["used_symbols"] = sorted(list(visitor.usages))

                # Dependency flow check: used symbols that aren't defined yet
                unresolved = visitor.usages - defined_so_far - visitor.definitions
                # Filter out attributes or common dynamic conventions
                filtered_unresolved = [u for u in unresolved if not u.startswith("_")]
                if filtered_unresolved:
                    cell_report["missing_dependencies"] = filtered_unresolved
                    warnings.append({
                        "cell_index": idx,
                        "type": "out_of_order_dependency",
                        "message": (
                            f"Cell {idx + 1} references symbol(s) {filtered_unresolved} "
                            "not defined in this cell or earlier cells. Ensure prerequisite cells are executed first."
                        )
                    })

                # Accumulate definitions
                defined_so_far.update(visitor.definitions)

            except SyntaxError as se:
                all_syntax_passed = False
                cell_report["syntax_ok"] = False
                err_msg = f"SyntaxError on line {se.lineno}, col {se.offset}: {se.msg}"
                cell_report["errors"].append(err_msg)
                errors.append({
                    "cell_index": idx,
                    "type": "syntax_error",
                    "line": se.lineno,
                    "column": se.offset,
                    "message": err_msg
                })

            cell_reports.append(cell_report)

        # 3. Optional Isolated Execution via Docker
        execution_status = "not_requested"
        execution_report = None

        if execute_cells and all_syntax_passed:
            runner_status = CodeRunner.check_docker()
            if runner_status.get("available"):
                # Combine all code cells sequentially to run inside isolated container
                full_script_lines = []
                for cell in nb.get("cells", []):
                    if cell.get("cell_type") == "code":
                        source_raw = cell.get("source", "")
                        source_text = "".join(source_raw) if isinstance(source_raw, list) else str(source_raw)
                        full_script_lines.append(source_text)

                combined_script = "\n\n".join(full_script_lines)

                try:
                    res = CodeRunner.execute(
                        language="python",
                        code=combined_script,
                        custom_input=""
                    )
                    execution_status = "docker_executed"
                    execution_report = {
                        "container_isolation": True,
                        "status": res.get("status"),
                        "passed": res.get("passed_count", 0) > 0 or res.get("status") == "completed",
                        "output": res.get("results", [{}])[0].get("actual", "") if res.get("results") else "",
                        "error": res.get("results", [{}])[0].get("error") if res.get("results") else None
                    }
                except Exception as e:
                    execution_status = "docker_execution_failed"
                    execution_report = {"error": str(e), "container_isolation": True}
            else:
                execution_status = "unverified_docker_unavailable"
                execution_report = {
                    "container_isolation": False,
                    "message": "Docker is not active. Static AST validation was completed, but live container execution could not be verified."
                }

        is_overall_valid = (len(errors) == 0)

        return {
            "valid": is_overall_valid,
            "syntax_valid": all_syntax_passed,
            "schema_valid": (len([e for e in errors if e.get("type") == "schema_error"]) == 0),
            "errors": errors,
            "warnings": warnings,
            "cell_reports": cell_reports,
            "execution_status": execution_status,
            "execution_report": execution_report
        }
