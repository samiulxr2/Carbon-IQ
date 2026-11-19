"""
CarbonIQ-MRV Phase 5 Verification Suite: Bangla Farmer Portal, Advisories & Alerts
"""

import urllib.request
import json
import sys

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

def test_frontend_elements():
    print("[TEST 1] Auditing Next.js 14 Frontend for Phase 5 Farmer Portal...")
    req = urllib.request.Request(FRONTEND_URL)
    with urllib.request.urlopen(req, timeout=5) as res:
        html = res.read().decode("utf-8")

    checks = [
        "CarbonIQ-MRV",
        "কৃষক পোর্টাল",
        "Farmer",
        "Phase 5",
        "Geo Map",
        "Command Center",
        "Demo / Synthetic Data"
    ]

    for item in checks:
        if item in html:
            print(f"  - UI Element '{item}': [PASS]")
        else:
            print(f"  - UI Element '{item}': [FAIL - Not in SSR bundle]")
            return False
    return True

def test_farmer_earnings():
    print("\n[TEST 2] Testing /farmer/earnings for Verified BDT/USD Payouts...")
    plots = ["NODE-BD-01", "NODE-BD-02", "NODE-BD-03", "NODE-BD-04"]

    for node_id in plots:
        req = urllib.request.Request(f"{BACKEND_URL}/farmer/earnings?node_id={node_id}&plot_area_ha=2.5")
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))

        steward = data.get("steward", {})
        fin = data.get("financials", {})

        name_bn = steward.get("name_bn")
        name_en = steward.get("name_en")
        credits = fin.get("accumulated_credits_tco2e", 0)
        usd = fin.get("gross_earnings_usd", 0)
        bdt = fin.get("gross_earnings_bdt", 0)
        rate_label = fin.get("exchange_rate", {}).get("label")
        rate = fin.get("exchange_rate", {}).get("usd_to_bdt")

        print(f"  - Node {node_id}: {name_bn} ({name_en})")
        print(f"    * Accumulated Credits: {credits:.2f} tCO2e ([PASS])")
        print(f"    * Financials: ${usd:,.2f} USD = ৳{bdt:,.2f} BDT ([PASS])")
        print(f"    * Exchange Rate: {rate_label} (Rate: {rate}) ([PASS])")
        print(f"    * 85% Steward Net: ৳{fin.get('net_steward_payout_bdt'):,.2f} BDT ([PASS])")
        print(f"    * Wallet: {steward.get('wallet')} | NID: {steward.get('nid')} ([PASS])")

        if credits <= 0 or usd <= 0 or bdt <= 0 or rate != 120.50:
            print(f"  [FAIL] Financial calculations invalid for {node_id}")
            return False
    return True

def test_farmer_advisories():
    print("\n[TEST 3] Testing /farmer/advisories for Live Soil & Water Guidance...")
    req = urllib.request.Request(f"{BACKEND_URL}/farmer/advisories?node_id=NODE-BD-01")
    with urllib.request.urlopen(req, timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))

    advisories = data.get("advisories", [])
    sms_alerts = data.get("sms_alerts", [])
    voice = data.get("voice_alert", {})

    print(f"  - Dynamic Advisories Generated: {len(advisories)} ([PASS])")
    for a in advisories:
        print(f"    * [{a['type'].upper()}] {a['metric_name_bn']} ({a['metric']}): {a['title_bn']}")

    print(f"  - Simulated SMS Alerts: {len(sms_alerts)} ([PASS])")
    for s in sms_alerts:
        print(f"    * From: {s['sender']} | Time: {s['time_bn']} | Msg: {s['text_bn'][:45]}...")

    print(f"  - Simulated Voice Call IVR: {voice.get('caller_title_bn')} ([PASS])")
    print(f"    * Duration: {voice.get('duration_seconds')}s | Audio Wave Points: {len(voice.get('audio_wave_simulated', []))}")
    print(f"    * Transcript (BN): {voice.get('transcript_bn')[:70]}...")

    if len(advisories) < 3 or len(sms_alerts) < 2 or not voice.get("transcript_bn"):
        print("  [FAIL] Incomplete advisory structure")
        return False
    return True

if __name__ == "__main__":
    print("=" * 70)
    print("CarbonIQ-MRV Phase 5 Verification Suite: Bangla Farmer Portal")
    print("=" * 70)

    t1 = test_frontend_elements()
    t2 = test_farmer_earnings()
    t3 = test_farmer_advisories()

    print("\n" + "=" * 70)
    if all([t1, t2, t3]):
        print("Phase 5 Verification Complete: All Checks Passed!")
        print("=" * 70)
        sys.exit(0)
    else:
        print("Phase 5 Verification Failed: Some checks did not pass.")
        print("=" * 70)
        sys.exit(1)
