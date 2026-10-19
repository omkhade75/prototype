#!/usr/bin/env python3
"""
ORBIT AI — Terminal Laptop Companion & System Controller
Autonomous local assistant for laptop power, workload shifting, internet acceleration,
and strict privacy enforcement.
"""

import sys
import os
import time

# Ensure ai-service package can be imported
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai-service"))

try:
    from app.system.controller import (
        PrivacyShield,
        PowerController,
        PerformanceOptimizer,
        NetworkController,
        SystemAssistant
    )
except ImportError as e:
    print(f"[ERROR] Could not import ORBIT AI system components: {e}")
    sys.exit(1)

# ANSI Colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

def print_banner():
    print(f"{CYAN}{BOLD}")
    print("  ================================================================")
    print("            ORBIT AI — AUTONOMOUS LAPTOP SYSTEM COPILOT           ")
    print("  ================================================================")
    print(f"{RESET}")
    print(f"  {GREEN}✓{RESET} {BOLD}Power & Shutdown Control:{RESET} 'shutdown in 5 min', 'cancel shutdown', 'lock'")
    print(f"  {GREEN}✓{RESET} {BOLD}Workload & Load Shifting:{RESET} 'boost performance', 'shift load', 'free ram'")
    print(f"  {GREEN}✓{RESET} {BOLD}Network Speed Optimizer: {RESET} 'make internet fast', 'flush dns', 'check ping'")
    print(f"  {GREEN}✓{RESET} {BOLD}Zero-Access Privacy Shield:{RESET} {CYAN}Active{RESET} (Personal files & keys blocked)")
    print(f"{DIM}  Type 'status', 'help', or 'exit' at any time.{RESET}")
    print(f"{CYAN}  ----------------------------------------------------------------{RESET}\n")

def display_live_status():
    metrics = PerformanceOptimizer.get_metrics()
    bat = metrics["battery"]
    bat_str = f"{bat['battery_percent']}% ({'AC Plugged' if bat['power_plugged'] else 'Battery'})" if bat['battery_percent'] else "N/A"
    
    print(f"  {BOLD}Laptop Snapshot:{RESET}")
    print(f"  • CPU: {metrics['cpu_percent']}% | RAM: {metrics['memory_percent']}% ({metrics['memory_available_gb']} GB free) | Battery: {bat_str}")
    print(f"  • Power Scheme: {bat['power_scheme']}")
    top_proc = ", ".join([f"{p['name']} ({p['memory_mb']}MB)" for p in metrics["top_memory_processes"][:3]])
    print(f"  • Top Processes: {DIM}{top_proc}{RESET}\n")

def run_command(prompt: str):
    if not prompt or not prompt.strip():
        return
    
    clean = prompt.strip().lower()
    if clean in ["exit", "quit", "q"]:
        print(f"\n{CYAN}ORBIT AI laptop companion closed. Goodbye!{RESET}")
        sys.exit(0)

    if clean in ["clear", "cls"]:
        os.system("cls" if os.name == "nt" else "clear")
        print_banner()
        return

    # Process prompt via SystemAssistant
    res = SystemAssistant.handle_request(prompt)

    if res.get("blocked"):
        print(f"\n{RED}{BOLD}{res['message']}{RESET}\n")
    elif res.get("category") == "power":
        print(f"\n{YELLOW}{BOLD}⚡ [POWER MANAGEMENT]{RESET}")
        print(f"  {res['message']}\n")
    elif res.get("category") == "performance":
        print(f"\n{GREEN}{BOLD}🚀 [PERFORMANCE OPTIMIZATION]{RESET}")
        print(f"  {res['message']}\n")
    elif res.get("category") == "network":
        print(f"\n{CYAN}{BOLD}🌐 [NETWORK OPTIMIZER]{RESET}")
        print(f"  {res['message']}\n")
    elif res.get("category") == "metrics":
        print(f"\n{res['message']}\n")
    else:
        print(f"\n{res['message']}\n")

def main():
    # If arguments provided directly via command line
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
        run_command(prompt)
        return

    # Interactive Loop
    print_banner()
    display_live_status()

    while True:
        try:
            prompt = input(f"{CYAN}{BOLD}orbit-laptop>{RESET} ")
            run_command(prompt)
        except (KeyboardInterrupt, EOFError):
            print(f"\n\n{CYAN}Session ended.{RESET}")
            break

if __name__ == "__main__":
    main()
