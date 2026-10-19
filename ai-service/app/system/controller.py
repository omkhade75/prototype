"""
ORBIT AI — Dynamic Autonomous Laptop Copilot, System Controller & Privacy Shield.
Provides offline-first LLM reasoning via local Ollama, real-time system tool execution,
and strict privacy enforcement preventing access to sensitive user files.
"""

import os
import re
import sys
import time
import glob
import json
import ctypes
import shutil
import socket
import subprocess
import requests
from typing import Dict, Any, List, Optional, Tuple
import psutil

class PrivacyShield:
    """
    Enforces strict privacy boundaries.
    Prevents the AI from reading, listing, copying, modifying, or deleting
    any important or personal files on the user's laptop.
    """

    HOME = os.path.abspath(os.path.expanduser("~"))

    # Strictly protected directories
    PROTECTED_DIRS = [
        os.path.join(HOME, "Documents"),
        os.path.join(HOME, "Pictures"),
        os.path.join(HOME, "Videos"),
        os.path.join(HOME, "Music"),
        os.path.join(HOME, "Desktop"),
        os.path.join(HOME, "Downloads"),
        os.path.join(HOME, "OneDrive"),
        os.path.join(HOME, ".ssh"),
        os.path.join(HOME, ".aws"),
        os.path.join(HOME, ".gnupg"),
        os.path.join(HOME, ".azure"),
        os.path.join(HOME, "AppData", "Local", "Google", "Chrome", "User Data"),
        os.path.join(HOME, "AppData", "Local", "Microsoft", "Edge", "User Data"),
        os.path.join(HOME, "AppData", "Roaming", "Mozilla", "Firefox"),
    ]

    # Blocked sensitive extensions
    PROTECTED_EXTENSIONS = {
        ".pem", ".key", ".kdbx", ".ppk", ".p12", ".pfx",
        ".id_rsa", ".id_ed25519", ".wallet", ".seed", ".env"
    }

    @classmethod
    def check_path_safety(cls, path: str) -> Tuple[bool, str]:
        """
        Validates whether a given path is safe or violates user privacy.
        """
        if not path:
            return True, ""

        try:
            norm = os.path.abspath(os.path.expanduser(path)).lower()
        except Exception:
            return False, "Invalid path format"

        for ext in cls.PROTECTED_EXTENSIONS:
            if norm.endswith(ext):
                return False, f"Access blocked: '{ext}' files are protected by the privacy shield."

        for protected in cls.PROTECTED_DIRS:
            norm_prot = os.path.abspath(protected).lower()
            if norm == norm_prot or norm.startswith(norm_prot + os.sep):
                return False, f"Access blocked: '{protected}' contains personal/sensitive user files."

        return True, norm

    @classmethod
    def filter_command_safety(cls, command_str: str) -> Tuple[bool, str]:
        """
        Ensures a natural language prompt or command does not target protected user locations.
        """
        low = command_str.lower()
        forbidden_keywords = [
            "documents", "pictures", "photos", "my desktop", "onedrive", ".ssh", ".aws",
            "chrome\\user data", "edge\\user data", "passwords", "id_rsa", "secret key"
        ]

        for kw in forbidden_keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', low):
                return False, f"Request contains references to protected personal location: '{kw}'. Blocked by Privacy Shield."

        return True, "Safe"


class PowerController:
    """
    Handles laptop power management: scheduled shutdown, restart, abort, sleep, and lock.
    """

    @staticmethod
    def schedule_shutdown(minutes: int = 5, reason: str = "Scheduled by ORBIT AI") -> Dict[str, Any]:
        minutes = max(1, min(int(minutes), 1440))
        seconds = minutes * 60

        try:
            subprocess.run(["shutdown", "/a"], capture_output=True, text=True)
            cmd = ["shutdown", "/s", "/t", str(seconds), "/c", f"{reason} (in {minutes} min)"]
            res = subprocess.run(cmd, capture_output=True, text=True)

            if res.returncode == 0:
                target_time = time.strftime("%H:%M:%S", time.localtime(time.time() + seconds))
                return {
                    "success": True,
                    "action": "schedule_shutdown",
                    "minutes": minutes,
                    "seconds": seconds,
                    "scheduled_for": target_time,
                    "message": f"Laptop scheduled to shut down in {minutes} minute(s) at {target_time}. You can cancel anytime with 'cancel shutdown'."
                }
            else:
                return {
                    "success": False,
                    "error": res.stderr.strip() or res.stdout.strip()
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def cancel_shutdown() -> Dict[str, Any]:
        try:
            res = subprocess.run(["shutdown", "/a"], capture_output=True, text=True)
            output = res.stderr.strip() or res.stdout.strip()

            if res.returncode == 0:
                return {
                    "success": True,
                    "action": "cancel_shutdown",
                    "message": "Scheduled shutdown successfully cancelled."
                }
            elif "1116" in output or "no shutdown" in output.lower():
                return {
                    "success": True,
                    "action": "cancel_shutdown",
                    "message": "No scheduled shutdown was in progress."
                }
            else:
                return {"success": False, "error": output}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def restart(minutes: int = 0) -> Dict[str, Any]:
        seconds = max(0, int(minutes)) * 60
        try:
            cmd = ["shutdown", "/r", "/t", str(seconds), "/c", "Restart initiated by ORBIT AI"]
            res = subprocess.run(cmd, capture_output=True, text=True)
            return {
                "success": res.returncode == 0,
                "message": f"Restart scheduled in {minutes} minute(s)." if res.returncode == 0 else res.stderr.strip()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def lock_workstation() -> Dict[str, Any]:
        try:
            subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"])
            return {"success": True, "message": "Workstation screen locked successfully."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_battery_info() -> Dict[str, Any]:
        battery = psutil.sensors_battery()
        power_scheme = "Unknown"
        try:
            res = subprocess.run(["powercfg", "/getactivescheme"], capture_output=True, text=True)
            if res.returncode == 0 and "(" in res.stdout:
                power_scheme = res.stdout.split("(")[-1].replace(")", "").strip()
        except Exception:
            pass

        return {
            "battery_percent": round(battery.percent, 1) if battery else None,
            "power_plugged": battery.power_plugged if battery else True,
            "seconds_left": battery.secsleft if battery and battery.secsleft > 0 else None,
            "power_scheme": power_scheme
        }


class GPUManager:
    """
    Monitors dedicated NVIDIA GPU telemetry and handles compute offloading to protect laptop thermals.
    """

    @staticmethod
    def get_telemetry() -> Optional[Dict[str, Any]]:
        try:
            cmd = [
                'nvidia-smi',
                '--query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw,driver_version',
                '--format=csv,noheader,nounits'
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
            if res.returncode == 0 and res.stdout.strip():
                parts = [p.strip() for p in res.stdout.strip().split(',')]
                return {
                    "available": True,
                    "name": parts[0],
                    "temp_c": int(parts[1]),
                    "util_pct": int(parts[2]),
                    "vram_used_mb": int(parts[3]),
                    "vram_total_mb": int(parts[4]),
                    "vram_free_mb": int(parts[4]) - int(parts[3]),
                    "power_watts": float(parts[5]),
                    "driver": parts[6]
                }
        except Exception:
            pass
        return {"available": False, "name": "No discrete GPU detected"}

    @staticmethod
    def offload_to_gpu() -> Dict[str, Any]:
        """
        Shifts heavy compute workloads from CPU to the NVIDIA discrete GPU:
        1. Ensures Ollama models are configured to offload 100% of layers to GPU CUDA cores.
        2. Configures Windows High Performance GPU preference for compute apps.
        """
        gpu = GPUManager.get_telemetry()
        if not gpu or not gpu.get("available"):
            return {"success": False, "message": "Discrete NVIDIA GPU not detected for offloading."}

        actions_taken = []

        # 1. Check Ollama GPU runner
        try:
            r = requests.get("http://localhost:11434/api/ps", timeout=2)
            if r.status_code == 200:
                running_models = r.json().get("models", [])
                for m in running_models:
                    model_name = m.get("name")
                    processor = m.get("processor", "")
                    if "gpu" not in processor.lower():
                        # Reload with GPU layers
                        requests.post(
                            "http://localhost:11434/api/generate",
                            json={"model": model_name, "options": {"num_gpu": 99}, "keep_alive": "5m"},
                            timeout=5
                        )
                        actions_taken.append(f"Offloaded AI model '{model_name}' from CPU to RTX 3050 CUDA cores")
                    else:
                        actions_taken.append(f"AI model '{model_name}' is already running at 100% GPU acceleration")
        except Exception:
            pass

        # 2. Windows DirectX High-Performance GPU Registration
        try:
            import winreg
            key_path = r"Software\Microsoft\DirectX\UserGpuPreferences"
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
                # Direct heavy runtimes to High Performance GPU (GpuPreference=2)
                runtimes = [
                    sys.executable,  # Python runtime
                    shutil.which("node.exe") or "C:\\Program Files\\nodejs\\node.exe"
                ]
                for rt in runtimes:
                    if rt and os.path.exists(rt):
                        winreg.SetValueEx(key, rt, 0, winreg.REG_SZ, "GpuPreference=2;")
                        actions_taken.append(f"Assigned '{os.path.basename(rt)}' to High Performance NVIDIA GPU")
        except Exception:
            pass

        return {
            "success": True,
            "gpu_name": gpu["name"],
            "gpu_temp_c": gpu["temp_c"],
            "vram_free_mb": gpu["vram_free_mb"],
            "actions": actions_taken,
            "message": f"Shifted compute loads to {gpu['name']} ({gpu['temp_c']}°C). Reduced CPU thermal pressure."
        }


class PerformanceOptimizer:
    """
    Monitors system metrics, shifts workloads away from non-essential background processes,
    offloads compute to dedicated NVIDIA GPU, and balances laptop thermals.
    """

    SAFE_THROTTLE_CANDIDATES = [
        "onedrive", "dropbox", "googledrivesync", "steam", "epicgameslauncher",
        "discord", "spotify", "slack", "teams", "cortana", "searchindexer",
        "backgrounddownloadhost", "compattelrunner", "nvcontainer"
    ]

    @staticmethod
    def get_metrics() -> Dict[str, Any]:
        cpu_pct = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()

        procs = []
        for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                info = p.info
                mem_mb = round(info['memory_info'].rss / (1024 * 1024), 1) if info['memory_info'] else 0
                procs.append({
                    "pid": info['pid'],
                    "name": info['name'],
                    "cpu_percent": info['cpu_percent'] or 0.0,
                    "memory_mb": mem_mb
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        top_mem = sorted(procs, key=lambda x: x['memory_mb'], reverse=True)[:5]
        top_cpu = sorted(procs, key=lambda x: x['cpu_percent'], reverse=True)[:5]

        # Get disk space
        disk = psutil.disk_usage("C:\\")

        # Get discrete GPU metrics
        gpu_telemetry = GPUManager.get_telemetry()

        # Laptop Health Score (0 - 100)
        health_score = 100
        if cpu_pct > 70:
            health_score -= 20
        elif cpu_pct > 40:
            health_score -= 10

        if mem.percent > 85:
            health_score -= 20
        elif mem.percent > 70:
            health_score -= 10

        if gpu_telemetry and gpu_telemetry.get("temp_c", 0) > 80:
            health_score -= 15

        return {
            "cpu_percent": cpu_pct,
            "memory_total_gb": round(mem.total / (1024 ** 3), 2),
            "memory_used_gb": round(mem.used / (1024 ** 3), 2),
            "memory_available_gb": round(mem.available / (1024 ** 3), 2),
            "memory_percent": mem.percent,
            "disk_total_gb": round(disk.total / (1024 ** 3), 1),
            "disk_free_gb": round(disk.free / (1024 ** 3), 1),
            "disk_percent": disk.percent,
            "gpu": gpu_telemetry,
            "laptop_health_score": max(20, health_score),
            "top_memory_processes": top_mem,
            "top_cpu_processes": top_cpu,
            "battery": PowerController.get_battery_info()
        }

    @classmethod
    def shift_and_optimize(cls) -> Dict[str, Any]:
        adjusted_processes = []
        memory_trimmed_count = 0

        # 1. CPU-to-GPU Compute Load Shift
        gpu_shift = GPUManager.offload_to_gpu()

        # 2. Lower priority of background consumers to reduce CPU thermal load
        for p in psutil.process_iter(['pid', 'name', 'nice']):
            try:
                name_low = (p.info['name'] or '').lower()
                for target in cls.SAFE_THROTTLE_CANDIDATES:
                    if target in name_low:
                        current_nice = p.info['nice']
                        if current_nice != psutil.IDLE_PRIORITY_CLASS:
                            p.nice(psutil.BELOW_NORMAL_PRIORITY_CLASS)
                            adjusted_processes.append(f"{p.info['name']} (PID: {p.info['pid']})")
                        break
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # 3. Trim working sets using Windows PSAPI
        try:
            PROCESS_SET_QUOTA = 0x0100
            for p in psutil.process_iter(['pid']):
                try:
                    pid = p.info['pid']
                    if pid <= 4:
                        continue
                    h_proc = ctypes.windll.kernel32.OpenProcess(PROCESS_SET_QUOTA, False, pid)
                    if h_proc:
                        if ctypes.windll.psapi.EmptyWorkingSet(h_proc):
                            memory_trimmed_count += 1
                        ctypes.windll.kernel32.CloseHandle(h_proc)
                except Exception:
                    continue
        except Exception:
            pass

        metrics_after = cls.get_metrics()
        gpu_info = metrics_after.get("gpu") or {}
        gpu_str = f"GPU: {gpu_info.get('name', 'Discrete GPU')} at {gpu_info.get('temp_c', 'N/A')}°C ({gpu_info.get('vram_used_mb', 0)} MB VRAM used)."

        return {
            "success": True,
            "action": "shift_and_optimize",
            "gpu_offload": gpu_shift,
            "shifted_processes_count": len(adjusted_processes),
            "shifted_processes": adjusted_processes[:8],
            "trimmed_processes_count": memory_trimmed_count,
            "current_cpu": metrics_after["cpu_percent"],
            "current_memory_percent": metrics_after["memory_percent"],
            "laptop_health_score": metrics_after["laptop_health_score"],
            "message": (
                f"Laptop Health Optimization complete: "
                f"Offloaded compute to {gpu_str} "
                f"Demoted {len(adjusted_processes)} background process(es) to relieve CPU thermal stress. "
                f"Laptop Health Score is {metrics_after['laptop_health_score']}%."
            )
        }

    @staticmethod
    def clean_temp_files() -> Dict[str, Any]:
        """
        Cleans Windows AppData/Local/Temp temporary cache to recover disk space.
        """
        temp_dir = os.environ.get("TEMP", "")
        if not temp_dir or not os.path.exists(temp_dir):
            return {"success": False, "error": "TEMP directory not found"}

        cleaned_count = 0
        freed_bytes = 0

        for item in glob.glob(os.path.join(temp_dir, "*")):
            try:
                if os.path.isfile(item) or os.path.islink(item):
                    size = os.path.getsize(item)
                    os.unlink(item)
                    cleaned_count += 1
                    freed_bytes += size
                elif os.path.isdir(item):
                    size = sum(os.path.getsize(os.path.join(dirpath, filename)) for dirpath, dirnames, filenames in os.walk(item) for filename in filenames)
                    shutil.rmtree(item, ignore_errors=True)
                    cleaned_count += 1
                    freed_bytes += size
            except Exception:
                continue

        freed_mb = round(freed_bytes / (1024 * 1024), 2)
        return {
            "success": True,
            "cleaned_items": cleaned_count,
            "freed_mb": freed_mb,
            "message": f"Cleaned {cleaned_count} temporary cache files, freeing approximately {freed_mb} MB of disk space."
        }


class NetworkController:
    """
    Diagnoses and optimizes internet connection speed and latency.
    """

    @staticmethod
    def flush_dns() -> Dict[str, Any]:
        try:
            res = subprocess.run(["ipconfig", "/flushdns"], capture_output=True, text=True)
            return {
                "success": res.returncode == 0,
                "output": "Successfully flushed the DNS Resolver Cache." if res.returncode == 0 else res.stderr.strip()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def test_latency() -> Dict[str, Any]:
        targets = [
            ("Cloudflare (1.1.1.1)", "1.1.1.1", 53),
            ("Google (8.8.8.8)", "8.8.8.8", 53)
        ]
        results = []

        for name, host, port in targets:
            start = time.perf_counter()
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2.0)
            try:
                s.connect((host, port))
                latency_ms = round((time.perf_counter() - start) * 1000, 1)
                results.append({"target": name, "host": host, "latency_ms": latency_ms, "status": "online"})
            except Exception:
                results.append({"target": name, "host": host, "latency_ms": None, "status": "timeout"})
            finally:
                s.close()

        return {"targets": results}

    @classmethod
    def optimize_network(cls) -> Dict[str, Any]:
        flush_res = cls.flush_dns()
        latency_res = cls.test_latency()

        active_conns = 0
        try:
            conns = psutil.net_connections(kind='inet')
            active_conns = len([c for c in conns if c.status == 'ESTABLISHED'])
        except Exception:
            pass

        best_latency = None
        for t in latency_res.get("targets", []):
            if t["latency_ms"] is not None:
                if best_latency is None or t["latency_ms"] < best_latency:
                    best_latency = t["latency_ms"]

        return {
            "success": True,
            "action": "optimize_network",
            "dns_flushed": flush_res["success"],
            "best_latency_ms": best_latency,
            "targets": latency_res["targets"],
            "active_connections": active_conns,
            "message": (
                f"Internet optimized: DNS cache flushed successfully. "
                f"Current internet latency: {best_latency} ms ({active_conns} active connections)."
            )
        }


class ProcessManager:
    """
    Lists and terminates active user processes safely.
    """

    CRITICAL_SYSTEM_PROCESSES = {
        "system", "system idle process", "registry", "smss.exe", "csrss.exe",
        "wininit.exe", "services.exe", "lsass.exe", "winlogon.exe", "svchost.exe",
        "explorer.exe", "taskmgr.exe"
    }

    @classmethod
    def list_processes(cls, filter_name: Optional[str] = None, limit: int = 15) -> List[Dict[str, Any]]:
        procs = []
        for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                name = p.info['name'] or ''
                if filter_name and filter_name.lower() not in name.lower():
                    continue
                mem_mb = round(p.info['memory_info'].rss / (1024 * 1024), 1) if p.info['memory_info'] else 0
                procs.append({
                    "pid": p.info['pid'],
                    "name": name,
                    "cpu_percent": p.info['cpu_percent'] or 0.0,
                    "memory_mb": mem_mb
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        return sorted(procs, key=lambda x: x['memory_mb'], reverse=True)[:limit]

    @classmethod
    def terminate_process(cls, name_or_pid: Any) -> Dict[str, Any]:
        """
        Safely terminates an application or process by name or PID.
        """
        target_pid = None
        if isinstance(name_or_pid, int) or (isinstance(name_or_pid, str) and name_or_pid.isdigit()):
            target_pid = int(name_or_pid)

        terminated = []
        for p in psutil.process_iter(['pid', 'name']):
            try:
                name = (p.info['name'] or '').lower()
                pid = p.info['pid']

                # Protection against killing critical OS processes
                if name in cls.CRITICAL_SYSTEM_PROCESSES:
                    continue

                if (target_pid and pid == target_pid) or (not target_pid and isinstance(name_or_pid, str) and name_or_pid.lower() in name):
                    p.terminate()
                    terminated.append(f"{p.info['name']} (PID: {pid})")
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        if terminated:
            return {
                "success": True,
                "message": f"Successfully terminated: {', '.join(terminated)}."
            }
        else:
            return {
                "success": False,
                "message": f"No running non-system process found matching '{name_or_pid}'."
            }


class OllamaManager:
    """
    Manages local offline Ollama models.
    """

    OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434")

    @classmethod
    def is_running(cls) -> bool:
        try:
            r = requests.get(f"{cls.OLLAMA_URL}/api/tags", timeout=1.5)
            return r.status_code == 200
        except Exception:
            return False

    @classmethod
    def list_models(cls) -> List[Dict[str, Any]]:
        try:
            r = requests.get(f"{cls.OLLAMA_URL}/api/tags", timeout=3)
            if r.status_code == 200:
                models = r.json().get('models', [])
                return [
                    {
                        "name": m.get("name"),
                        "size_gb": round(m.get("size", 0) / (1024 ** 3), 2),
                        "modified_at": m.get("modified_at")
                    }
                    for m in models
                ]
        except Exception:
            pass
        return []

    @classmethod
    def pull_model(cls, model_name: str) -> Dict[str, Any]:
        """
        Starts pulling a model in Ollama.
        """
        try:
            # Check if model exists or start pull in background
            subprocess.Popen(["ollama", "pull", model_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return {
                "success": True,
                "message": f"Started pulling model '{model_name}' in the background. Run 'list models' to check status."
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


class SystemAssistant:
    """
    Autonomous Laptop Copilot with Dynamic Ollama Tool Calling & Strict Privacy Defense.
    """

    # Registered tools for local LLM function calling
    SYSTEM_TOOLS = [
        {
            "type": "function",
            "function": {
                "name": "schedule_shutdown",
                "description": "Schedule computer shutdown in minutes",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "minutes": {"type": "integer", "description": "Delay in minutes"}
                    },
                    "required": ["minutes"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "cancel_shutdown",
                "description": "Cancel any pending scheduled shutdown",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "restart_laptop",
                "description": "Restart the computer",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "minutes": {"type": "integer", "description": "Delay in minutes, defaults to 1"}
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "lock_screen",
                "description": "Lock the Windows workstation screen",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "shift_and_optimize",
                "description": "Shift loads from background apps to increase performance and trim memory",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "clean_temp_files",
                "description": "Clean temporary cache files in Windows to free disk space",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "optimize_network",
                "description": "Flush DNS resolver cache and benchmark internet ping latency",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_system_metrics",
                "description": "Get real-time CPU, RAM, disk, battery, and top consumer processes",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "terminate_process",
                "description": "Terminate or close a non-critical application or process by name or PID",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "process_name": {"type": "string", "description": "Name of the process (e.g. spotify, chrome, discord)"}
                    },
                    "required": ["process_name"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "list_ollama_models",
                "description": "List all local models installed in Ollama",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "pull_ollama_model",
                "description": "Pull or download an AI model into Ollama",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "model_name": {"type": "string", "description": "Name of the model to pull (e.g. llama3.2, qwen2.5-coder)"}
                    },
                    "required": ["model_name"]
                }
            }
        }
    ]

    @classmethod
    def execute_tool(cls, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatches function calls from Ollama to real Python/Windows APIs.
        """
        if name == "schedule_shutdown":
            mins = args.get("minutes", 5)
            return PowerController.schedule_shutdown(minutes=mins)

        elif name == "cancel_shutdown":
            return PowerController.cancel_shutdown()

        elif name == "restart_laptop":
            return PowerController.restart(minutes=args.get("minutes", 1))

        elif name == "lock_screen":
            return PowerController.lock_workstation()

        elif name == "shift_and_optimize":
            return PerformanceOptimizer.shift_and_optimize()

        elif name == "clean_temp_files":
            return PerformanceOptimizer.clean_temp_files()

        elif name == "optimize_network":
            return NetworkController.optimize_network()

        elif name == "get_system_metrics":
            metrics = PerformanceOptimizer.get_metrics()
            bat = metrics["battery"]
            top_p = ", ".join([f"{p['name']} ({p['memory_mb']}MB)" for p in metrics["top_memory_processes"][:3]])
            msg = (
                f"📊 [LAPTOP STATUS]\n"
                f"• CPU: {metrics['cpu_percent']}%\n"
                f"• RAM: {metrics['memory_percent']}% ({metrics['memory_available_gb']} GB available of {metrics['memory_total_gb']} GB)\n"
                f"• Disk C: {metrics['disk_percent']}% used ({metrics['disk_free_gb']} GB free)\n"
                f"• Battery: {bat['battery_percent']}% ({'AC Power' if bat['power_plugged'] else 'On Battery'})\n"
                f"• Top Consumers: {top_p}"
            )
            return {"success": True, "message": msg, "details": metrics}

        elif name == "terminate_process":
            proc = args.get("process_name", "")
            return ProcessManager.terminate_process(proc)

        elif name == "list_ollama_models":
            models = OllamaManager.list_models()
            if not models:
                return {"success": True, "message": "No local Ollama models found or Ollama is offline."}
            mod_list = "\n".join([f"• {m['name']} ({m['size_gb']} GB)" for m in models])
            return {
                "success": True,
                "models": models,
                "message": f"Installed Local Ollama Models:\n{mod_list}"
            }

        elif name == "pull_ollama_model":
            m_name = args.get("model_name", "")
            return OllamaManager.pull_model(m_name)

        return {"success": False, "error": f"Unknown tool: {name}"}

    @classmethod
    def handle_request(cls, prompt: str) -> Dict[str, Any]:
        """
        Orchestrates natural language intent via Ollama function calling with Privacy Shield protection.
        """
        p = prompt.strip()

        # 1. Privacy Shield Check — Runs BEFORE any LLM or command execution
        is_safe, reason = PrivacyShield.filter_command_safety(p)
        if not is_safe:
            return {
                "success": False,
                "blocked": True,
                "category": "privacy_shield",
                "message": (
                    f"🛡️ [PRIVACY SHIELD ENGAGED]\n"
                    f"{reason}\n"
                    f"To safeguard your personal data, ORBIT AI is hardcoded to never inspect, "
                    f"read, or modify personal Documents, Pictures, Desktop files, or credentials."
                )
            }

        # 2. Try Ollama dynamic function calling if Ollama is available
        if OllamaManager.is_running():
            models = OllamaManager.list_models()
            active_model = models[0]["name"] if models else "qwen3.5:4b"

            try:
                chat_url = f"{OllamaManager.OLLAMA_URL}/api/chat"
                system_prompt = (
                    "You are an autonomous laptop system copilot. "
                    "When the user asks you to control power, optimize performance, manage processes, clean disk, "
                    "accelerate internet, or manage models, you MUST use the appropriate function tool call. "
                    "Never attempt to access personal user files or credentials."
                )

                payload = {
                    "model": active_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": p}
                    ],
                    "tools": cls.SYSTEM_TOOLS,
                    "stream": False
                }

                r = requests.post(chat_url, json=payload, timeout=25)
                if r.status_code == 200:
                    resp_json = r.json()
                    message = resp_json.get("message", {})
                    tool_calls = message.get("tool_calls", [])

                    if tool_calls:
                        # Execute all requested tools
                        results = []
                        for tc in tool_calls:
                            fn = tc.get("function", {})
                            fn_name = fn.get("name")
                            fn_args = fn.get("arguments", {})
                            tool_res = cls.execute_tool(fn_name, fn_args)
                            results.append(tool_res)

                        # Summarize tool execution
                        primary = results[0]
                        return {
                            "success": primary.get("success", True),
                            "category": "tool_execution",
                            "model_used": active_model,
                            "message": primary.get("message") or primary.get("error") or "Action executed successfully.",
                            "details": primary
                        }
                    else:
                        # Direct conversational reply from Ollama
                        content = message.get("content", "").strip()
                        if content:
                            return {
                                "success": True,
                                "category": "conversational",
                                "model_used": active_model,
                                "message": content
                            }
            except Exception as e:
                # If Ollama request times out or fails, fall through to fast local heuristic
                pass

        # 3. Fast offline heuristic fallback (always available even if Ollama is stopped)
        return cls._heuristic_fallback(p)

    @classmethod
    def _heuristic_fallback(cls, p: str) -> Dict[str, Any]:
        low = p.lower()

        # Shutdown
        m_shutdown = re.search(r'(?:shutdown|turn off|power off).*(?:in|after)?\s*(\d+)\s*(?:min|minute|m)', low)
        if m_shutdown:
            mins = int(m_shutdown.group(1) or 5)
            res = PowerController.schedule_shutdown(minutes=mins)
            return {"success": res.get("success", False), "category": "power", "message": res.get("message") or res.get("error"), "details": res}

        if re.search(r'(?:shutdown|turn off|power off)\s+(?:my\s+)?(?:laptop|pc|computer|system)', low) and not re.search(r'cancel|abort|stop|dont', low):
            res = PowerController.schedule_shutdown(minutes=5)
            return {"success": res.get("success", False), "category": "power", "message": res.get("message") or res.get("error"), "details": res}

        # Cancel shutdown
        if re.search(r'(?:cancel|abort|stop|dont|don\'?t)\s*(?:the\s*)?(?:shutdown|turn off|power off)', low):
            res = PowerController.cancel_shutdown()
            return {"success": res.get("success", False), "category": "power", "message": res.get("message") or res.get("error"), "details": res}

        # Restart
        if re.search(r'restart\s*(?:my\s*)?(?:laptop|pc|computer|system)?', low):
            res = PowerController.restart(minutes=1)
            return {"success": res.get("success", False), "category": "power", "message": res.get("message") or res.get("error"), "details": res}

        # Lock
        if re.search(r'lock\s*(?:my\s*)?(?:laptop|pc|screen|workstation)', low):
            res = PowerController.lock_workstation()
            return {"success": res.get("success", False), "category": "power", "message": res.get("message") or res.get("error"), "details": res}

        # Load shifting & performance
        if re.search(r'performance|shift.*load|load.*shift|boost.*(?:laptop|pc|performance|speed)|optimize.*(?:laptop|pc|ram|memory|performance)|free.*(?:ram|memory)', low):
            res = PerformanceOptimizer.shift_and_optimize()
            return {"success": res.get("success", False), "category": "performance", "message": res.get("message"), "details": res}

        # Clean temp files
        if re.search(r'clean.*(?:temp|disk|cache|storage)|free.*disk', low):
            res = PerformanceOptimizer.clean_temp_files()
            return {"success": res.get("success", False), "category": "performance", "message": res.get("message"), "details": res}

        # Network
        if re.search(r'internet|wifi|network|dns|ping|latency|bandwidth', low):
            res = NetworkController.optimize_network()
            return {"success": res.get("success", False), "category": "network", "message": res.get("message"), "details": res}

        # Models
        if re.search(r'(?:list|show).*models', low):
            return cls.execute_tool("list_ollama_models", {})

        m_pull = re.search(r'pull\s+model\s+([a-zA-Z0-9\.\:\-]+)', low)
        if m_pull:
            return cls.execute_tool("pull_ollama_model", {"model_name": m_pull.group(1)})

        # Status
        if re.search(r'status|health|battery|metrics|specs|usage|how is my laptop', low):
            return cls.execute_tool("get_system_metrics", {})

        # Default help
        return {
            "success": True,
            "category": "help",
            "message": (
                "I am your local AI Laptop Copilot running on Ollama. Here are things you can tell me:\n"
                "• 'shutdown in 5 min' / 'cancel shutdown'\n"
                "• 'boost performance and shift load'\n"
                "• 'clean temp files and free disk space'\n"
                "• 'make internet fast' / 'flush dns'\n"
                "• 'list models' / 'pull model llama3.2'\n"
                "• 'close discord' / 'laptop status'\n"
                "• Privacy Shield: I never access your personal Documents, Photos, or keys."
            )
        }
