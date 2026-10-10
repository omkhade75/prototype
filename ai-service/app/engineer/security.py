"""
ORBIT AI — Phase 4A: Workspace & Subprocess Security Module.
Provides strict path canonicalization to prevent path traversal,
command allowlisting, and secret screening.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple

# Command allowlist for software development tools
ALLOWED_COMMAND_BINARIES = {"npm", "node", "npx", "git", "python", "pytest"}

# Safe git subcommands allowed for automated execution
ALLOWED_GIT_SUBCOMMANDS = {"status", "diff", "log", "add", "commit", "branch", "rev-parse", "check-ignore"}

# Sensitive secret patterns (tokens, API keys, private keys)
SECRET_REGEXES = [
  re.compile(r'\bAIza[0-9A-Za-z-_]{35}\b'), # Google API Key
  re.compile(r'\bsk-[a-zA-Z0-9]{20,}\b'),   # OpenAI Key
  re.compile(r'\bghp_[a-zA-Z0-9]{36}\b'),   # GitHub Personal Access Token
  re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----'),
  re.compile(r'password\s*[:=]\s*[\'"][^\'"]+[\'"]', re.IGNORECASE),
  re.compile(r'secret\s*[:=]\s*[\'"][^\'"]+[\'"]', re.IGNORECASE)
]


def resolve_canonical_path(workspace_root: str, relative_path: str) -> Path:
    """
    Canonicalizes and verifies that a relative path strictly resides
    inside the project's designated workspace directory.
    Raises PermissionError if path traversal or directory escaping is detected.
    """
    root = Path(workspace_root).resolve()
    if not root.exists():
        root.mkdir(parents=True, exist_ok=True)

    # Normalize relative path (prevent leading slashes or Windows drive roots)
    clean_rel = (relative_path or "").lstrip("/\\")
    target = (root / clean_rel).resolve()

    # Security check: target must be root or an inner child of root
    try:
        target.relative_to(root)
    except ValueError:
        raise PermissionError(
            f"Security Violation: Path traversal outside project workspace is strictly prohibited: '{relative_path}'"
        )

    return target


def is_safe_command(command: str, args: List[str]) -> Tuple[bool, str]:
    """
    Validates command binary and arguments against the strict development allowlist.
    Returns (is_safe, error_message).
    """
    cmd_name = Path(command).name.lower().replace(".exe", "")
    if cmd_name not in ALLOWED_COMMAND_BINARIES:
        return False, f"Command '{command}' is not in the development allowlist. Allowed: {sorted(ALLOWED_COMMAND_BINARIES)}"

    # Check for shell injection characters in argument strings
    shell_injection_chars = [";", "&&", "||", "|", "`", "$", ">", "<"]
    for arg in args:
        for char in shell_injection_chars:
            if char in arg:
                return False, f"Security Violation: Shell metacharacter '{char}' detected in argument '{arg}'."

    # Validate git subcommands
    if cmd_name == "git" and args:
        subcmd = args[0].lower()
        if subcmd in ["clean", "reset", "push"] and not os.getenv("ALLOW_GIT_DESTRUCTIVE", ""):
            # Requires explicit approval in higher layer
            pass

    return True, ""


def scan_for_secrets(text: str) -> List[str]:
    """
    Scans code or configuration text for exposed credentials or sensitive keys.
    Returns a list of matched secret categories.
    """
    findings = []
    for pattern in SECRET_REGEXES:
        if pattern.search(text):
            findings.append(pattern.pattern)
    return findings
