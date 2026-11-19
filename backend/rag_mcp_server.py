import os
import sys
import json
import time
from typing import Dict, Any, List, Optional
from mcp.server.mcpserver import MCPServer

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Node, Telemetry, Anomaly
from ml_engine import (
    predict_carbon_stock, detect_anomaly_and_trust, calculate_netzero_gap,
    load_models
)
from rag_engine import get_rag_engine

# Initialize official MCPServer
mcp_server = MCPServer("CarbonIQ-MRV-Intelligence-Server")

# ============================================================================
# MCP Formal Tool Definitions (JSON Schema Style)
# ============================================================================
MCP_TOOLS_SPEC = [
    {
        "name": "get_live_sensor_telemetry",
        "description": "Fetch real-time calibrated IoT and satellite proxy telemetry for a designated monitoring node (Sundarbans, Cox's Bazar, Rajshahi, Sylhet, Dhaka, or microalgae bioreactor).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "node_id": {
                    "type": "string",
                    "description": "Unique identifier of the node (e.g. 'NODE-BD-01' for Sundarbans, 'NODE-BD-02' for Cox's Bazar, 'NODE-BD-06' for Microalgae Photobioreactor)",
                    "default": "NODE-BD-01"
                }
            },
            "required": ["node_id"]
        }
    },
    {
        "name": "run_carbon_stock_inference",
        "description": "Execute trained XGBoost MRV inference on multivariate sensor telemetry and Sentinel-2 satellite indices to predict Soil Organic Carbon (SOC) and biomass stock (tCO2e/ha).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "node_type": {"type": "string", "enum": ["field", "chamber"], "default": "field"},
                "soil_moisture": {"type": "number", "description": "Soil moisture percentage (0-100)"},
                "salinity_ec": {"type": "number", "description": "Electrical conductivity dS/m"},
                "soil_temp": {"type": "number", "description": "Soil temperature in Celsius"},
                "ndvi_satellite": {"type": "number", "description": "Sentinel-2 Normalized Difference Vegetation Index (0.0-1.0)"},
                "ndwi_satellite": {"type": "number", "description": "Sentinel-2 Normalized Difference Water Index (-1.0 to 1.0)"},
                "biomass_proxy": {"type": "number", "description": "Aboveground biomass proxy g/m2"},
                "co2_ppm": {"type": "number", "description": "Chamber CO2 ppm (for chamber nodes)"},
                "turbidity_ntu": {"type": "number", "description": "Chamber turbidity NTU (for chamber nodes)"},
                "water_temp": {"type": "number", "description": "Chamber water temp (for chamber nodes)"}
            }
        }
    },
    {
        "name": "check_sensor_anomaly",
        "description": "Execute IsolationForest multivariate consistency check to detect sensor fraud, spoofed satellite indices, Tap-Water dilution, or physical correlation breakdowns. Outputs Trust Score (0-100).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "node_type": {"type": "string", "enum": ["field", "chamber"], "default": "field"},
                "soil_moisture": {"type": "number"},
                "salinity_ec": {"type": "number"},
                "soil_temp": {"type": "number"},
                "ndvi_satellite": {"type": "number"},
                "ndwi_satellite": {"type": "number"},
                "biomass_proxy": {"type": "number"},
                "co2_ppm": {"type": "number"}
            }
        }
    },
    {
        "name": "simulate_net_zero_gap",
        "description": "Calculate industrial/corporate net-zero transition pathway, required microalgae photobioreactors, blue-carbon mangrove acreage, annual removal milestones, and CapEx.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "monthly_emissions_tco2e": {
                    "type": "number",
                    "description": "Gross monthly corporate emissions in tCO2e",
                    "default": 500.0
                },
                "target_year": {
                    "type": "integer",
                    "description": "Commitment year for net-zero balance (e.g. 2030)",
                    "default": 2030
                },
                "blue_carbon_ratio": {
                    "type": "number",
                    "description": "Allocation fraction for blue carbon mangrove restoration vs photobioreactor units (0.1 - 0.9)",
                    "default": 0.65
                }
            },
            "required": ["monthly_emissions_tco2e"]
        }
    },
    {
        "name": "query_ipcc_guidelines",
        "description": "Query the indexed IPCC Tier 1/2/3 accounting guidelines, 2013 Wetlands Blue Carbon Supplement, Paris Agreement Article 6 mechanisms, and Bangladesh coastal ecosystem context.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Scientific or regulatory query string"
                },
                "top_k": {
                    "type": "integer",
                    "description": "Number of relevant authoritative passages to retrieve",
                    "default": 3
                }
            },
            "required": ["query"]
        }
    }
]


# ============================================================================
# Registered Tool Implementations
# ============================================================================

@mcp_server.tool()
def get_live_sensor_telemetry(node_id: str = "NODE-BD-01") -> Dict[str, Any]:
    """Fetch real-time calibrated IoT and satellite proxy telemetry for a node."""
    db = SessionLocal()
    try:
        node = db.query(Node).filter(Node.id == node_id).first()
        if not node:
            # Fallback to Sundarbans if invalid
            node = db.query(Node).first()
            if not node:
                return {"error": f"Node {node_id} not found."}

        latest = (
            db.query(Telemetry)
            .filter(Telemetry.node_id == node.id)
            .order_by(Telemetry.id.desc())
            .first()
        )

        anomalies_count = db.query(Anomaly).filter(Anomaly.node_id == node.id).count()

        if node.node_type == "field":
            telemetry_data = {
                "soil_moisture_pct": latest.soil_moisture if latest else 78.5,
                "salinity_ec_ds_m": latest.salinity_ec if latest else 18.2,
                "soil_temp_c": latest.soil_temp if latest else 27.8,
                "ndvi_satellite": latest.ndvi_satellite if latest else 0.778,
                "ndwi_satellite": latest.ndwi_satellite if latest else 0.435,
                "biomass_proxy_g_m2": latest.biomass_proxy if latest else 196.4
            }
        else:
            telemetry_data = {
                "co2_ppm": latest.co2_ppm if latest else 1780.0,
                "o2_percent": latest.o2_percent if latest else 21.2,
                "ch4_ppm": latest.ch4_ppm if latest else 1.85,
                "turbidity_ntu": latest.turbidity_ntu if latest else 188.0,
                "water_temp_c": latest.water_temp if latest else 25.2
            }

        return {
            "node_id": node.id,
            "node_name": node.name,
            "ecosystem": node.ecosystem,
            "node_type": node.node_type,
            "coordinates": {"latitude": node.latitude, "longitude": node.longitude},
            "area_ha": node.area_ha,
            "baseline_carbon_stock_tco2e_ha": node.baseline_tco2e,
            "current_carbon_stock_tco2e_ha": latest.carbon_stock if latest else node.baseline_tco2e,
            "trust_score": latest.trust_score if latest else 98.2,
            "verification_status": "VERIFIED" if (latest and latest.trust_score >= 95.0) else "SUSPICIOUS",
            "anomalies_recorded": anomalies_count,
            "timestamp": latest.timestamp if latest else node.created_at,
            "telemetry": telemetry_data
        }
    finally:
        db.close()


@mcp_server.tool()
def run_carbon_stock_inference(
    node_type: str = "field",
    soil_moisture: Optional[float] = 78.0,
    salinity_ec: Optional[float] = 18.0,
    soil_temp: Optional[float] = 28.0,
    ndvi_satellite: Optional[float] = 0.78,
    ndwi_satellite: Optional[float] = 0.42,
    biomass_proxy: Optional[float] = 195.0,
    co2_ppm: Optional[float] = 1800.0,
    turbidity_ntu: Optional[float] = 150.0,
    water_temp: Optional[float] = 26.0
) -> Dict[str, Any]:
    """Execute trained XGBoost MRV inference on multivariate sensor telemetry."""
    features = {
        "soil_moisture": soil_moisture,
        "salinity_ec": salinity_ec,
        "soil_temp": soil_temp,
        "ndvi_satellite": ndvi_satellite,
        "ndwi_satellite": ndwi_satellite,
        "biomass_proxy": biomass_proxy,
        "co2_ppm": co2_ppm,
        "turbidity_ntu": turbidity_ntu,
        "water_temp": water_temp
    }
    return predict_carbon_stock(features, node_type=node_type)


@mcp_server.tool()
def check_sensor_anomaly(
    node_type: str = "field",
    soil_moisture: Optional[float] = 78.0,
    salinity_ec: Optional[float] = 18.0,
    soil_temp: Optional[float] = 28.0,
    ndvi_satellite: Optional[float] = 0.78,
    ndwi_satellite: Optional[float] = 0.42,
    biomass_proxy: Optional[float] = 195.0,
    co2_ppm: Optional[float] = None
) -> Dict[str, Any]:
    """Execute IsolationForest multivariate consistency check to detect sensor fraud."""
    features = {
        "soil_moisture": soil_moisture,
        "salinity_ec": salinity_ec,
        "soil_temp": soil_temp,
        "ndvi_satellite": ndvi_satellite,
        "ndwi_satellite": ndwi_satellite,
        "biomass_proxy": biomass_proxy,
        "co2_ppm": co2_ppm
    }
    return detect_anomaly_and_trust(features, node_type=node_type)


@mcp_server.tool()
def simulate_net_zero_gap(
    monthly_emissions_tco2e: float = 500.0,
    target_year: int = 2030,
    blue_carbon_ratio: float = 0.65
) -> Dict[str, Any]:
    """Calculate industrial/corporate net-zero transition pathway."""
    return calculate_netzero_gap(
        monthly_emissions_tco2e=monthly_emissions_tco2e,
        target_year=target_year,
        blue_carbon_ratio=blue_carbon_ratio
    )


@mcp_server.tool()
def query_ipcc_guidelines(
    query: str,
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """Query the indexed IPCC Tier 1/2/3 accounting guidelines and Article 6 mechanisms."""
    rag = get_rag_engine()
    return rag.query(query, top_k=top_k)


# ============================================================================
# In-Process MCP Tool Dispatcher (Zero Network Overhead)
# ============================================================================
TOOL_DISPATCH = {
    "get_live_sensor_telemetry": get_live_sensor_telemetry,
    "run_carbon_stock_inference": run_carbon_stock_inference,
    "check_sensor_anomaly": check_sensor_anomaly,
    "simulate_net_zero_gap": simulate_net_zero_gap,
    "query_ipcc_guidelines": query_ipcc_guidelines
}


def execute_mcp_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes an MCP tool with telemetry timing and standardized error capture.
    """
    if name not in TOOL_DISPATCH:
        return {
            "status": "error",
            "tool": name,
            "error": f"Tool '{name}' is not registered on CarbonIQ MCP Server.",
            "available_tools": list(TOOL_DISPATCH.keys())
        }

    start_time = time.perf_counter()
    try:
        handler = TOOL_DISPATCH[name]
        result = handler(**arguments)
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        return {
            "status": "success",
            "tool": name,
            "arguments": arguments,
            "result": result,
            "latency_ms": duration_ms
        }
    except Exception as e:
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        return {
            "status": "error",
            "tool": name,
            "arguments": arguments,
            "error": str(e),
            "latency_ms": duration_ms
        }


if __name__ == "__main__":
    # If run standalone, start official MCPServer
    print("Starting CarbonIQ MRV MCP Server on stdio...")
    mcp_server.run()
