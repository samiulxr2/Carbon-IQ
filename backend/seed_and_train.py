import os
import json
import hashlib
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.ensemble import IsolationForest, GradientBoostingRegressor
import xgboost as xgb

from database import init_db, SessionLocal, Node, Telemetry, Anomaly, Ledger, Credit

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_XGB_PATH = os.path.join(MODELS_DIR, "carbon_stock_xgb.pkl")
MODEL_ISO_PATH = os.path.join(MODELS_DIR, "anomaly_isolation_forest.pkl")
MODEL_GBR_PATH = os.path.join(MODELS_DIR, "credit_forecast_gbr.pkl")
METRICS_PATH = os.path.join(MODELS_DIR, "model_metrics.json")

NODES_SEED = [
    {
        "id": "NODE-BD-01",
        "name": "Sundarbans Mangrove Wetland",
        "node_type": "field",
        "ecosystem": "mangrove",
        "latitude": 21.9497,
        "longitude": 89.1833,
        "area_ha": 125.0,
        "baseline_tco2e": 185.0,
        "status": "active",
    },
    {
        "id": "NODE-BD-02",
        "name": "Cox's Bazar Coastal Wetland",
        "node_type": "field",
        "ecosystem": "coastal_wetland",
        "latitude": 21.4272,
        "longitude": 91.9702,
        "area_ha": 85.0,
        "baseline_tco2e": 140.0,
        "status": "active",
    },
    {
        "id": "NODE-BD-03",
        "name": "Rajshahi Agroforestry Pilot",
        "node_type": "field",
        "ecosystem": "agricultural_soil",
        "latitude": 24.3745,
        "longitude": 88.6042,
        "area_ha": 210.0,
        "baseline_tco2e": 42.0,
        "status": "active",
    },
    {
        "id": "NODE-BD-04",
        "name": "Sylhet Tea & Peat Basin",
        "node_type": "field",
        "ecosystem": "wetland_tea",
        "latitude": 24.8949,
        "longitude": 91.8687,
        "area_ha": 160.0,
        "baseline_tco2e": 110.0,
        "status": "active",
    },
    {
        "id": "NODE-BD-05",
        "name": "Dhaka Urban Bio-Park",
        "node_type": "field",
        "ecosystem": "urban_park",
        "latitude": 23.8103,
        "longitude": 90.4125,
        "area_ha": 35.0,
        "baseline_tco2e": 65.0,
        "status": "active",
    },
    {
        "id": "NODE-BD-06",
        "name": "Dhaka Microalgae Bio-Reactor Chamber",
        "node_type": "chamber",
        "ecosystem": "algae_photobioreactor",
        "latitude": 23.7771,
        "longitude": 90.3994,
        "area_ha": 5.0,
        "baseline_tco2e": 310.0,
        "status": "active",
    },
]

ECOSYSTEM_PARAMS = {
    "mangrove": {
        "moisture_mean": 78.0, "moisture_std": 6.0,
        "salinity_mean": 18.5, "salinity_std": 3.0,
        "temp_mean": 28.0, "temp_std": 3.5,
        "ndvi_mean": 0.78, "ndvi_std": 0.04,
        "ndwi_mean": 0.42, "ndwi_std": 0.05,
        "biomass_mean": 195.0, "biomass_std": 15.0,
        "target_coef": 1.15
    },
    "coastal_wetland": {
        "moisture_mean": 68.0, "moisture_std": 7.0,
        "salinity_mean": 22.0, "salinity_std": 4.0,
        "temp_mean": 29.0, "temp_std": 3.0,
        "ndvi_mean": 0.65, "ndvi_std": 0.05,
        "ndwi_mean": 0.32, "ndwi_std": 0.06,
        "biomass_mean": 155.0, "biomass_std": 18.0,
        "target_coef": 1.05
    },
    "agricultural_soil": {
        "moisture_mean": 32.0, "moisture_std": 5.0,
        "salinity_mean": 1.5, "salinity_std": 0.4,
        "temp_mean": 31.0, "temp_std": 4.5,
        "ndvi_mean": 0.48, "ndvi_std": 0.06,
        "ndwi_mean": -0.05, "ndwi_std": 0.04,
        "biomass_mean": 65.0, "biomass_std": 10.0,
        "target_coef": 0.90
    },
    "wetland_tea": {
        "moisture_mean": 62.0, "moisture_std": 6.5,
        "salinity_mean": 1.8, "salinity_std": 0.5,
        "temp_mean": 26.0, "temp_std": 3.2,
        "ndvi_mean": 0.72, "ndvi_std": 0.04,
        "ndwi_mean": 0.22, "ndwi_std": 0.05,
        "biomass_mean": 135.0, "biomass_std": 14.0,
        "target_coef": 1.02
    },
    "urban_park": {
        "moisture_mean": 45.0, "moisture_std": 6.0,
        "salinity_mean": 2.2, "salinity_std": 0.6,
        "temp_mean": 32.0, "temp_std": 4.0,
        "ndvi_mean": 0.54, "ndvi_std": 0.05,
        "ndwi_mean": 0.08, "ndwi_std": 0.04,
        "biomass_mean": 85.0, "biomass_std": 12.0,
        "target_coef": 0.95
    },
}


def calculate_field_carbon_stock(row, baseline):
    """
    True physical derivation of Soil Organic Carbon & biomass carbon stock (tCO2e/ha)
    Combines Aboveground Biomass (proxy + NDVI), Hydrologic saturation (NDWI, moisture),
    and soil conditions (temp, salinity) with realistic natural variance.
    """
    ndvi = row["ndvi_satellite"]
    ndwi = row["ndwi_satellite"]
    moisture = row["soil_moisture"]
    salinity = row["salinity_ec"]
    temp = row["soil_temp"]
    biomass = row["biomass_proxy"]

    # Base carbon pool + vegetation contribution + hydrological retention - decomposition loss
    stock = (
        baseline * 0.42
        + 82.0 * ndvi
        + 34.0 * ndwi
        + 0.32 * moisture
        + 0.28 * biomass
        - 0.18 * temp
        - 0.22 * salinity
    )
    # Add small natural measurement noise
    noise = np.random.normal(0, 0.8)
    return max(10.0, round(float(stock + noise), 3))


def calculate_chamber_carbon_stock(row, baseline):
    """
    Calculates carbon sequestered by microalgal photobioreactor chamber.
    CO2 differential uptake + optical density (turbidity biomass) + oxygen evolution.
    """
    co2 = row["co2_ppm"]
    o2 = row["o2_percent"]
    turbidity = row["turbidity_ntu"]
    wtemp = row["water_temp"]

    # Algal growth kinetics: optimal temp 26C, high turbidity correlates with biomass
    stock = (
        baseline * 0.5
        + 0.052 * (co2 - 350.0)
        + 0.38 * turbidity
        + 6.5 * (o2 - 20.0)
        - 1.4 * abs(wtemp - 26.0)
    )
    noise = np.random.normal(0, 1.2)
    return max(50.0, round(float(stock + noise), 3))


def generate_synthetic_data(days=30):
    np.random.seed(42)
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    interval_minutes = 15
    total_ticks = int((days * 24 * 60) / interval_minutes)

    timestamps = [start_time + timedelta(minutes=i * interval_minutes) for i in range(total_ticks)]
    records = []

    print(f"Generating {total_ticks} intervals across 6 nodes ({total_ticks * 6} total records)...")

    for node in NODES_SEED:
        nid = node["id"]
        ntype = node["node_type"]
        baseline = node["baseline_tco2e"]
        ecosystem = node["ecosystem"]

        for idx, ts in enumerate(timestamps):
            hour = ts.hour + ts.minute / 60.0
            # Diurnal solar cycle (peaks around 13:00)
            solar_cycle = np.sin((hour - 6) / 24.0 * 2 * np.pi)

            if ntype == "field":
                p = ECOSYSTEM_PARAMS[ecosystem]
                # Soil temp peaks mid afternoon
                soil_temp = np.clip(p["temp_mean"] + 4.5 * solar_cycle + np.random.normal(0, 0.7), 12.0, 48.0)
                # Moisture dips when temp peaks
                soil_moisture = np.clip(p["moisture_mean"] - 3.0 * solar_cycle + np.random.normal(0, 1.2), 5.0, 98.0)
                salinity_ec = np.clip(p["salinity_mean"] + 0.5 * solar_cycle + np.random.normal(0, 0.3), 0.1, 40.0)
                # NDVI has subtle diurnal solar reflectance proxy variance
                ndvi = np.clip(p["ndvi_mean"] + 0.015 * solar_cycle + np.random.normal(0, 0.008), 0.1, 0.98)
                ndwi = np.clip(p["ndwi_mean"] - 0.012 * solar_cycle + np.random.normal(0, 0.01), -0.4, 0.85)
                biomass = np.clip(p["biomass_mean"] + (idx / total_ticks) * 8.0 + np.random.normal(0, 2.5), 20.0, 300.0)

                feat_dict = {
                    "node_id": nid,
                    "timestamp": ts.isoformat(),
                    "soil_moisture": round(float(soil_moisture), 2),
                    "salinity_ec": round(float(salinity_ec), 2),
                    "soil_temp": round(float(soil_temp), 2),
                    "ndvi_satellite": round(float(ndvi), 4),
                    "ndwi_satellite": round(float(ndwi), 4),
                    "biomass_proxy": round(float(biomass), 2),
                    "co2_ppm": None,
                    "o2_percent": None,
                    "ch4_ppm": None,
                    "voc_index": None,
                    "turbidity_ntu": None,
                    "water_temp": None,
                }
                c_stock = calculate_field_carbon_stock(feat_dict, baseline)
                feat_dict["carbon_stock"] = c_stock
                feat_dict["trust_score"] = round(float(np.random.uniform(96.5, 99.8)), 2)
                feat_dict["is_verified"] = True
                records.append(feat_dict)

            else:
                # Microalgae chamber
                co2_ppm = np.clip(1800.0 - 500.0 * max(0, solar_cycle) + np.random.normal(0, 45.0), 400.0, 4200.0)
                o2_percent = np.clip(21.0 + 2.2 * max(0, solar_cycle) + np.random.normal(0, 0.2), 19.0, 25.0)
                ch4_ppm = np.clip(1.8 + np.random.normal(0, 0.15), 0.4, 6.0)
                voc_index = np.clip(45.0 + 10.0 * solar_cycle + np.random.normal(0, 3.0), 10.0, 250.0)
                turbidity = np.clip(140.0 + (idx / total_ticks) * 60.0 + 15.0 * solar_cycle + np.random.normal(0, 4.0), 20.0, 450.0)
                water_temp = np.clip(25.5 + 2.0 * solar_cycle + np.random.normal(0, 0.5), 18.0, 34.0)

                feat_dict = {
                    "node_id": nid,
                    "timestamp": ts.isoformat(),
                    "soil_moisture": None,
                    "salinity_ec": None,
                    "soil_temp": None,
                    "ndvi_satellite": None,
                    "ndwi_satellite": None,
                    "biomass_proxy": None,
                    "co2_ppm": round(float(co2_ppm), 1),
                    "o2_percent": round(float(o2_percent), 2),
                    "ch4_ppm": round(float(ch4_ppm), 2),
                    "voc_index": round(float(voc_index), 1),
                    "turbidity_ntu": round(float(turbidity), 1),
                    "water_temp": round(float(water_temp), 1),
                }
                c_stock = calculate_chamber_carbon_stock(feat_dict, baseline)
                feat_dict["carbon_stock"] = c_stock
                feat_dict["trust_score"] = round(float(np.random.uniform(97.0, 99.9)), 2)
                feat_dict["is_verified"] = True
                records.append(feat_dict)

    df = pd.DataFrame(records)
    print(f"Generated {len(df)} telemetry rows.")
    return df


def train_models(df):
    print("Training ML Models...")

    # 1. Model 1: XGBRegressor on field telemetry features
    field_df = df[df["soil_moisture"].notnull()].copy()
    feature_cols = ["soil_moisture", "salinity_ec", "soil_temp", "ndvi_satellite", "ndwi_satellite", "biomass_proxy"]
    X = field_df[feature_cols]
    y = field_df["carbon_stock"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    xgb_model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        random_state=42,
        n_jobs=-1
    )
    xgb_model.fit(X_train, y_train)

    y_pred = xgb_model.predict(X_test)
    r2 = float(r2_score(y_test, y_pred))
    mae = float(mean_absolute_error(y_test, y_pred))

    print(f"[Model 1 - XGBoost Carbon Stock] R²: {r2:.4f}, MAE: {mae:.4f} tCO2e/ha")

    with open(MODEL_XGB_PATH, "wb") as f:
        pickle.dump(xgb_model, f)

    # 2. Model 2: IsolationForest for Sensor Fraud & Weather/NDVI Anomaly Detection
    # Train on normal multidimensional telemetry distribution
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.03,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X)

    with open(MODEL_ISO_PATH, "wb") as f:
        pickle.dump(iso_forest, f)
    print("[Model 2 - IsolationForest Anomaly Detector] Successfully fitted and saved.")

    # 3. Model 3: GradientBoostingRegressor for 6-12 month Article 6 Credit Forecasting
    # Synthetic credit generation historical series:
    # Features: [current_stock, baseline_stock, area_ha, month_index, seasonal_solar]
    # Target: monthly credit increment (tCO2e)
    forecast_samples = []
    for _ in range(3500):
        curr_stock = np.random.uniform(35.0, 220.0)
        base_stock = curr_stock * np.random.uniform(0.7, 0.95)
        area = np.random.uniform(20.0, 250.0)
        month = np.random.randint(1, 13)
        # Seasonal factor in Bangladesh: monsoon (months 6-9) has peak biomass growth
        monsoon_boost = 1.35 if 6 <= month <= 9 else 0.85
        accretion_rate = 0.085 * (curr_stock / 100.0) * monsoon_boost + np.random.normal(0, 0.015)
        monthly_credits = max(1.0, area * accretion_rate)
        forecast_samples.append([curr_stock, base_stock, area, month, monsoon_boost, monthly_credits])

    df_fc = pd.DataFrame(forecast_samples, columns=["current_stock", "baseline_stock", "area_ha", "month", "monsoon_boost", "monthly_credits"])
    X_fc = df_fc[["current_stock", "baseline_stock", "area_ha", "month", "monsoon_boost"]]
    y_fc = df_fc["monthly_credits"]

    X_train_fc, X_test_fc, y_train_fc, y_test_fc = train_test_split(X_fc, y_fc, test_size=0.2, random_state=42)

    gbr_model = GradientBoostingRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.07,
        random_state=42
    )
    gbr_model.fit(X_train_fc, y_train_fc)

    fc_r2 = float(r2_score(y_test_fc, gbr_model.predict(X_test_fc)))
    fc_mae = float(mean_absolute_error(y_test_fc, gbr_model.predict(X_test_fc)))
    print(f"[Model 3 - GBR Credit Forecast] R²: {fc_r2:.4f}, MAE: {fc_mae:.4f} tCO2e/month")

    with open(MODEL_GBR_PATH, "wb") as f:
        pickle.dump(gbr_model, f)

    # Save metrics JSON
    metrics = {
        "carbon_stock_xgb": {
            "model": "XGBRegressor",
            "r2_score": r2,
            "mae_tco2e": mae,
            "features": feature_cols,
        },
        "anomaly_isolation_forest": {
            "model": "IsolationForest",
            "contamination": 0.03,
            "trust_threshold": 95.0,
        },
        "credit_forecast_gbr": {
            "model": "GradientBoostingRegressor",
            "r2_score": fc_r2,
            "mae_tco2e_monthly": fc_mae,
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "total_training_samples": len(field_df),
    }

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print("All models and metrics saved to backend/models/")
    return metrics


def seed_database(df):
    print("Seeding SQLite Database...")
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_nodes = db.query(Node).count()
        if existing_nodes == 0:
            for nd in NODES_SEED:
                node = Node(
                    id=nd["id"],
                    name=nd["name"],
                    node_type=nd["node_type"],
                    ecosystem=nd["ecosystem"],
                    latitude=nd["latitude"],
                    longitude=nd["longitude"],
                    area_ha=nd["area_ha"],
                    baseline_tco2e=nd["baseline_tco2e"],
                    status=nd["status"],
                    created_at=datetime.now(timezone.utc).isoformat(),
                )
                db.add(node)
            db.commit()
            print(f"Inserted {len(NODES_SEED)} monitoring nodes.")

        existing_telemetry = db.query(Telemetry).count()
        if existing_telemetry == 0:
            print("Populating telemetry records into SQLite (bulk insert)...")
            telemetry_objects = []
            for _, r in df.iterrows():
                telemetry_objects.append(Telemetry(
                    node_id=r["node_id"],
                    timestamp=r["timestamp"],
                    soil_moisture=r["soil_moisture"],
                    salinity_ec=r["salinity_ec"],
                    soil_temp=r["soil_temp"],
                    ndvi_satellite=r["ndvi_satellite"],
                    ndwi_satellite=r["ndwi_satellite"],
                    biomass_proxy=r["biomass_proxy"],
                    co2_ppm=r["co2_ppm"],
                    o2_percent=r["o2_percent"],
                    ch4_ppm=r["ch4_ppm"],
                    voc_index=r["voc_index"],
                    turbidity_ntu=r["turbidity_ntu"],
                    water_temp=r["water_temp"],
                    carbon_stock=r["carbon_stock"],
                    trust_score=r["trust_score"],
                    is_verified=r["is_verified"],
                ))
                if len(telemetry_objects) >= 2000:
                    db.bulk_save_objects(telemetry_objects)
                    db.commit()
                    telemetry_objects = []
            if telemetry_objects:
                db.bulk_save_objects(telemetry_objects)
                db.commit()
            print(f"Populated {len(df)} telemetry records.")

        # Seed SHA-256 Ledger
        existing_blocks = db.query(Ledger).count()
        if existing_blocks == 0:
            print("Constructing SHA-256 Cryptographic Hash Chain Ledger...")
            # Genesis block
            genesis_prev = "0" * 64
            genesis_payload = f"0:{genesis_prev}:GENESIS:{datetime.now(timezone.utc).isoformat()}:0.0000:0.0000:100.00"
            genesis_hash = hashlib.sha256(genesis_payload.encode("utf-8")).hexdigest()

            genesis_block = Ledger(
                block_index=0,
                node_id="NODE-BD-01",
                timestamp=datetime.now(timezone.utc).isoformat(),
                carbon_stock=0.0,
                trust_score=100.0,
                credits_issued=0.0,
                previous_hash=genesis_prev,
                current_hash=genesis_hash,
                tx_signature="SIG-GENESIS-ED25519-CLIMATESPHERE-MRV"
            )
            db.add(genesis_block)
            db.commit()

            # Seed 50 verified ledger blocks from the most recent high-trust telemetry
            recent_verified = (
                db.query(Telemetry)
                .filter(Telemetry.trust_score >= 95.0)
                .order_by(Telemetry.id.desc())
                .limit(50)
                .all()
            )
            recent_verified.reverse()

            prev_hash = genesis_hash
            block_idx = 1
            for rec in recent_verified:
                node = db.query(Node).filter(Node.id == rec.node_id).first()
                area = node.area_ha if node else 100.0
                credits = round(float(rec.carbon_stock * area * 0.002), 4)

                block_payload = f"{block_idx}:{prev_hash}:{rec.node_id}:{rec.timestamp}:{rec.carbon_stock:.4f}:{credits:.4f}:{rec.trust_score:.2f}"
                curr_hash = hashlib.sha256(block_payload.encode("utf-8")).hexdigest()
                tx_sig = f"SIG-{curr_hash[:16].upper()}-VERRA-VM0033"

                block = Ledger(
                    block_index=block_idx,
                    node_id=rec.node_id,
                    timestamp=rec.timestamp,
                    carbon_stock=rec.carbon_stock,
                    trust_score=rec.trust_score,
                    credits_issued=credits,
                    previous_hash=prev_hash,
                    current_hash=curr_hash,
                    tx_signature=tx_sig
                )
                db.add(block)
                prev_hash = curr_hash
                block_idx += 1

            db.commit()
            print(f"Minted {block_idx} verified SHA-256 blocks into ledger.")

        # Seed sample credit batches for Article 6 registry export
        existing_credits = db.query(Credit).count()
        if existing_credits == 0:
            print("Seeding Article 6 verified credit batches...")
            credit_batches = [
                Credit(
                    id="CR-BD-2026-SUN01",
                    batch_id="BATCH-SUN-2026-Q1",
                    node_id="NODE-BD-01",
                    vintage_year=2026,
                    tco2e_volume=1840.50,
                    price_per_ton_usd=28.50,
                    status="verified",
                    article_6_type="Article 6.2 ITMO",
                    issued_at=datetime.now(timezone.utc).isoformat(),
                    ledger_hash=prev_hash
                ),
                Credit(
                    id="CR-BD-2026-COX02",
                    batch_id="BATCH-COX-2026-Q1",
                    node_id="NODE-BD-02",
                    vintage_year=2026,
                    tco2e_volume=960.25,
                    price_per_ton_usd=28.50,
                    status="verified",
                    article_6_type="Article 6.2 ITMO",
                    issued_at=datetime.now(timezone.utc).isoformat(),
                    ledger_hash=prev_hash
                ),
                Credit(
                    id="CR-BD-2026-ALG03",
                    batch_id="BATCH-ALG-2026-Q1",
                    node_id="NODE-BD-06",
                    vintage_year=2026,
                    tco2e_volume=450.00,
                    price_per_ton_usd=35.00,
                    status="verified",
                    article_6_type="Article 6.4 Mechanism",
                    issued_at=datetime.now(timezone.utc).isoformat(),
                    ledger_hash=prev_hash
                )
            ]
            for cb in credit_batches:
                db.add(cb)
            db.commit()
            print(f"Seeded {len(credit_batches)} Article 6 credit batches.")

    finally:
        db.close()


def run_pipeline():
    print("=" * 60)
    print("CarbonIQ-MRV Seed and Model Training Pipeline")
    print("=" * 60)
    df = generate_synthetic_data(days=30)
    train_models(df)
    seed_database(df)
    print("Pipeline completed successfully!")


if __name__ == "__main__":
    run_pipeline()
