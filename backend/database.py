import os
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "carboniq.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Node(Base):
    __tablename__ = "nodes"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    node_type = Column(String(50), nullable=False)  # "field" or "chamber"
    ecosystem = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_ha = Column(Float, nullable=False)
    baseline_tco2e = Column(Float, nullable=False)
    status = Column(String(20), default="active")  # active, tampered, calibrating
    created_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())

    telemetries = relationship("Telemetry", back_populates="node", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="node", cascade="all, delete-orphan")
    ledger_entries = relationship("Ledger", back_populates="node")
    credits = relationship("Credit", back_populates="node")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    node_id = Column(String(50), ForeignKey("nodes.id"), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False, index=True)

    # Field/blue-carbon sensors
    soil_moisture = Column(Float, nullable=True)     # % (0 - 100)
    salinity_ec = Column(Float, nullable=True)       # dS/m (0 - 30)
    soil_temp = Column(Float, nullable=True)         # °C (15 - 45)
    ndvi_satellite = Column(Float, nullable=True)    # 0.0 - 1.0
    ndwi_satellite = Column(Float, nullable=True)    # -0.5 - 0.9
    biomass_proxy = Column(Float, nullable=True)     # 10 - 250 g/m²

    # Bio-reactor chamber sensors
    co2_ppm = Column(Float, nullable=True)           # 300 - 4500 ppm
    o2_percent = Column(Float, nullable=True)        # 18.0 - 25.0 %
    ch4_ppm = Column(Float, nullable=True)           # 0.5 - 15.0 ppm
    voc_index = Column(Float, nullable=True)         # 10 - 450 index
    turbidity_ntu = Column(Float, nullable=True)     # 5 - 400 NTU
    water_temp = Column(Float, nullable=True)        # 18.0 - 36.0 °C

    # Derived outputs
    carbon_stock = Column(Float, nullable=False)     # tCO2e/ha (or chamber total tCO2e)
    trust_score = Column(Float, default=98.0)        # 0.0 - 100.0
    is_verified = Column(Boolean, default=True)

    node = relationship("Node", back_populates="telemetries")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    node_id = Column(String(50), ForeignKey("nodes.id"), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False, index=True)
    trust_score = Column(Float, nullable=False)
    anomaly_type = Column(String(100), nullable=False)
    feature_drifts = Column(Text, nullable=True)      # JSON string
    is_tampered = Column(Boolean, default=False)
    raw_values = Column(Text, nullable=True)          # JSON string

    node = relationship("Node", back_populates="anomalies")


class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    block_index = Column(Integer, unique=True, nullable=False, index=True)
    node_id = Column(String(50), ForeignKey("nodes.id"), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False, index=True)
    carbon_stock = Column(Float, nullable=False)
    trust_score = Column(Float, nullable=False)
    credits_issued = Column(Float, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, index=True)
    tx_signature = Column(String(128), nullable=True)

    node = relationship("Node", back_populates="ledger_entries")


class Credit(Base):
    __tablename__ = "credits"

    id = Column(String(50), primary_key=True, index=True)
    batch_id = Column(String(50), nullable=False, index=True)
    node_id = Column(String(50), ForeignKey("nodes.id"), nullable=False, index=True)
    vintage_year = Column(Integer, nullable=False)
    tco2e_volume = Column(Float, nullable=False)
    price_per_ton_usd = Column(Float, default=28.5)
    status = Column(String(50), default="verified")  # verified, issued, retired
    article_6_type = Column(String(50), default="Article 6.2 ITMO")
    issued_at = Column(String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    ledger_hash = Column(String(64), nullable=True)

    node = relationship("Node", back_populates="credits")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
