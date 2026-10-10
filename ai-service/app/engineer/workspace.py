"""
ORBIT AI — Phase 4A: Safe Workspace File Manager.
Executes sandboxed filesystem operations (list, read, write, edit, diff)
strictly within an authorized workspace root.
"""

import os
import difflib
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.engineer.security import resolve_canonical_path, scan_for_secrets


class WorkspaceManager:
    """
    Manages project files within an authorized workspace directory.
    Enforces strict path canonicalization and directory isolation.
    """

    @classmethod
    def list_files(cls, workspace_root: str, rel_dir: str = "") -> List[Dict[str, Any]]:
        """
        Lists files and subdirectories recursively, ignoring heavy / metadata dirs.
        """
        target_dir = resolve_canonical_path(workspace_root, rel_dir)
        if not target_dir.exists() or not target_dir.is_dir():
            return []

        results = []
        ignored_names = {"node_modules", ".git", "dist", "build", ".cache", "__pycache__", ".pytest_cache"}

        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ignored_names]
            for f in files:
                full_path = Path(root) / f
                rel_path = full_path.relative_to(Path(workspace_root).resolve()).as_posix()
                try:
                    stat = full_path.stat()
                    results.append({
                        "path": rel_path,
                        "name": f,
                        "size": stat.st_size,
                        "updated_at": stat.st_mtime
                    })
                except Exception:
                    continue

        return sorted(results, key=lambda x: x["path"])

    @classmethod
    def read_file(cls, workspace_root: str, rel_path: str) -> str:
        """
        Reads text content of a file within the workspace.
        """
        target_file = resolve_canonical_path(workspace_root, rel_path)
        if not target_file.exists():
            raise FileNotFoundError(f"File '{rel_path}' does not exist in workspace.")
        if target_file.is_dir():
            raise IsADirectoryError(f"'{rel_path}' is a directory, not a file.")

        return target_file.read_text(encoding="utf-8", errors="replace")

    @classmethod
    def write_file(cls, workspace_root: str, rel_path: str, content: str) -> Dict[str, Any]:
        """
        Writes UTF-8 text content to a file, creating parent directories if needed.
        """
        target_file = resolve_canonical_path(workspace_root, rel_path)
        target_file.parent.mkdir(parents=True, exist_ok=True)

        target_file.write_text(content, encoding="utf-8")
        stat = target_file.stat()

        return {
            "success": True,
            "path": target_file.relative_to(Path(workspace_root).resolve()).as_posix(),
            "bytes_written": stat.st_size
        }

    @classmethod
    def edit_file(
        cls,
        workspace_root: str,
        rel_path: str,
        target_content: str,
        replacement_content: str
    ) -> Dict[str, Any]:
        """
        Replaces target substring in an existing file and returns the line diff.
        """
        target_file = resolve_canonical_path(workspace_root, rel_path)
        if not target_file.exists():
            raise FileNotFoundError(f"File '{rel_path}' not found in workspace.")

        original = target_file.read_text(encoding="utf-8")
        if target_content not in original:
            raise ValueError(f"Target content block was not found in '{rel_path}'.")

        updated = original.replace(target_content, replacement_content, 1)
        target_file.write_text(updated, encoding="utf-8")

        diff = cls.generate_diff(original, updated, rel_path)

        return {
            "success": True,
            "path": rel_path,
            "diff": diff
        }

    @classmethod
    def generate_diff(cls, original_text: str, modified_text: str, filename: str) -> str:
        """
        Generates a unified diff string between original and modified text.
        """
        orig_lines = original_text.splitlines(keepends=True)
        mod_lines = modified_text.splitlines(keepends=True)
        diff = difflib.unified_diff(
            orig_lines,
            mod_lines,
            fromfile=f"a/{filename}",
            tofile=f"b/{filename}",
            n=3
        )
        return "".join(diff)

    @classmethod
    def inspect_dependencies(cls, workspace_root: str) -> Dict[str, Any]:
        """
        Inspects project manifests (package.json, requirements.txt) and returns dependencies.
        """
        root = Path(workspace_root).resolve()
        pkg_file = root / "package.json"
        req_file = root / "requirements.txt"

        deps = {"npm": {}, "python": []}

        if pkg_file.exists():
            try:
                pkg_data = json.loads(pkg_file.read_text(encoding="utf-8"))
                deps["npm"] = {
                    "dependencies": pkg_data.get("dependencies", {}),
                    "devDependencies": pkg_data.get("devDependencies", {}),
                    "scripts": pkg_data.get("scripts", {})
                }
            except Exception:
                pass

        if req_file.exists():
            try:
                lines = [l.strip() for l in req_file.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
                deps["python"] = lines
            except Exception:
                pass

        return deps
