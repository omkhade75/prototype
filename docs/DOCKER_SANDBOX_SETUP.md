# ORBIT AI — Secure Docker Sandbox Setup Guide

This guide explains how to configure, pre-pull, and verify the secure, offline-first containerized code execution engine for **C++17** and **Python 3.11** in ORBIT AI.

---

## 1. Security Architecture & Threat Model

ORBIT AI executes untrusted code submitted by students in an isolated sandbox environment.

### Mandatory Security Boundaries:
1. **Host Isolation**: Neither the Node.js Express process nor the Python FastAPI process directly executes user code (`eval`, `exec`, or host shell commands are strictly prohibited).
2. **Network Isolation**: All containers run with `--network none`, completely blocking access to local LAN, internet, loopback microservices, and host ports.
3. **Resource Quotas**:
   - **RAM Limit**: `256m` memory limit for execution (`512m` for compilation), with matching `--memory-swap` to prevent swap exhaustion.
   - **CPU Quota**: `--cpus="1.0"` preventing CPU starvation.
   - **Process Quota**: `--pids-limit 64` to prevent fork-bomb attacks.
4. **Dropped Privileges**:
   - Dropped Linux capabilities via `--cap-drop=ALL`.
   - Privilege escalation blocked via `--security-opt no-new-privileges`.
   - Root filesystem mounted read-only (`:ro`) during binary execution.
5. **Clean Workspace Isolation**:
   - Each submission compiles and runs inside a unique, ephemeral host directory created with `tempfile.TemporaryDirectory`.
   - Temporary containers run with `--rm` and are destroyed immediately upon process exit.
   - Host temporary folders are guaranteed deletion via `finally` lifecycle blocks.
6. **Argument Safety**:
   - Docker commands are always constructed as explicit argument lists passed directly to `subprocess.run()`. User source code is never evaluated through shell command string concatenation (`shell=False`).
7. **Safe Failure Mode**:
   - If Docker or the daemon is unavailable, ORBIT AI **fails safely** with an informative setup notice. It **never falls back** to running untrusted code on the host system.

---

## 2. Installing Docker Desktop on Windows

### Step 1: System Requirements
- Windows 10/11 64-bit (Home, Pro, Enterprise).
- WSL 2 (Windows Subsystem for Linux 2) enabled with virtualization support in BIOS/UEFI.

### Step 2: Install Docker Desktop
1. Download Docker Desktop for Windows: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Run the installer and ensure **"Use WSL 2 instead of Hyper-V"** is selected.
3. Restart your computer if prompted.

### Step 3: Enable Docker Engine
1. Launch **Docker Desktop** from the Windows Start menu.
2. In **Settings -> General**, check **"Use the WSL 2 based engine"**.
3. In **Settings -> Resources -> WSL Integration**, ensure integration with your default Linux distribution is turned on.
4. Verify that the Docker whale icon in your system tray shows: **"Docker Desktop is running"**.

---

## 3. Pre-Pulling Offline Runtime Images

To use ORBIT AI completely offline without internet or paid APIs, download the runtime images once before going offline:

### Pull C++17 Compiler Image (GCC)
```powershell
docker pull gcc:13-bookworm
```

### Pull Python 3.11 Runtime Image
```powershell
docker pull python:3.11-slim
```

### (Optional) Custom Configurable Images
You can configure custom image tags in your `.env` file or environment variables:
```env
ORBIT_DOCKER_CPP_IMAGE=gcc:13-bookworm
ORBIT_DOCKER_PYTHON_IMAGE=python:3.11-slim
```

---

## 4. Verifying Docker Connectivity & Capabilities

Test your Docker setup from PowerShell:

```powershell
# 1. Verify Docker CLI and Server connectivity
docker version

# 2. Test GCC isolated execution
docker run --rm --network none gcc:13-bookworm g++ --version

# 3. Test Python isolated execution
docker run --rm --network none python:3.11-slim python3 --version
```

If these commands succeed without errors, your local container sandbox is ready.

---

## 5. Launching ORBIT AI Microservices

Run the microservices in separate terminals:

```powershell
# Terminal 1: Python AI Service (Port 8000)
cd "ai-service"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Node.js Backend Gateway (Port 5000)
cd "backend"
node src/server.js

# Terminal 3: React Frontend (Port 5173)
cd "frontend"
npm run dev
```

Navigate to `http://localhost:5173` and click **Coding Playground** in the navigation bar.

---

## 6. Verifying C++ and Python Execution in ORBIT

1. In **Coding Playground**, select **Python (Python 3.11)**.
2. Choose problem **1. Two Sum**.
3. Click **Run Tests**:
   - If Docker is running, the program runs in the container, displaying:
     `Execution Results: 3 of 3 Test Cases Passed`, execution duration in milliseconds, actual stdout vs expected output.
4. Switch to **C++ (C++17)** and click **Run Tests**:
   - `g++` compiles the code inside the container with `-O2 -std=c++17 -Wall -Wextra`, executes the binary, and checks the results.
5. Introduce a syntax error (e.g. `int x = ;` in C++ or `def foo(` in Python) and click **Run Code**:
   - Real compiler stderr or Python traceback will display in the results box.
   - Click **"Debug Compiler Error with AI"** to have the tutor explain the root cause and recommended fix.

---

## 7. Limitations When Docker is Offline

If Docker is not installed or the engine is stopped:
- The top header will display an amber status badge: **Docker Offline**.
- Attempting to run code returns a structured response: `docker_unavailable`.
- The UI displays an actionable setup banner guiding you to start Docker Desktop.
- **Security Guarantee**: ORBIT AI **never** executes untrusted code directly on the host machine.
- All non-execution features (Knowledge Hub, TF-IDF Q&A, Agent Playground, Workflow Studio, and AI Tutor in Demo or Ollama mode) continue functioning offline without interruption.
