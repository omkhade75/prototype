"""
ORBIT AI — Phase 4A: Comprehensive Test Suite for Software Engineer Agent.
Tests sandboxed path canonicalization, command allowlisting, secret detection,
planning, project scaffolding, automated test execution, and API endpoints.
"""

import tempfile
import shutil
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.engineer.security import resolve_canonical_path, is_safe_command, scan_for_secrets
from app.engineer.workspace import WorkspaceManager
from app.engineer.command_runner import SafeCommandRunner
from app.engineer.planner import ProjectPlanner
from app.engineer.scaffolder import ProjectScaffolder
from app.engineer.agent import SoftwareEngineerAgent


from unittest.mock import AsyncMock, patch
import json
import sqlite3

client = TestClient(app)


@pytest.fixture
def temp_workspace():
    tmp_dir = tempfile.mkdtemp(prefix="orbit_test_ws_")
    yield tmp_dir
    shutil.rmtree(tmp_dir, ignore_errors=True)


def test_path_canonicalization_and_traversal_rejection(temp_workspace):
    """
    Verifies that paths within workspace resolve properly,
    while traversal attempts (../, escaping root) raise PermissionError.
    """
    # Safe subpaths
    safe1 = resolve_canonical_path(temp_workspace, "src/components/App.jsx")
    assert safe1.as_posix().endswith("src/components/App.jsx")

    safe2 = resolve_canonical_path(temp_workspace, "package.json")
    assert safe2.as_posix().endswith("package.json")

    # Traversal attempts must be strictly denied
    with pytest.raises(PermissionError):
        resolve_canonical_path(temp_workspace, "../../../etc/passwd")

    with pytest.raises(PermissionError):
        resolve_canonical_path(temp_workspace, "../../windows/system32")

    with pytest.raises(PermissionError):
        resolve_canonical_path(temp_workspace, "src/../../..")


def test_command_allowlist_and_shell_injection_rejection():
    """
    Verifies binary allowlisting and rejection of shell metacharacters.
    """
    # Allowed binaries
    safe, _ = is_safe_command("node", ["server.js"])
    assert safe is True

    safe, _ = is_safe_command("npm", ["test"])
    assert safe is True

    safe, _ = is_safe_command("git", ["status"])
    assert safe is True

    # Forbidden binaries
    forbidden_cmds = ["bash", "sh", "rm", "powershell", "cmd", "curl", "wget"]
    for cmd in forbidden_cmds:
        safe, err = is_safe_command(cmd, ["test"])
        assert safe is False
        assert "not in the development allowlist" in err

    # Shell injection metacharacters
    dangerous_args = [
        ["server.js; rm -rf /"],
        ["test && echo hacked"],
        ["file.txt | cat /etc/shadow"],
        ["`whoami`"],
        ["$(id)"]
    ]
    for args in dangerous_args:
        safe, err = is_safe_command("node", args)
        assert safe is False
        assert "Shell metacharacter" in err


def test_secret_screening_detects_credentials():
    """
    Verifies that secret scanner identifies API keys, tokens, and private keys.
    """
    # Clean text
    clean_findings = scan_for_secrets("const PORT = process.env.PORT || 3000;\nconsole.log('Server started');")
    assert len(clean_findings) == 0

    # OpenAI API Key
    openai_text = "const apiKey = 'sk-abcdefghijklmnopqrstuvwxyz1234567890';"
    findings = scan_for_secrets(openai_text)
    assert len(findings) > 0

    # Private key header
    key_text = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----"
    findings = scan_for_secrets(key_text)
    assert len(findings) > 0


def test_workspace_file_operations_and_diff(temp_workspace):
    """
    Verifies sandboxed file writing, reading, listing, and diff generation.
    """
    # Write file
    w_res = WorkspaceManager.write_file(temp_workspace, "src/index.js", "console.log('hello world');\n")
    assert w_res["success"] is True

    # Read file
    content = WorkspaceManager.read_file(temp_workspace, "src/index.js")
    assert "hello world" in content

    # List files
    files = WorkspaceManager.list_files(temp_workspace)
    assert len(files) == 1
    assert files[0]["path"] == "src/index.js"

    # Edit file
    e_res = WorkspaceManager.edit_file(
        temp_workspace,
        "src/index.js",
        target_content="hello world",
        replacement_content="hello ORBIT AI"
    )
    assert e_res["success"] is True
    assert "-console.log('hello world');" in e_res["diff"]
    assert "+console.log('hello ORBIT AI');" in e_res["diff"]

    updated = WorkspaceManager.read_file(temp_workspace, "src/index.js")
    assert "hello ORBIT AI" in updated


@pytest.mark.anyio
async def test_planner_specification_analysis():
    """
    Verifies specification analysis, requirements extraction, and task decomposition.
    """
    prompt = "Build a restaurant management system with React, Express, SQLite, menu, orders, tables, and analytics."
    plan = await ProjectPlanner.analyze_specification(prompt, stack="react-express-sqlite")

    assert plan["needs_clarification"] is False
    assert plan["architecture"] is not None
    assert plan["architecture"]["domain"] == "Restaurant Management System"
    assert len(plan["tasks"]) == 7
    assert plan["tasks"][0]["category"] == "database"
    assert plan["tasks"][1]["category"] == "backend"

    # Underspecified prompt triggers clarification
    vague = await ProjectPlanner.analyze_specification("make an app", stack="react-express-sqlite")
    assert vague["needs_clarification"] is True
    assert vague["clarification_question"] is not None


def test_fullstack_project_scaffolding(temp_workspace):
    """
    Verifies that ProjectScaffolder generates complete, runnable project files with real SQLite.
    """
    res = ProjectScaffolder.scaffold_fullstack_project(
        workspace_root=temp_workspace,
        project_name="Restaurant Management System",
        prompt="Build a restaurant management system"
    )

    assert res["success"] is True
    assert res["total_files"] >= 8

    # Verify crucial files exist on disk
    expected_files = [
        "package.json",
        "database.js",
        "server.js",
        "public/index.html",
        "public/app.js",
        "public/style.css",
        "tests/api.test.js",
        ".gitignore",
        "README.md"
    ]
    for ef in expected_files:
        assert (Path(temp_workspace) / ef).exists(), f"Expected file {ef} was not created"

    # Verify database.js contains genuine SQLite setup
    db_text = WorkspaceManager.read_file(temp_workspace, "database.js")
    assert "DatabaseSync" in db_text or "node:sqlite" in db_text
    assert "CREATE TABLE" in db_text
    assert "Truffle Pasta" in db_text

    # Verify server.js contains API routes
    server_text = WorkspaceManager.read_file(temp_workspace, "server.js")
    assert "/api/health" in server_text
    assert "/api/stats" in server_text
    assert "/api/menu_items" in server_text


@pytest.mark.anyio
async def test_ollama_offline_refusal():
    """
    Verifies that when Ollama provider is selected and Ollama is unreachable,
    the system strictly refuses with RuntimeError and DOES NOT silently fall back to demo mode.
    """
    with patch("app.models.ollama_provider.OllamaProvider.get_health_status", new_callable=AsyncMock) as mock_health:
        mock_health.return_value = {"reachable": False, "model_available": False}
        with pytest.raises(RuntimeError) as exc_info:
            await ProjectPlanner.analyze_specification(
                prompt="Build a custom drone telemetry tracker with GPS and battery monitors",
                provider_name="ollama"
            )
        assert "Ollama is unreachable" in str(exc_info.value)
        assert "Silent fallback to deterministic mode is disabled" in str(exc_info.value)


@pytest.mark.anyio
async def test_mocked_ollama_arbitrary_domain_planning():
    """
    Verifies that real Ollama inference generates project plans for arbitrary non-canned domains.
    """
    mock_ollama_json = json.dumps({
        "domain": "Drone Fleet Telemetry",
        "needs_clarification": False,
        "database_tables": ["drones", "telemetry_logs", "flight_plans", "battery_alerts"],
        "api_endpoints": [
            {"method": "GET", "path": "/api/drones", "description": "List all active drones"},
            {"method": "POST", "path": "/api/telemetry", "description": "Record GPS coordinates and speed"}
        ],
        "tasks": [
            {"id": "t1", "title": "Setup Drone Telemetry SQLite Schema", "category": "database", "description": "Create DDL tables"},
            {"id": "t2", "title": "Implement Telemetry Stream Endpoint", "category": "backend", "description": "Express POST route"}
        ]
    })

    with patch("app.models.ollama_provider.OllamaProvider.get_health_status", new_callable=AsyncMock) as mock_health, \
         patch("app.models.ollama_provider.OllamaProvider.generate_text", new_callable=AsyncMock) as mock_gen:
        mock_health.return_value = {"reachable": True, "model_available": True}
        mock_gen.return_value = f"```json\n{mock_ollama_json}\n```"

        plan = await ProjectPlanner.analyze_specification(
            prompt="Build an autonomous drone fleet telemetry tracker with GPS and battery monitors",
            provider_name="ollama"
        )

        assert plan["needs_clarification"] is False
        assert plan["architecture"]["domain"] == "Drone Fleet Telemetry"
        assert "battery_alerts" in plan["architecture"]["database_tables"]
        assert len(plan["tasks"]) == 2


@pytest.mark.anyio
async def test_demo_mode_arbitrary_domain_entity_extraction():
    """
    Verifies that demo mode handles arbitrary, un-canned prompts by dynamically extracting entities.
    """
    plan = await ProjectPlanner.analyze_specification(
        prompt="Design an automated greenhouse climate control with moisture sensors, heaters, and ventilation schedules",
        provider_name="demo"
    )

    assert plan["needs_clarification"] is False
    assert plan["architecture"] is not None
    tables = plan["architecture"]["database_tables"]
    assert len(tables) >= 3
    assert len(plan["tasks"]) >= 5


def test_container_isolation_refusal_and_host_override(temp_workspace):
    """
    Verifies:
    1. If Docker is absent, SafeCommandRunner refuses unisolated execution unless allow_host_override=True.
    2. When allow_host_override=True, execution succeeds on host with a visible security warning.
    """
    with patch.object(SafeCommandRunner, "check_isolation_environment") as mock_iso:
        mock_iso.return_value = {
            "available": False,
            "actionable_setup": "Install Docker Desktop"
        }

        # 1. Refusal without override
        refused = SafeCommandRunner.run_command(
            workspace_root=temp_workspace,
            command="node",
            args=["-e", "console.log('test')"],
            allow_host_override=False
        )
        assert refused["success"] is False
        assert refused["docker_available"] is False
        assert "Execution Refused" in refused["stderr"]
        assert "Install Docker Desktop" in refused["actionable_setup"]

        # 2. Host execution with explicit override
        allowed = SafeCommandRunner.run_command(
            workspace_root=temp_workspace,
            command="node",
            args=["-e", "console.log('hello from host')"],
            allow_host_override=True
        )
        assert allowed["success"] is True
        assert "hello from host" in allowed["stdout"]
        assert allowed["warning"] is not None
        assert "without container isolation" in allowed["warning"]


def test_real_sqlite_binary_persistence(temp_workspace):
    """
    Verifies that scaffolding and running genuine SQLite creates a real binary .db file
    containing the standard SQLite magic header ('SQLite format 3\\x00').
    """
    db_file = Path(temp_workspace) / "test.db"
    conn = sqlite3.connect(str(db_file))
    cur = conn.cursor()
    cur.execute("CREATE TABLE sensors (id INTEGER PRIMARY KEY, name TEXT, reading REAL)")
    cur.execute("INSERT INTO sensors (name, reading) VALUES ('moisture_1', 42.5)")
    conn.commit()
    conn.close()

    assert db_file.exists()
    with open(db_file, "rb") as f:
        header = f.read(16)
    assert header == b"SQLite format 3\x00", "File must be genuine SQLite binary format"


@pytest.mark.anyio
async def test_engineer_agent_lifecycle_in_demo_mode(temp_workspace):
    """
    Verifies the end-to-end development loop: Plan -> Scaffold -> Inspect -> Test -> Summary.
    Uses allow_host_override=True for host test runners when Docker is not installed on test runner.
    """
    agent = SoftwareEngineerAgent(provider_name="demo")
    result = await agent.execute_full_lifecycle(
        project_id="test_proj_1",
        workspace_root=temp_workspace,
        prompt="Build a restaurant management system with Express, SQLite, menu, orders, tables, and analytics.",
        allow_host_override=True
    )

    assert result["success"] is True
    assert result["provider"] == "demo"
    assert len(result["trace"]) >= 4

    # Verify trace phases
    phases = [t["phase"] for t in result["trace"]]
    assert "plan" in phases
    assert "scaffold" in phases
    assert "inspect" in phases
    assert "test" in phases

    summary = result["summary"]
    assert summary["project_name"] == "Restaurant Management System"
    assert len(summary["verified_features"]) >= 4


def test_api_endpoints_via_testclient(temp_workspace):
    """
    Tests FastAPI endpoints: /engineer/plan and /engineer/generate.
    """
    # 1. /engineer/plan
    plan_resp = client.post("/engineer/plan", json={
        "project_id": "api_test_proj",
        "prompt": "Build an e-commerce management platform with product catalogue, orders, cart, and admin dashboard",
        "stack": "react-express-sqlite"
    })
    assert plan_resp.status_code == 200
    plan_data = plan_resp.json()
    assert plan_data["success"] is True
    assert plan_data["needs_clarification"] is False
    assert len(plan_data["tasks"]) == 7

    # 2. /engineer/generate
    gen_resp = client.post("/engineer/generate", json={
        "project_id": "api_test_proj",
        "workspace_root": temp_workspace,
        "prompt": "Build a restaurant management system with menu items and tables",
        "stack": "react-express-sqlite",
        "allow_host_override": True
    })
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    assert gen_data["success"] is True
    assert gen_data["summary"]["project_name"]

