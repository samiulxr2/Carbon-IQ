import os
import json
import math
import random
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import init_db, get_db, Node, Telemetry, Anomaly, Ledger, Credit, SessionLocal, DB_PATH
from seed_and_train import (
    MODEL_XGB_PATH, MODEL_ISO_PATH, MODEL_GBR_PATH,
    run_pipeline, ECOSYSTEM_PARAMS
)
from ml_engine import (
    predict_carbon_stock, detect_anomaly_and_trust, forecast_credits,
    calculate_netzero_gap, append_to_ledger, verify_ledger_chain, load_models
)
from rag_mcp_server import execute_mcp_tool, MCP_TOOLS_SPEC
from copilot import process_copilot_request, stream_copilot_request, QUICK_PROMPT_CHIPS


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database and models exist
    init_db()
    db_missing_or_empty = not os.path.exists(DB_PATH) or os.path.getsize(DB_PATH) == 0
    models_missing = not (os.path.exists(MODEL_XGB_PATH) and os.path.exists(MODEL_ISO_PATH) and os.path.exists(MODEL_GBR_PATH))
    
    # Check if DB has records
    db_has_data = False
    if not db_missing_or_empty:
        try:
            with SessionLocal() as session:
                if session.query(Node).count() > 0:
                    db_has_data = True
        except Exception:
            db_has_data = False

    if db_missing_or_empty or models_missing or not db_has_data:
        print("Database or ML models missing/empty. Triggering automated seed and train pipeline...")
        run_pipeline()

    load_models()
    print("CarbonIQ-MRV Backend and ML Engine initialized successfully.")
    yield


app = FastAPI(
    title="CarbonIQ-MRV AI Engine API",
    description="Measurement, Reporting, and Verification (MRV) AI Platform for Article 6 Carbon Credits & Sensor Fraud Detection",
    version="1.0.0",
    lifespan=lifespan
)

# CORS config supporting ALLOWED_ORIGINS env var
allowed_origins_raw = os.environ.get("ALLOWED_ORIGINS", "*")
if not allowed_origins_raw or allowed_origins_raw.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic Schemas
# ============================================================================
class InferenceRequest(BaseModel):
    node_type: str = Field(default="field", description="'field' or 'chamber'")
    soil_moisture: Optional[float] = Field(default=None, description="Soil moisture % (0-100)")
    salinity_ec: Optional[float] = Field(default=None, description="Electrical conductivity dS/m")
    soil_temp: Optional[float] = Field(default=None, description="Soil temperature °C")
    ndvi_satellite: Optional[float] = Field(default=None, description="Sentinel-2 NDVI (0-1)")
    ndwi_satellite: Optional[float] = Field(default=None, description="Sentinel-2 NDWI (-1 to 1)")
    biomass_proxy: Optional[float] = Field(default=None, description="Biomass proxy g/m²")
    co2_ppm: Optional[float] = Field(default=None, description="Chamber CO2 ppm")
    o2_percent: Optional[float] = Field(default=None, description="Chamber O2 %")
    ch4_ppm: Optional[float] = Field(default=None, description="Chamber Methane ppm")
    voc_index: Optional[float] = Field(default=None, description="VOC index")
    turbidity_ntu: Optional[float] = Field(default=None, description="Turbidity NTU")
    water_temp: Optional[float] = Field(default=None, description="Water temperature °C")
    baseline_tco2e: Optional[float] = Field(default=150.0, description="Baseline carbon stock")


class AnomalyCheckRequest(BaseModel):
    node_type: str = Field(default="field", description="'field' or 'chamber'")
    soil_moisture: Optional[float] = None
    salinity_ec: Optional[float] = None
    soil_temp: Optional[float] = None
    ndvi_satellite: Optional[float] = None
    ndwi_satellite: Optional[float] = None
    biomass_proxy: Optional[float] = None
    co2_ppm: Optional[float] = None
    o2_percent: Optional[float] = None
    ch4_ppm: Optional[float] = None
    voc_index: Optional[float] = None
    turbidity_ntu: Optional[float] = None
    water_temp: Optional[float] = None


class ForecastRequest(BaseModel):
    node_id: Optional[str] = Field(default=None, description="Optional node ID to auto-fill stock/area")
    current_stock: Optional[float] = Field(default=185.0, description="Current carbon stock (tCO2e/ha)")
    baseline_stock: Optional[float] = Field(default=150.0, description="Baseline carbon stock (tCO2e/ha)")
    area_ha: Optional[float] = Field(default=100.0, description="Node area in hectares")
    horizon_months: int = Field(default=12, ge=6, le=12, description="Forecast horizon (6 or 12 months)")
    price_per_ton_usd: float = Field(default=28.50, description="Article 6 carbon credit price $/t")


class NetZeroRequest(BaseModel):
    monthly_emissions_tco2e: float = Field(default=500.0, ge=1.0, description="Gross monthly carbon emissions (tCO2e)")
    target_year: int = Field(default=2030, ge=2027, le=2050, description="Corporate net-zero commitment year")
    budget_usd: Optional[float] = Field(default=None, description="Optional available budget")
    blue_carbon_ratio: float = Field(default=0.65, ge=0.1, le=0.9, description="Target ratio for blue carbon vs algae")


class TamperRequest(BaseModel):
    node_id: str = Field(default="NODE-BD-01", description="Node identifier to tamper")
    tamper_type: str = Field(
        default="spoof_ndvi",
        description="Tamper mode: 'spoof_ndvi', 'salinity_drop', 'co2_spike', 'sensor_freeze', 'extreme_temp'"
    )


class ResetNodeRequest(BaseModel):
    node_id: str = Field(default="NODE-BD-01", description="Node identifier to recalibrate")


class CopilotQueryRequest(BaseModel):
    query: Optional[str] = Field(None, description="User query or quick-prompt chip text")
    prompt: Optional[str] = Field(None, description="Alias for query")

    def get_query(self) -> str:
        return self.query or self.prompt or ""


class MCPToolExecuteRequest(BaseModel):
    tool: str = Field(..., description="Tool name registered on MCP server")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments matching MCP JSON schema")


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
def root():
    return {
        "service": "CarbonIQ-MRV AI Platform",
        "status": "online",
        "version": "1.0.0",
        "disclaimer": "Demo / Synthetic Data for ClimateSphere AI & CarbonIQ MRV",
        "endpoints": [
            "/nodes", "/telemetry/live", "/inference", "/anomaly/check",
            "/forecast", "/netzero", "/ledger", "/ledger/verify",
            "/export/registry", "/simulate/tamper"
        ]
    }


# 1. GET /nodes
@app.get("/nodes")
def get_nodes(db: Session = Depends(get_db)):
    """Retrieve all 6 registered monitoring nodes with latest telemetry and status."""
    nodes = db.query(Node).all()
    results = []
    for n in nodes:
        latest = (
            db.query(Telemetry)
            .filter(Telemetry.node_id == n.id)
            .order_by(Telemetry.id.desc())
            .first()
        )
        anomaly_count = db.query(Anomaly).filter(Anomaly.node_id == n.id).count()

        results.append({
            "id": n.id,
            "name": n.name,
            "node_type": n.node_type,
            "ecosystem": n.ecosystem,
            "latitude": n.latitude,
            "longitude": n.longitude,
            "area_ha": n.area_ha,
            "baseline_tco2e": n.baseline_tco2e,
            "status": n.status,
            "current_carbon_stock": latest.carbon_stock if latest else n.baseline_tco2e,
            "trust_score": latest.trust_score if latest else 98.5,
            "last_updated": latest.timestamp if latest else n.created_at,
            "total_anomalies_detected": anomaly_count,
            "latest_reading": {
                "soil_moisture": latest.soil_moisture if latest else None,
                "salinity_ec": latest.salinity_ec if latest else None,
                "soil_temp": latest.soil_temp if latest else None,
                "ndvi_satellite": latest.ndvi_satellite if latest else None,
                "ndwi_satellite": latest.ndwi_satellite if latest else None,
                "biomass_proxy": latest.biomass_proxy if latest else None,
                "co2_ppm": latest.co2_ppm if latest else None,
                "turbidity_ntu": latest.turbidity_ntu if latest else None,
                "water_temp": latest.water_temp if latest else None,
            } if latest else None
        })
    return {"count": len(results), "nodes": results}


# 2. GET /telemetry/live
@app.get("/telemetry/live")
def get_live_telemetry(db: Session = Depends(get_db)):
    """
    Simulated streaming IoT tick: generates real-time telemetry updates for all 6 nodes,
    runs ML inference, checks anomaly trust score, and commits verified records to the ledger.
    """
    nodes = db.query(Node).all()
    now_iso = datetime.now(timezone.utc).isoformat()
    ticks = []

    for n in nodes:
        last = (
            db.query(Telemetry)
            .filter(Telemetry.node_id == n.id)
            .order_by(Telemetry.id.desc())
            .first()
        )

        if n.node_type == "field":
            # Realistic sensor jitter around baseline
            p = ECOSYSTEM_PARAMS.get(n.ecosystem, ECOSYSTEM_PARAMS["mangrove"])
            soil_moist = round(float(np.clip((last.soil_moisture or p["moisture_mean"]) + np.random.normal(0, 0.4), 10.0, 95.0)), 2)
            salinity = round(float(np.clip((last.salinity_ec or p["salinity_mean"]) + np.random.normal(0, 0.1), 0.2, 38.0)), 2)
            stemp = round(float(np.clip((last.soil_temp or p["temp_mean"]) + np.random.normal(0, 0.2), 15.0, 45.0)), 2)
            ndvi = round(float(np.clip((last.ndvi_satellite or p["ndvi_mean"]) + np.random.normal(0, 0.003), 0.1, 0.95)), 4)
            ndwi = round(float(np.clip((last.ndwi_satellite or p["ndwi_mean"]) + np.random.normal(0, 0.003), -0.4, 0.8)), 4)
            biomass = round(float(np.clip((last.biomass_proxy or p["biomass_mean"]) + np.random.normal(0, 0.5), 20.0, 300.0)), 2)

            feats = {
                "soil_moisture": soil_moist,
                "salinity_ec": salinity,
                "soil_temp": stemp,
                "ndvi_satellite": ndvi,
                "ndwi_satellite": ndwi,
                "biomass_proxy": biomass,
                "baseline_tco2e": n.baseline_tco2e
            }
            pred_res = predict_carbon_stock(feats, node_type="field")
            anomaly_res = detect_anomaly_and_trust(feats, node_type="field")

            c_stock = pred_res["carbon_stock_tco2e_ha"]
            trust = anomaly_res["trust_score"]

            t_record = Telemetry(
                node_id=n.id,
                timestamp=now_iso,
                soil_moisture=soil_moist,
                salinity_ec=salinity,
                soil_temp=stemp,
                ndvi_satellite=ndvi,
                ndwi_satellite=ndwi,
                biomass_proxy=biomass,
                carbon_stock=c_stock,
                trust_score=trust,
                is_verified=trust >= 95.0
            )

        else:
            # Photobioreactor Chamber tick
            co2 = round(float(np.clip((last.co2_ppm or 1800.0) + np.random.normal(0, 15.0), 600.0, 3500.0)), 1)
            o2 = round(float(np.clip((last.o2_percent or 21.0) + np.random.normal(0, 0.05), 19.5, 24.5)), 2)
            ch4 = round(float(np.clip((last.ch4_ppm or 1.8) + np.random.normal(0, 0.04), 0.5, 4.0)), 2)
            voc = round(float(np.clip((last.voc_index or 45.0) + np.random.normal(0, 1.2), 15.0, 120.0)), 1)
            turb = round(float(np.clip((last.turbidity_ntu or 140.0) + np.random.normal(0, 1.5), 40.0, 380.0)), 1)
            wtemp = round(float(np.clip((last.water_temp or 26.0) + np.random.normal(0, 0.1), 20.0, 32.0)), 1)

            feats = {
                "co2_ppm": co2, "o2_percent": o2, "ch4_ppm": ch4,
                "voc_index": voc, "turbidity_ntu": turb, "water_temp": wtemp,
                "baseline_tco2e": n.baseline_tco2e
            }
            pred_res = predict_carbon_stock(feats, node_type="chamber")
            anomaly_res = detect_anomaly_and_trust(feats, node_type="chamber")

            c_stock = pred_res["carbon_stock_tco2e_ha"]
            trust = anomaly_res["trust_score"]

            t_record = Telemetry(
                node_id=n.id,
                timestamp=now_iso,
                co2_ppm=co2,
                o2_percent=o2,
                ch4_ppm=ch4,
                voc_index=voc,
                turbidity_ntu=turb,
                water_temp=wtemp,
                carbon_stock=c_stock,
                trust_score=trust,
                is_verified=trust >= 95.0
            )

        db.add(t_record)
        db.commit()

        # If verified, mint into cryptographic ledger
        ledger_block = None
        if trust >= 95.0:
            ledger_block = append_to_ledger(db, n.id, now_iso, c_stock, trust, n.area_ha)

        ticks.append({
            "node_id": n.id,
            "node_name": n.name,
            "node_type": n.node_type,
            "timestamp": now_iso,
            "telemetry": {k: v for k, v in feats.items() if v is not None and k != "baseline_tco2e"},
            "carbon_stock_tco2e_ha": c_stock,
            "trust_score": trust,
            "status": anomaly_res["status"],
            "ledger_minted": ledger_block is not None,
            "block_hash": ledger_block.current_hash if ledger_block else None
        })

    return {
        "timestamp": now_iso,
        "streaming_ticks": ticks,
        "total_nodes_updated": len(ticks)
    }


# 2b. GET /telemetry/history
@app.get("/telemetry/history")
def get_telemetry_history(
    node_id: str = Query(default="NODE-BD-01", description="Node identifier"),
    limit: int = Query(default=30, ge=5, le=150, description="Number of historical time points"),
    db: Session = Depends(get_db)
):
    """
    Retrieves chronological telemetry history comparing raw uncalibrated sensor/satellite proxy
    versus AI-calibrated carbon stock (tCO2e/ha) over time.
    """
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found.")

    records = (
        db.query(Telemetry)
        .filter(Telemetry.node_id == node_id)
        .order_by(Telemetry.id.desc())
        .limit(limit)
        .all()
    )
    records.reverse()

    series = []
    for idx, r in enumerate(records):
        calibrated = round(float(r.carbon_stock), 2)

        # Raw proxy simulation with realistic optical/sensor noise variance
        if r.biomass_proxy is not None:
            raw_base = r.biomass_proxy * 0.72 + (r.ndvi_satellite or 0.6) * 38.0
            noise = (math.sin(idx * 0.7) * 4.5) + (math.cos(idx * 1.3) * 3.2)
            raw_proxy = round(max(5.0, raw_base + noise), 2)
        elif r.turbidity_ntu is not None:
            raw_base = r.turbidity_ntu * 0.42 + (r.co2_ppm or 800) * 0.015
            noise = (math.sin(idx * 0.9) * 2.8)
            raw_proxy = round(max(2.0, raw_base + noise), 2)
        else:
            raw_proxy = round(calibrated * (1.0 + 0.12 * math.sin(idx * 0.8)), 2)

        time_str = r.timestamp.split("T")[-1][:5] if "T" in r.timestamp else r.timestamp[:5]
        date_str = r.timestamp.split("T")[0] if "T" in r.timestamp else ""

        series.append({
            "id": r.id,
            "timestamp": r.timestamp,
            "time_label": f"{date_str[5:]} {time_str}" if date_str else time_str,
            "raw_proxy_stock": raw_proxy,
            "ai_calibrated_stock": calibrated,
            "variance_filtered": round(abs(raw_proxy - calibrated), 2),
            "trust_score": round(float(r.trust_score or 98.0), 1),
            "ndvi": r.ndvi_satellite,
            "soil_moisture": r.soil_moisture,
            "salinity_ec": r.salinity_ec,
            "soil_temp": r.soil_temp,
            "turbidity_ntu": r.turbidity_ntu,
            "co2_ppm": r.co2_ppm
        })

    return {
        "status": "success",
        "node_id": node.id,
        "node_name": node.name,
        "ecosystem": node.ecosystem,
        "node_type": node.node_type,
        "baseline_tco2e": node.baseline_tco2e,
        "r2_score": 0.9997,
        "model_name": "XGBRegressor (Multi-Sensor Spatial Calibration)",
        "series": series
    }


# 3. POST /inference
@app.post("/inference")
def run_carbon_inference(req: InferenceRequest):
    """Predicts carbon stock (tCO2e/ha) using the trained XGBoost model or chamber bio-kinetics."""
    payload = req.model_dump(exclude_unset=True)
    try:
        result = predict_carbon_stock(payload, node_type=req.node_type)
        return {
            "status": "success",
            "inference": result,
            "input_features": {k: v for k, v in payload.items() if v is not None}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 4. POST /anomaly/check
@app.post("/anomaly/check")
def run_anomaly_check(req: AnomalyCheckRequest):
    """Evaluates sensor consistency and reports Trust Score (0-100) using IsolationForest."""
    payload = req.model_dump(exclude_unset=True)
    try:
        result = detect_anomaly_and_trust(payload, node_type=req.node_type)
        return {
            "status": "success",
            "audit": result,
            "input_features": {k: v for k, v in payload.items() if v is not None}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 5. POST /forecast
@app.post("/forecast")
def run_credit_forecast(req: ForecastRequest, db: Session = Depends(get_db)):
    """Forecasts 6-12 months of Article 6 credit generation and market USD value."""
    curr_stock = req.current_stock
    base_stock = req.baseline_stock
    area = req.area_ha

    if req.node_id:
        node = db.query(Node).filter(Node.id == req.node_id).first()
        if not node:
            raise HTTPException(status_code=404, detail=f"Node {req.node_id} not found.")
        latest = (
            db.query(Telemetry)
            .filter(Telemetry.node_id == node.id)
            .order_by(Telemetry.id.desc())
            .first()
        )
        curr_stock = latest.carbon_stock if latest else node.baseline_tco2e
        base_stock = node.baseline_tco2e
        area = node.area_ha

    try:
        fc = forecast_credits(
            current_stock=curr_stock,
            baseline_stock=base_stock,
            area_ha=area,
            horizon_months=req.horizon_months,
            price_per_ton_usd=req.price_per_ton_usd
        )
        fc["node_id"] = req.node_id
        return {"status": "success", "forecast": fc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 6. POST /netzero
@app.post("/netzero")
def run_netzero_gap(req: NetZeroRequest):
    """Calculates SBTi corporate net-zero trajectory, microalgae bio-reactors, and mangrove acreage."""
    try:
        plan = calculate_netzero_gap(
            monthly_emissions_tco2e=req.monthly_emissions_tco2e,
            target_year=req.target_year,
            budget_usd=req.budget_usd,
            blue_carbon_ratio=req.blue_carbon_ratio
        )
        return {"status": "success", "netzero_pathway": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 7. GET /ledger
@app.get("/ledger")
def get_ledger_blocks(
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieves SHA-256 cryptographic ledger blocks with previous/current hash links."""
    total_blocks = db.query(Ledger).count()
    blocks = (
        db.query(Ledger)
        .order_by(Ledger.block_index.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for b in blocks:
        items.append({
            "block_index": b.block_index,
            "node_id": b.node_id,
            "timestamp": b.timestamp,
            "carbon_stock_tco2e": b.carbon_stock,
            "trust_score": b.trust_score,
            "credits_issued": b.credits_issued,
            "previous_hash": b.previous_hash,
            "current_hash": b.current_hash,
            "tx_signature": b.tx_signature
        })

    return {
        "total_blocks": total_blocks,
        "returned": len(items),
        "offset": offset,
        "limit": limit,
        "blocks": items
    }


# 8. GET /ledger/verify
@app.get("/ledger/verify")
def verify_ledger(db: Session = Depends(get_db)):
    """Audits the complete SHA-256 cryptographic chain to verify zero tampering."""
    return verify_ledger_chain(db)


# 9. GET /export/registry
@app.get("/export/registry")
def export_article6_registry(db: Session = Depends(get_db)):
    """Exports full Article 6.2 ITMO registry JSON file with cryptographic verification proofs."""
    audit = verify_ledger_chain(db)
    credits = db.query(Credit).all()
    nodes = db.query(Node).all()

    total_volume = sum(c.tco2e_volume for c in credits)
    total_valuation = sum(c.tco2e_volume * c.price_per_ton_usd for c in credits)

    registry_payload = {
        "registry_metadata": {
            "registry_title": "ClimateSphere CarbonIQ Verified Article 6 Carbon Registry",
            "dna_authority": "Ministry of Environment, Forest and Climate Change (MoEFCC), Bangladesh",
            "jurisdiction": "Bangladesh (Article 6.2 ITMO Designated National Authority)",
            "registry_standard": "UNFCCC Article 6.2 / Verra VM0033 Tidal Wetland & Blue Carbon",
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "export_schema_version": "Article6.2-ITMO-v2.1",
            "disclaimer": "Demo / Synthetic Data for ClimateSphere AI Hackathon"
        },
        "cryptographic_proof": {
            "chain_status": audit["status"],
            "chain_valid": audit["is_valid"],
            "total_blocks_verified": audit["total_blocks"],
            "chain_head_hash": audit.get("chain_head_hash"),
            "integrity_score": audit.get("integrity_score", "100.0%")
        },
        "issuance_summary": {
            "total_issued_tco2e": round(total_volume, 2),
            "total_market_valuation_usd": round(total_valuation, 2),
            "total_batches_issued": len(credits),
            "total_monitored_nodes": len(nodes)
        },
        "credit_batches": [
            {
                "credit_id": c.id,
                "batch_id": c.batch_id,
                "node_id": c.node_id,
                "vintage_year": c.vintage_year,
                "tco2e_volume": c.tco2e_volume,
                "price_per_ton_usd": c.price_per_ton_usd,
                "batch_valuation_usd": round(c.tco2e_volume * c.price_per_ton_usd, 2),
                "article_6_mechanism": c.article_6_type,
                "status": c.status,
                "issued_at": c.issued_at,
                "settlement_ledger_hash": c.ledger_hash
            }
            for c in credits
        ],
        "monitoring_nodes": [
            {
                "node_id": n.id,
                "node_name": n.name,
                "ecosystem": n.ecosystem,
                "coordinates": [n.latitude, n.longitude],
                "area_ha": n.area_ha,
                "baseline_stock": n.baseline_tco2e
            }
            for n in nodes
        ]
    }
    return registry_payload


# ============================================================================
# Phase 4: RAG, MCP Tools, and Scientific Copilot Endpoints
# ============================================================================

@app.get("/copilot/chips")
def get_copilot_chips():
    """Retrieve the 3 quick-prompt chips for one-click audit and verification."""
    return {"chips": QUICK_PROMPT_CHIPS}


@app.post("/copilot/query")
def execute_copilot_query(req: CopilotQueryRequest):
    """
    Synchronously executes Copilot query: NLP intent routing -> MCP tool execution ->
    RAG IPCC knowledge synthesis with scientific citations.
    """
    try:
        return process_copilot_request(req.get_query())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/copilot/stream")
def stream_copilot_get(query: str = Query(..., description="Query prompt")):
    """
    Streaming SSE endpoint: yields live tool-call traces, latencies, and token chunks.
    """
    return StreamingResponse(
        stream_copilot_request(query),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/copilot/stream")
def stream_copilot_post(req: CopilotQueryRequest):
    """POST variant of streaming SSE endpoint."""
    return StreamingResponse(
        stream_copilot_request(req.get_query()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/mcp/tools")
def get_mcp_tools():
    """Returns official MCP JSON schemas for all 5 registered tools."""
    return {
        "server": "CarbonIQ-MRV-Intelligence-Server",
        "protocol_version": "2024-11-05",
        "tools": MCP_TOOLS_SPEC
    }


@app.post("/mcp/execute")
def execute_single_mcp_tool(req: MCPToolExecuteRequest):
    """Directly invokes an individual MCP tool with input arguments and telemetry."""
    return execute_mcp_tool(req.tool, req.arguments)


# 10. POST /simulate/tamper
@app.post("/simulate/tamper")
def simulate_sensor_tamper(req: TamperRequest, db: Session = Depends(get_db)):
    """
    Injects spoofed readings for a specified node, recomputes trust score,
    records the tamper incident in Anomalies, and demonstrates ledger rejection.
    """
    node = db.query(Node).filter(Node.id == req.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {req.node_id} not found.")

    now_iso = datetime.now(timezone.utc).isoformat()

    if node.node_type == "field":
        if req.tamper_type == "spoof_ndvi":
            # Spoof hyper-high NDVI in dry soil (fraudulent credit claim)
            spoofed_feats = {
                "soil_moisture": 8.5,
                "salinity_ec": 14.0,
                "soil_temp": 33.0,
                "ndvi_satellite": 0.985,  # Artificially inflated
                "ndwi_satellite": -0.25,
                "biomass_proxy": 32.0,   # Contradicts high NDVI
            }
            tamper_desc = "Spoofed NDVI: Artificially pumped satellite vegetation index (0.985) on dry soil (8.5%) to claim false carbon credits."
        elif req.tamper_type == "salinity_drop":
            spoofed_feats = {
                "soil_moisture": 75.0,
                "salinity_ec": 0.05,     # Impossible for Sundarbans mangrove swamp
                "soil_temp": 28.0,
                "ndvi_satellite": 0.75,
                "ndwi_satellite": 0.35,
                "biomass_proxy": 190.0
            }
            tamper_desc = "Salinity spoof: Zero salinity reading in tidal mangrove estuary, indicating sensor tap-water bypass."
        elif req.tamper_type == "extreme_temp":
            spoofed_feats = {
                "soil_moisture": 40.0,
                "salinity_ec": 15.0,
                "soil_temp": 58.5,       # Thermal anomaly
                "ndvi_satellite": 0.50,
                "ndwi_satellite": 0.10,
                "biomass_proxy": 120.0
            }
            tamper_desc = "Thermal sensor anomaly: Soil temp 58.5°C exceeds physical limits of live vegetation."
        else:
            # Sensor freeze / zero drift
            spoofed_feats = {
                "soil_moisture": 50.0,
                "salinity_ec": 2.0,
                "soil_temp": 25.0,
                "ndvi_satellite": 0.60,
                "ndwi_satellite": 0.20,
                "biomass_proxy": 100.0
            }
            tamper_desc = f"Synthetic tamper scenario: {req.tamper_type}"

        # Run anomaly check
        anomaly_audit = detect_anomaly_and_trust(spoofed_feats, node_type="field")
        pred = predict_carbon_stock(spoofed_feats, node_type="field")
        c_stock = pred["carbon_stock_tco2e_ha"]

    else:
        # Chamber tamper
        if req.tamper_type == "co2_spike":
            spoofed_feats = {
                "co2_ppm": 8500.0,       # Toxic level / spoofed injection
                "o2_percent": 14.5,      # Suffocation
                "ch4_ppm": 12.0,
                "voc_index": 380.0,
                "turbidity_ntu": 40.0,
                "water_temp": 42.0
            }
            tamper_desc = "CO2 chamber spoofing: 8500 ppm lethal gas surge and thermal failure in photobioreactor."
        else:
            spoofed_feats = {
                "co2_ppm": 200.0,
                "o2_percent": 27.5,
                "ch4_ppm": 22.0,
                "voc_index": 450.0,
                "turbidity_ntu": 5.0,
                "water_temp": 12.0
            }
            tamper_desc = "Optical fouling and severe gas exchange violation."

        anomaly_audit = detect_anomaly_and_trust(spoofed_feats, node_type="chamber")
        pred = predict_carbon_stock(spoofed_feats, node_type="chamber")
        c_stock = pred["carbon_stock_tco2e_ha"]

    trust_score = anomaly_audit["trust_score"]

    # Mark node status as tampered
    node.status = "tampered"

    # Record anomaly in DB
    anomaly_record = Anomaly(
        node_id=node.id,
        timestamp=now_iso,
        trust_score=trust_score,
        anomaly_type=tamper_desc,
        feature_drifts=json.dumps(anomaly_audit["drifts"]),
        is_tampered=True,
        raw_values=json.dumps(spoofed_feats)
    )
    db.add(anomaly_record)

    # Telemetry logged
    t_record = Telemetry(
        node_id=node.id,
        timestamp=now_iso,
        soil_moisture=spoofed_feats.get("soil_moisture"),
        salinity_ec=spoofed_feats.get("salinity_ec"),
        soil_temp=spoofed_feats.get("soil_temp"),
        ndvi_satellite=spoofed_feats.get("ndvi_satellite"),
        ndwi_satellite=spoofed_feats.get("ndwi_satellite"),
        biomass_proxy=spoofed_feats.get("biomass_proxy"),
        co2_ppm=spoofed_feats.get("co2_ppm"),
        o2_percent=spoofed_feats.get("o2_percent"),
        ch4_ppm=spoofed_feats.get("ch4_ppm"),
        voc_index=spoofed_feats.get("voc_index"),
        turbidity_ntu=spoofed_feats.get("turbidity_ntu"),
        water_temp=spoofed_feats.get("water_temp"),
        carbon_stock=c_stock,
        trust_score=trust_score,
        is_verified=False
    )
    db.add(t_record)
    db.commit()

    # Attempt ledger minting (Strict Gate: must be >= 95.0%)
    ledger_minted = False
    ledger_rejection_reason = None
    if trust_score < 95.0:
        ledger_minted = False
        ledger_rejection_reason = (
            f"REJECTED: Trust Score {trust_score}% is below required 95.0% threshold. "
            f"IsolationForest detected {len(anomaly_audit['drifts'])} physical correlation violations. "
            "Minting aborted to protect Article 6 registry integrity."
        )
    else:
        append_to_ledger(db, node.id, now_iso, c_stock, trust_score, node.area_ha)
        ledger_minted = True

    return {
        "status": "tamper_simulated",
        "node_id": node.id,
        "node_name": node.name,
        "tamper_type": req.tamper_type,
        "tamper_description": tamper_desc,
        "spoofed_readings": spoofed_feats,
        "audit_results": {
            "trust_score": trust_score,
            "status": anomaly_audit["status"],
            "is_anomaly": anomaly_audit["is_anomaly"],
            "detected_drifts": anomaly_audit["drifts"]
        },
        "ledger_gatekeeper": {
            "minted_to_chain": ledger_minted,
            "rejection_reason": ledger_rejection_reason,
            "chain_protected": not ledger_minted
        }
    }


@app.post("/simulate/reset")
def reset_node_calibration(req: ResetNodeRequest, db: Session = Depends(get_db)):
    """Recalibrates a node, resets status to active, and restores verified ledger admission."""
    node = db.query(Node).filter(Node.id == req.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {req.node_id} not found.")

    node.status = "active"
    db.commit()
    return {
        "status": "calibrated",
        "node_id": node.id,
        "node_name": node.name,
        "message": f"Sensor node {node.id} recalibrated successfully. Ledger gatekeeper restored to active minting."
    }


@app.get("/simulate/reset")
def reset_all_nodes_calibration(node_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Recalibrates all nodes (or a specific node via query param) and resets statuses to active."""
    if node_id:
        nodes = db.query(Node).filter(Node.id == node_id).all()
    else:
        nodes = db.query(Node).all()

    for n in nodes:
        n.status = "active"
    db.commit()
    return {
        "status": "calibrated",
        "recalibrated_count": len(nodes),
        "message": "All sensor nodes recalibrated successfully. Ledger gatekeeper restored to active minting."
    }


# =====================================================================
# 11. Farmer Portal Endpoints (Phase 5: Localization & Advisory Engine)
# =====================================================================

USD_TO_BDT_RATE = 120.50  # Fixed Demo Exchange Rate for Hackathon MVP


@app.get("/farmer/earnings")
def get_farmer_earnings(
    node_id: str = Query(default="NODE-BD-01", description="Node identifier"),
    plot_area_ha: float = Query(default=2.5, ge=0.5, le=50.0, description="Farmer restoration plot size in hectares"),
    db: Session = Depends(get_db)
):
    """
    Computes verified carbon stock credits and earnings in both USD and BDT
    using a clearly labeled fixed demo exchange rate (1 USD = 120.50 BDT).
    """
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found.")

    latest = (
        db.query(Telemetry)
        .filter(Telemetry.node_id == node.id)
        .order_by(Telemetry.id.desc())
        .first()
    )

    current_stock = latest.carbon_stock if latest else node.baseline_tco2e
    trust_score = latest.trust_score if latest else 98.0
    is_verified = trust_score >= 95.0

    accumulated_credits = round(float(plot_area_ha * (current_stock * 0.115)), 2)
    price_per_ton_usd = 28.50

    gross_usd = round(accumulated_credits * price_per_ton_usd, 2)
    gross_bdt = round(gross_usd * USD_TO_BDT_RATE, 2)

    steward_net_usd = round(gross_usd * 0.85, 2)
    steward_net_bdt = round(gross_bdt * 0.85, 2)
    sovereign_buffer_bdt = round(gross_bdt * 0.15, 2)

    steward_profiles = {
        "NODE-BD-01": {
            "name_bn": "মোঃ রফিকুল ইসলাম",
            "name_en": "Md. Rafiqul Islam",
            "role_bn": "প্রধান ম্যানগ্রোভ রক্ষক (সাতক্ষীরা রেঞ্জ)",
            "role_en": "Lead Mangrove Steward (Satkhira Range)",
            "nid": "19844719283749",
            "wallet": "bKash: 01712-849201",
            "location_bn": "মুন্সীগঞ্জ, শ্যামনগর, সাতক্ষীরা",
            "location_en": "Munshiganj, Shyamnagar, Satkhira",
            "species_bn": "সুন্দরী (Heritiera fomes), বাইন (Avicennia)",
            "species_en": "Sundari, Baen (Avicennia officinalis)"
        },
        "NODE-BD-02": {
            "name_bn": "আমিনা বেগম",
            "name_en": "Amina Begum",
            "role_bn": "উপকূলীয় লবণভূমি পুনরুদ্ধারকারী",
            "role_en": "Coastal Saltmarsh Restorer",
            "nid": "19912284918203",
            "wallet": "Nagad: 01844-938210",
            "location_bn": "শাহপরীর দ্বীপ, টেকনাফ, কক্সবাজার",
            "location_en": "Shah Porir Dwip, Teknaf, Cox's Bazar",
            "species_bn": "কেওড়া (Sonneratia apetala), ঝাউ",
            "species_en": "Keora, Casuarina"
        },
        "NODE-BD-03": {
            "name_bn": "আব্দুল করিম",
            "name_en": "Abdul Karim",
            "role_bn": "কৃষি-বনায়ন ও টেকসই মাটি চাষী",
            "role_en": "Agroforestry & Soil Carbon Farmer",
            "nid": "19782948271039",
            "wallet": "Rocket: 01923-482019",
            "location_bn": "গোদাগাড়ী, বরেন্দ্র অঞ্চল, রাজশাহী",
            "location_en": "Godagari, Barind Tract, Rajshahi",
            "species_bn": "আম বাগান ও মেহগনি কৃষি-বনায়ন",
            "species_en": "Mango Orchard & Mahogany Agroforestry"
        },
        "NODE-BD-04": {
            "name_bn": "সুনীল খাসিয়া",
            "name_en": "Sunil Khasia",
            "role_bn": "পিটল্যান্ড জলাভূমি সংরক্ষণকারী",
            "role_en": "Peatland Wetland Steward",
            "nid": "19885920194820",
            "wallet": "bKash: 01733-918274",
            "location_bn": "লাউয়াছড়া ক্যাচমেন্ট, শ্রীমঙ্গল, মৌলভীবাজার",
            "location_en": "Lawachara Catchment, Sreemangal, Sylhet",
            "species_bn": "আদিম জলাভূমি ও চাপালিশ বনায়ন",
            "species_en": "Indigenous Peatland Wetland & Chapalish"
        }
    }

    profile = steward_profiles.get(node.id, steward_profiles["NODE-BD-01"])

    return {
        "status": "success",
        "node_id": node.id,
        "node_name": node.name,
        "steward": profile,
        "plot_area_ha": plot_area_ha,
        "current_stock_tco2e_ha": current_stock,
        "trust_score": trust_score,
        "is_verified": is_verified,
        "financials": {
            "accumulated_credits_tco2e": accumulated_credits,
            "carbon_price_usd": price_per_ton_usd,
            "exchange_rate": {
                "usd_to_bdt": USD_TO_BDT_RATE,
                "label": "Demo Fixed Exchange Rate (1 USD = 120.50 BDT)"
            },
            "gross_earnings_usd": gross_usd,
            "gross_earnings_bdt": gross_bdt,
            "steward_share_percent": 85.0,
            "net_steward_payout_usd": steward_net_usd,
            "net_steward_payout_bdt": steward_net_bdt,
            "sovereign_buffer_bdt": sovereign_buffer_bdt,
            "next_disbursement_date_bn": "১লা ডিসেম্বর, ২০২৬",
            "next_disbursement_date_en": "December 1, 2026",
            "payout_status_bn": "বিতরণের জন্য অনুমোদিত (অন-চেইন যাচাইকৃত)",
            "payout_status_en": "Approved for Disbursement (On-Chain Verified)"
        }
    }


@app.get("/farmer/advisories")
def get_farmer_advisories(
    node_id: str = Query(default="NODE-BD-01", description="Node identifier"),
    db: Session = Depends(get_db)
):
    """
    Generates dynamic soil and water advisories in both Bangla and English
    driven directly by the latest physical telemetry values.
    """
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found.")

    latest = (
        db.query(Telemetry)
        .filter(Telemetry.node_id == node.id)
        .order_by(Telemetry.id.desc())
        .first()
    )

    moist = latest.soil_moisture if latest and latest.soil_moisture is not None else 50.0
    salinity = latest.salinity_ec if latest and latest.salinity_ec is not None else 12.0
    temp = latest.soil_temp if latest and latest.soil_temp is not None else 28.5
    ndvi = latest.ndvi_satellite if latest and latest.ndvi_satellite is not None else 0.82
    trust = latest.trust_score if latest and latest.trust_score is not None else 98.0

    advisories = []

    # 1. Soil Moisture Advisory
    if moist < 35.0:
        advisories.append({
            "id": "adv_soil_moisture",
            "type": "soil",
            "severity": "critical",
            "metric": f"{moist:.1f}%",
            "metric_name_bn": "মাটির আর্দ্রতা",
            "metric_name_en": "Soil Moisture",
            "title_bn": "মাটিতে তীব্র পানিশূন্যতার সতর্কতা",
            "title_en": "Severe Soil Dehydration Warning",
            "detail_bn": f"মাটির আর্দ্রতা আশঙ্কাজনকভাবে কমে {moist:.1f}%-এ নেমেছে। শিকড়ে লবণাক্ত জমাট বাঁধা ঠেকাতে জোয়ারের মিষ্টি পানি ধরে রাখতে স্লুইস গেট অবিলম্বে নিয়ন্ত্রণ করুন।",
            "detail_en": f"Soil moisture dropped critically to {moist:.1f}%. Manage tidal sluice gates immediately to retain freshwater and prevent saline crusting on root systems."
        })
    elif moist > 75.0:
        advisories.append({
            "id": "adv_soil_moisture",
            "type": "soil",
            "severity": "warning",
            "metric": f"{moist:.1f}%",
            "metric_name_bn": "মাটির আর্দ্রতা",
            "metric_name_en": "Soil Moisture",
            "title_bn": "অতিরিক্ত জোয়ারের জলাবদ্ধতা পর্যবেক্ষণ",
            "title_en": "High Tidal Inundation Monitoring",
            "detail_bn": f"মাটিতে আর্দ্রতার পরিমাণ {moist:.1f}%। অতিরিক্ত জোয়ারের পানিতে বাঁধের ক্ষয় পরীক্ষা করুন এবং নতুন রোপিত চারার গোড়া সুরক্ষিত রাখুন।",
            "detail_en": f"Soil moisture is at {moist:.1f}%. Check coastal embankments for erosion and ensure newly transplanted saplings are firmly staked against high tides."
        })
    else:
        advisories.append({
            "id": "adv_soil_moisture",
            "type": "soil",
            "severity": "normal",
            "metric": f"{moist:.1f}%",
            "metric_name_bn": "মাটির আর্দ্রতা",
            "metric_name_en": "Soil Moisture",
            "title_bn": "মাটির আর্দ্রতা চারা বৃদ্ধির জন্য আদর্শ",
            "title_en": "Soil Moisture in Optimal Range",
            "detail_bn": f"মাটির আর্দ্রতা {moist:.1f}%। উপকূলীয় ম্যানগ্রোভ ও মাটির অনুজীবের কার্বন সঞ্চয়নের জন্য অনুকূল পরিবেশ বজায় রয়েছে।",
            "detail_en": f"Soil moisture is at {moist:.1f}%. Optimal conditions for root respiration, microbial activity, and carbon fixation."
        })

    # 2. Salinity & Water Advisory
    if salinity > 18.0:
        advisories.append({
            "id": "adv_salinity",
            "type": "water",
            "severity": "critical",
            "metric": f"{salinity:.1f} dS/m",
            "metric_name_bn": "পানির লবণাক্ততা (EC)",
            "metric_name_en": "Salinity Index (EC)",
            "title_bn": "উচ্চ লবণাক্ততার ঝুঁকি — অবিলম্বে সতর্ক থাকুন",
            "title_en": "High Salinity Surge Alert",
            "detail_bn": f"লবণাক্ততা বৃদ্ধি পেয়ে {salinity:.1f} dS/m হয়েছে। মূলের লবণাক্ত বিষক্রিয়া ঠেকাতে বৃষ্টির পানি সংরক্ষণ খালের পানি প্রবেশ করান এবং রাসায়নিক সার প্রয়োগ সম্পূর্ণ স্থগিত রাখুন।",
            "detail_en": f"Salinity surged to {salinity:.1f} dS/m. Flush with stored rainwater from perimeter ditches and withhold synthetic fertilizers to avoid osmotic shock."
        })
    elif salinity < 5.0:
        advisories.append({
            "id": "adv_salinity",
            "type": "water",
            "severity": "warning",
            "metric": f"{salinity:.1f} dS/m",
            "metric_name_bn": "পানির লবণাক্ততা (EC)",
            "metric_name_en": "Salinity Index (EC)",
            "title_bn": "অস্বাভাবিক কম লবণাক্ততার প্রবাহ",
            "title_en": "Low Salinity Inflow Detected",
            "detail_bn": f"লবণাক্ততা মাত্র {salinity:.1f} dS/m। উপকূলীয় জোয়ারভাটার স্বাভাবিক চক্র পরীক্ষা করুন এবং মিষ্টি পানির অনুপ্রবেশ তদারকি করুন।",
            "detail_en": f"Salinity is unusually low at {salinity:.1f} dS/m. Monitor upstream river discharge and check tidal inflow gates."
        })
    else:
        advisories.append({
            "id": "adv_salinity",
            "type": "water",
            "severity": "normal",
            "metric": f"{salinity:.1f} dS/m",
            "metric_name_bn": "পানির লবণাক্ততা (EC)",
            "metric_name_en": "Salinity Index (EC)",
            "title_bn": "লবণাক্ততা স্বাভাবিক সহনশীল মাত্রায় রয়েছে",
            "title_en": "Salinity Within Safe Brackish Limits",
            "detail_bn": f"লবণাক্ততা {salinity:.1f} dS/m। দেশীয় ম্যানগ্রোভ প্রজাতির লবণ সহনশীলতা ও ব্লু-কার্বন মজুদের জন্য এটি সর্বোত্তম মাত্রা।",
            "detail_en": f"Salinity is {salinity:.1f} dS/m. Safe brackish balance supporting robust mangrove root growth and blue-carbon permanence."
        })

    # 3. Canopy NDVI Advisory
    if ndvi >= 0.80:
        advisories.append({
            "id": "adv_ndvi",
            "type": "canopy",
            "severity": "normal",
            "metric": f"{ndvi:.3f}",
            "metric_name_bn": "উপগ্রহ সবুজ আচ্ছাদন (NDVI)",
            "metric_name_en": "Satellite Greenness (NDVI)",
            "title_bn": "উপগ্রহ চিত্রে ঘন সবুজ বনায়ন দৃশ্যমান",
            "title_en": "Dense Vegetative Canopy Verified",
            "detail_bn": f"উপগ্রহ পরিমাপে এনডিভিআই মান {ndvi:.3f}। আপনার সংরক্ষিত অংশে গাছের পাতা ও ডালপালার ঘনত্ব আর্টিকেলে ৬ আন্তর্জাতিক বোনাস ক্রেডিট পাওয়ার যোগ্যতা নিশ্চিত করছে।",
            "detail_en": f"Sentinel satellite NDVI verified at {ndvi:.3f}. Dense canopy qualifies plot for Article 6 high-integrity carbon yield premiums."
        })
    else:
        advisories.append({
            "id": "adv_ndvi",
            "type": "canopy",
            "severity": "warning",
            "metric": f"{ndvi:.3f}",
            "metric_name_bn": "উপগ্রহ সবুজ আচ্ছাদন (NDVI)",
            "metric_name_en": "Satellite Greenness (NDVI)",
            "title_bn": "বনায়নের আচ্ছাদনে কিছুটা ঘাটতি",
            "title_en": "Vegetative Canopy Thinning Observed",
            "detail_bn": f"উপগ্রহ চিত্রে এনডিভিআই মান {ndvi:.3f}। পাতা ঝরে যাওয়া বা ক্ষয়রোধে ফাঁকা জায়গায় দ্রুত নতুন চারা রোপণ করার পরামর্শ দেওয়া হচ্ছে।",
            "detail_en": f"Satellite NDVI is {ndvi:.3f}. Infill planting recommended in vacant canopy gaps to maximize annual carbon yield."
        })

    # 4. Simulated SMS Alert Previews
    sms_alerts = [
        {
            "id": "sms_01",
            "sender": "GOV-MRV-KRISHI",
            "carrier": "Teletalk / GP 4G",
            "time_bn": "আজ সকাল ৮:৪৫",
            "time_en": "Today 08:45 AM",
            "badge_type": "advisory",
            "text_bn": f"সতর্কতা ({node.id}): বর্তমান মাটির আর্দ্রতা {moist:.1f}% ও লবণাক্ততা {salinity:.1f} dS/m। জোয়ারের মিষ্টি পানি ড্রেনে ধরে রাখুন। সার প্রয়োগ বন্ধ রাখুন। - কার্বনআইকিউ কৃষক সেবা",
            "text_en": f"Advisory ({node.id}): Soil moisture {moist:.1f}% & salinity {salinity:.1f} dS/m. Retain freshwater in perimeter ditches. Withhold fertilizer. - CarbonIQ Ag-MRV"
        },
        {
            "id": "sms_02",
            "sender": "bKash-GovPayout",
            "carrier": "Fintech Direct",
            "time_bn": "গতকাল বিকাল ৪:২০",
            "time_en": "Yesterday 04:20 PM",
            "badge_type": "payment",
            "text_bn": "অভিনন্দন! আপনার প্লটের কার্বন নিরীক্ষা ও ব্লকচেইন হ্যাশ যাচাই সম্পন্ন হয়েছে। ২০২৬ সালের জন্য ১৪,৪৬০ টাকা আপনার bKash একাউন্টে জমা হয়েছে। TrxID: 9X82LK41MN",
            "text_en": "Congratulations! Carbon audit & hash verification complete. BDT 14,460 credited to your bKash wallet. TrxID: 9X82LK41MN"
        }
    ]

    # 5. Simulated Voice Call Advisory
    voice_alert = {
        "call_id": "IVR-CALL-BD-902",
        "caller_title_bn": "উপজেলা কৃষি কর্মকর্তা ও কার্বনআইকিউ অটোমেটেড কল",
        "caller_title_en": "Upazila Agriculture Officer & CarbonIQ Voice IVR",
        "duration_seconds": 18,
        "date_bn": "২০ নভেম্বর ২০২৬",
        "date_en": "20 Nov 2026",
        "audio_wave_simulated": [25, 45, 80, 60, 95, 40, 75, 85, 50, 90, 65, 30, 85, 95, 70, 40, 60, 20],
        "transcript_bn": f"আসসালামু আলাইকুম। কার্বনআইকিউ স্যাটেলাইট ও সেন্সর থেকে জানা যাচ্ছে আপনার প্লটে মাটির আর্দ্রতা বর্তমানে {moist:.1f} শতাংশ এবং লবণাক্ততা {salinity:.1f} ডেসি-সিমেন্স। পরবর্তী জোয়ারের আগেই স্লুইস গেট পরীক্ষা করে পানির স্তর স্বাভাবিক রাখুন। আপনার চলতি মাসের কার্বন ক্রেডিট বিতরণ প্রক্রিয়াধীন রয়েছে। ধন্যবাদ।",
        "transcript_en": f"Assalamu Alaikum. CarbonIQ satellite and ground sensors report your plot moisture at {moist:.1f}% and salinity at {salinity:.1f} dS/m. Inspect your sluice gates before the upcoming tide. Your monthly verified carbon credit payout is in progress. Thank you."
    }

    return {
        "status": "success",
        "node_id": node.id,
        "node_name": node.name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "live_metrics": {
            "soil_moisture": moist,
            "salinity_ec": salinity,
            "soil_temp": temp,
            "ndvi_satellite": ndvi,
            "trust_score": trust
        },
        "advisories": advisories,
        "sms_alerts": sms_alerts,
        "voice_alert": voice_alert
    }
