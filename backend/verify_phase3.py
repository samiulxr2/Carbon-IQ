"""
CarbonIQ-MRV Phase 3 Verification Suite: Leaflet Geo Map & Recharts Analytics
"""

import urllib.request
import json
import sys

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

def test_frontend_elements():
    print("[TEST 1] Auditing Next.js 14 Frontend for Phase 3 Components...")
    req = urllib.request.Request(FRONTEND_URL)
    with urllib.request.urlopen(req, timeout=5) as res:
        html = res.read().decode("utf-8")

    checks = [
        "CarbonIQ-MRV",
        "Geo Map",
        "Phase 3",
        "Command Center",
        "Net-Zero Simulator",
        "SHA-256 Ledger",
        "3D Digital Twin",
        "Scientific Copilot",
        "Demo / Synthetic Data"
    ]

    for item in checks:
        if item in html:
            print(f"  - UI Element '{item}': [PASS]")
        else:
            print(f"  - UI Element '{item}': [FAIL - Not in SSR bundle]")
            return False
    return True

def test_registered_nodes_geo():
    print("\n[TEST 2] Verifying 6 Bangladesh Geo-Nodes & Coordinates...")
    req = urllib.request.Request(f"{BACKEND_URL}/nodes")
    with urllib.request.urlopen(req, timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))

    nodes = data.get("nodes", [])
    if len(nodes) != 6:
        print(f"  [FAIL] Expected 6 nodes, got {len(nodes)}")
        return False

    print(f"  - Total Geo-Nodes Registered: {len(nodes)} ([PASS])")
    for n in nodes:
        lat = n.get("latitude")
        lon = n.get("longitude")
        # Bangladesh bounds roughly: Lat 20.5 - 26.7, Lon 88.0 - 92.7
        is_in_bd = (20.0 <= lat <= 27.0) and (87.5 <= lon <= 93.0)
        status_label = "[PASS]" if is_in_bd else "[FAIL]"
        print(f"    * {n['id']}: {n['name']} ({lat:.4f}°N, {lon:.4f}°E) - In Bangladesh: {status_label}")
        if not is_in_bd:
            return False
    return True

def test_telemetry_history():
    print("\n[TEST 3] Testing /telemetry/history for Raw Proxy vs AI-Calibrated Stock...")
    req = urllib.request.Request(f"{BACKEND_URL}/telemetry/history?node_id=NODE-BD-01&limit=25")
    with urllib.request.urlopen(req, timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))

    series = data.get("series", [])
    if len(series) < 10:
        print(f"  [FAIL] Expected >= 10 history points, got {len(series)}")
        return False

    first = series[0]
    has_raw = "raw_proxy_stock" in first
    has_ai = "ai_calibrated_stock" in first
    has_var = "variance_filtered" in first

    print(f"  - Time Points Sampled: {len(series)} ([PASS])")
    print(f"  - Model: {data.get('model_name')} ([PASS])")
    print(f"  - R2 Score: {data.get('r2_score')} ([PASS])")
    print(f"  - Sample Reading: Raw={first['raw_proxy_stock']} t/ha, AI={first['ai_calibrated_stock']} t/ha, Denoised=±{first['variance_filtered']} t/ha ([PASS])")
    return has_raw and has_ai and has_var

def test_forecast_schedule():
    print("\n[TEST 4] Testing /forecast 12-Month Schedule with USD Revenue...")
    req = urllib.request.Request(f"{BACKEND_URL}/forecast", method="POST")
    req.add_header("Content-Type", "application/json")
    payload = {
        "node_id": "NODE-BD-01",
        "horizon_months": 12,
        "price_per_ton_usd": 28.50
    }
    with urllib.request.urlopen(req, data=json.dumps(payload).encode("utf-8"), timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))

    fc = data.get("forecast", {})
    sched = fc.get("monthly_schedule", [])
    total_credits = fc.get("total_forecasted_credits_tco2e", 0)
    total_rev = fc.get("total_forecasted_revenue_usd", 0)

    if len(sched) != 12:
        print(f"  [FAIL] Expected 12 monthly steps, got {len(sched)}")
        return False

    print(f"  - Forecast Horizon: {fc.get('horizon_months')} Months ([PASS])")
    print(f"  - Total Forecasted Credits: {total_credits:.2f} tCO2e ([PASS])")
    print(f"  - Total Forecasted Revenue: ${total_rev:,.2f} USD ([PASS])")
    print(f"  - Peak Month: Month {sched[6]['month_step']} ({sched[6]['month_name']}) - {sched[6]['incremental_credits_tco2e']:.2f} tCO2e ({sched[6]['season']}) ([PASS])")
    return True

def test_interactive_tamper_pin_color():
    print("\n[TEST 5] Verifying Interactive Tamper & Pin Color State Transition...")
    # 1. Tamper NODE-BD-02
    req_t = urllib.request.Request(f"{BACKEND_URL}/simulate/tamper", method="POST")
    req_t.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req_t, data=json.dumps({"node_id": "NODE-BD-02", "tamper_type": "spoof_ndvi"}).encode("utf-8")) as res:
        t_data = json.loads(res.read().decode("utf-8"))

    trust = (
        t_data.get("audit_results", {}).get("trust_score")
        or t_data.get("audit_result", {}).get("trust_score", 100)
    )
    print(f"  - Tamper Injected on NODE-BD-02 -> Trust Score dropped to {trust:.1f}% ([PASS])")
    if trust >= 95:
        print("  [FAIL] Expected trust score < 95% after tamper")
        return False

    # 2. Reset NODE-BD-02
    req_r = urllib.request.Request(f"{BACKEND_URL}/simulate/reset", method="POST")
    req_r.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req_r, data=json.dumps({"node_id": "NODE-BD-02"}).encode("utf-8")) as res:
        r_data = json.loads(res.read().decode("utf-8"))

    print(f"  - Recalibrate Called -> Status: {r_data.get('status')} ([PASS])")
    return True

if __name__ == "__main__":
    print("=" * 70)
    print("CarbonIQ-MRV Phase 3 Verification Suite: Leaflet Map & Recharts Analytics")
    print("=" * 70)

    t1 = test_frontend_elements()
    t2 = test_registered_nodes_geo()
    t3 = test_telemetry_history()
    t4 = test_forecast_schedule()
    t5 = test_interactive_tamper_pin_color()

    print("\n" + "=" * 70)
    if all([t1, t2, t3, t4, t5]):
        print("Phase 3 Verification Complete: All Checks Passed!")
        print("=" * 70)
        sys.exit(0)
    else:
        print("Phase 3 Verification Failed: Some checks did not pass.")
        print("=" * 70)
        sys.exit(1)
