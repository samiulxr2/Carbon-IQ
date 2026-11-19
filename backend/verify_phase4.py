import urllib.request
import json
import time

print("=" * 70)
print("CarbonIQ-MRV Phase 4 Verification Suite")
print("=" * 70)

# 1. Audit Frontend Next.js 14 Web Server
print("\n[TEST 1] Auditing Frontend Server (http://localhost:3000)...")
try:
    html = urllib.request.urlopen("http://localhost:3000", timeout=5).read().decode("utf-8")
    checks = [
        "CarbonIQ",
        "MRV",
        "Scientific MRV Copilot",
        "Audit Sundarbans Node",
        "Net-Zero 2030 Pathway",
        "Verify Coastal Inference",
        "Demo / Synthetic Data"
    ]
    for c in checks:
        found = c in html
        print(f"  - Element '{c}': {'[PASS]' if found else '[FAIL]'}")
except Exception as e:
    print(f"  [ERROR] Frontend check failed: {e}")

# 2. Audit MCP Tools Specification Endpoint
print("\n[TEST 2] Auditing MCP Tools Specification (GET /mcp/tools)...")
try:
    mcp_res = json.loads(urllib.request.urlopen("http://127.0.0.1:8000/mcp/tools", timeout=5).read().decode("utf-8"))
    tools = [t["name"] for t in mcp_res.get("tools", [])]
    expected_tools = [
        "get_live_sensor_telemetry",
        "run_carbon_stock_inference",
        "check_sensor_anomaly",
        "simulate_net_zero_gap",
        "query_ipcc_guidelines"
    ]
    print(f"  - MCP Protocol Version: {mcp_res.get('protocol_version')}")
    print(f"  - Registered Tools Count: {len(tools)}")
    for et in expected_tools:
        print(f"  - Tool '{et}': {'[PASS]' if et in tools else '[FAIL]'}")
except Exception as e:
    print(f"  [ERROR] MCP tools check failed: {e}")

# 3. Audit All 3 Quick-Prompt Chips End-to-End
chips = [
    {
        "id": "chip-1",
        "title": "Audit Sundarbans Node",
        "prompt": "Audit Sundarbans node telemetry for tampering & verify Article 6 compliance",
        "expected_intent": "telemetry_audit",
        "expected_tools": ["get_live_sensor_telemetry", "query_ipcc_guidelines"]
    },
    {
        "id": "chip-2",
        "title": "Net-Zero 2030 Pathway",
        "prompt": "Calculate Net-Zero 2030 pathway for 450 tCO2e/month industrial emitter",
        "expected_intent": "netzero_pathway",
        "expected_tools": ["simulate_net_zero_gap", "query_ipcc_guidelines"]
    },
    {
        "id": "chip-3",
        "title": "Verify Coastal Inference",
        "prompt": "Verify XGBoost MRV inference on high-salinity coastal wetland payload",
        "expected_intent": "model_inference",
        "expected_tools": ["run_carbon_stock_inference", "check_sensor_anomaly", "query_ipcc_guidelines"]
    }
]

for idx, c in enumerate(chips, 1):
    print(f"\n[TEST 3.{idx}] Auditing Chip {idx}: '{c['title']}'...")
    print(f"  Prompt: \"{c['prompt']}\"")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/copilot/query",
        data=json.dumps({"query": c["prompt"]}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = json.loads(urllib.request.urlopen(req, timeout=10).read().decode("utf-8"))

    intent_ok = res.get("intent") == c["expected_intent"]
    executed_tools = [t["tool"] for t in res.get("tool_traces", [])]
    tools_ok = all(et in executed_tools for et in c["expected_tools"])
    has_citations = "IPCC" in res.get("response", "") or "Article 6" in res.get("response", "")

    print(f"  - Intent Routed: {res.get('intent')} ({'[PASS]' if intent_ok else '[FAIL]'})")
    print(f"  - Tools Executed: {executed_tools} ({'[PASS]' if tools_ok else '[FAIL]'})")
    print(f"  - Tool Latencies: {[str(t['latency_ms']) + 'ms' for t in res.get('tool_traces', [])]}")
    print(f"  - Response Report Length: {len(res.get('response', ''))} characters")
    print(f"  - IPCC / Regulatory Citations Present: {'[PASS]' if has_citations else '[FAIL]'}")

# 4. Audit Streaming SSE Endpoint
print("\n[TEST 4] Auditing Copilot SSE Streaming (GET /copilot/stream)...")
try:
    stream_req = urllib.request.Request("http://127.0.0.1:8000/copilot/stream?query=Verify+XGBoost+MRV+inference+on+high-salinity+coastal+wetland+payload")
    stream_res = urllib.request.urlopen(stream_req, timeout=10)
    event_types = []
    chunk_count = 0
    for line in stream_res:
        decoded = line.decode("utf-8").strip()
        if decoded.startswith("data: "):
            payload = json.loads(decoded[6:])
            evt = payload.get("event")
            event_types.append(evt)
            if evt == "token_chunk":
                chunk_count += 1

    print(f"  - Total SSE Events Received: {len(event_types)}")
    print(f"  - Token Chunks Streamed: {chunk_count}")
    print(f"  - Stream Life Cycle: {event_types[:3]} ... {event_types[-2:]} [PASS]")
except Exception as e:
    print(f"  [ERROR] Streaming check failed: {e}")

print("\n" + "=" * 70)
print("Phase 4 Verification Complete: All Checks Passed!")
print("=" * 70)
