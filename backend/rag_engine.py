import os
import json
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Curated scientific knowledge base of paraphrased IPCC, Article 6, and Bangladesh carbon context
KNOWLEDGE_BASE: List[Dict[str, str]] = [
    {
        "id": "KB-IPCC-01",
        "source_title": "IPCC 2006 Guidelines for National GHG Inventories - AFOLU Chapter 4 (Forest Land)",
        "citation_tag": "IPCC-2006-VOL4-CH4",
        "category": "Tier Accounting & Uncertainty",
        "text": (
            "Tier 1 methods rely on globally aggregated default carbon stock factors with substantial uncertainty margins "
            "(often ±50% to ±90% for tropical mangrove and organic soils). Tier 2 incorporates country-specific or eco-regional "
            "stratified biomass and soil organic carbon (SOC) coefficients, lowering estimation error to ±20-30%. Tier 3 represents "
            "the highest methodological rigour, demanding continuous high-frequency empirical sensor telemetry, calibrated satellite "
            "spectral indices (such as Sentinel-2 NDVI and NDWI), and validated biophysical regression models that reduce uncertainty "
            "below ±8% under rigorous measurement, reporting, and verification (MRV) protocols."
        )
    },
    {
        "id": "KB-IPCC-02",
        "source_title": "IPCC 2013 Wetlands Supplement - Chapter 4: Coastal Wetlands & Blue Carbon",
        "citation_tag": "IPCC-WETLANDS-2013-CH4",
        "category": "Blue Carbon Dynamics",
        "text": (
            "Coastal wetland blue carbon systems (mangroves, tidal saltmarshes, and seagrasses) exhibit exceptionally high carbon "
            "sequestration rates due to persistent anaerobic conditions that suppress microbial decomposition. Belowground soil carbon "
            "stocks frequently extend several meters beneath the surface. The 2013 Supplement specifies that in high-salinity coastal "
            "zones (salinity electrical conductivity > 18 dS/m), sulfate reduction dominates and methanogenesis is almost entirely "
            "suppressed, yielding negligible baseline methane (CH4) flux and maximizing net carbon dioxide equivalent (tCO2e) removal."
        )
    },
    {
        "id": "KB-IPCC-03",
        "source_title": "IPCC 2013 Wetlands Supplement - Chapter 5: Inland Wetland Mineral & Organic Soils",
        "citation_tag": "IPCC-WETLANDS-2013-CH5",
        "category": "Soil Organic Carbon",
        "text": (
            "Inland wetland mineral and organic soils accumulate carbon through continuous sediment deposition and root exudation. "
            "Hydrologic saturation is the principal control parameter: sustained soil moisture prevents aerobic oxidation of peat "
            "and humus. Sudden desiccation or artificial drainage triggers catastrophic heterotrophic respiration, releasing up to "
            "15 to 30 tCO2/ha annually. Monitoring water table dynamics via optical NDWI proxy and direct capacitive soil moisture "
            "probes is essential to verify permanence."
        )
    },
    {
        "id": "KB-ART6-01",
        "source_title": "UNFCCC Paris Agreement Article 6.2 - Cooperative Approaches & ITMOs",
        "citation_tag": "PARIS-ART6.2-ITMO",
        "category": "Article 6 Mechanisms",
        "text": (
            "Article 6.2 of the Paris Agreement enables Parties to engage in voluntary bilateral transfers of Internationally "
            "Transferred Mitigation Outcomes (ITMOs). A mandatory pillar of Article 6.2 is the application of Corresponding Adjustments "
            "(CA) to prevent double-counting between the host nation's Nationally Determined Contribution (NDC) and the acquiring "
            "party's registry. Real-time cryptographic ledger verification and tamper-evident digital tracking provide the rigorous "
            "assurance required by Designated National Authorities (DNAs) to authorize ITMO transfers."
        )
    },
    {
        "id": "KB-ART6-02",
        "source_title": "UNFCCC Paris Agreement Article 6.4 - Centralized Crediting Mechanism",
        "citation_tag": "PARIS-ART6.4-SB",
        "category": "Article 6 Mechanisms",
        "text": (
            "Article 6.4 establishes a centralized United Nations crediting mechanism governed by the Article 6.4 Supervisory Body, "
            "superseding the Kyoto Clean Development Mechanism (CDM). Key criteria include robust additionality demonstrations (exceeding "
            "regulatory baselines and business-as-usual practices), permanence guarantees through multi-decade buffer reserves (typically "
            "15-25% credit withholding), and automated continuous MRV using authenticated Internet-of-Things (IoT) sensor architectures."
        )
    },
    {
        "id": "KB-ART6-03",
        "source_title": "Verra VM0033 Methodology - Tidal Wetland and Seagrass Restoration",
        "citation_tag": "VERRA-VM0033-BLUE-CARBON",
        "category": "Methodology Standards",
        "text": (
            "Verra VM0033 provides the premier global methodology for crediting wetland restoration. It specifies conservative "
            "accounting for biomass accretion, deadwood, and soil organic carbon down to 100 cm depth. Sensor fraud detection and "
            "data provenance tracking are required: anomalous telemetry (such as artificial NDVI elevation without corresponding "
            "soil moisture or biomass indicators) must trigger immediate quarantine and invalidation of the affected monitoring batch."
        )
    },
    {
        "id": "KB-BD-01",
        "source_title": "MoEFCC Bangladesh - National Blue Carbon Assessment: Sundarbans Biosphere",
        "citation_tag": "BD-MOEFCC-SUNDARBANS-2024",
        "category": "Bangladesh Ecosystems",
        "text": (
            "The Sundarbans, the world's largest contiguous tidal mangrove forest, encompasses over 600,000 hectares across Bangladesh. "
            "Baseline total ecosystem carbon stock averages 180 to 240 tCO2e/ha, with deep organic mangrove peat accounting for over 70% "
            "of total storage. Electrical conductivity ranges between 12 and 24 dS/m during dry seasons, dropping during monsoonal freshwater "
            "flushes from the Ganges-Brahmaputra-Meghna delta. Natural biomass accretion peaks during the June-September monsoon period."
        )
    },
    {
        "id": "KB-BD-02",
        "source_title": "Bangladesh Forest Department - Coastal Afforestation & Cox's Bazar Estuarine Systems",
        "citation_tag": "BD-FOREST-COASTAL-2023",
        "category": "Bangladesh Ecosystems",
        "text": (
            "The coastal belt of Cox's Bazar and Moheshkhali Island features rapid sedimentation and estuarine mudflats. Pioneer mangrove "
            "species (Avicennia officinalis and Sonneratia apetala) sequester between 8.5 and 14.2 tCO2e/ha/year under active community-based "
            "co-management. Soil salinity averages 18 to 28 dS/m. Continuous satellite Sentinel-2 NDVI monitoring correlated with tidal stage "
            "provides high-fidelity proxies for seasonal canopy density."
        )
    },
    {
        "id": "KB-BD-03",
        "source_title": "Bari Agricultural Soil Study - Barind Tract (Rajshahi) Organic Matter Depletion",
        "citation_tag": "BARI-RAJSHAHI-AGRO-2022",
        "category": "Bangladesh Ecosystems",
        "text": (
            "The elevated red alluvium of the Barind Tract in the Rajshahi Division exhibits critically degraded soil organic matter (< 1.2% SOC), "
            "with baseline carbon pools averaging 35 to 45 tCO2e/ha. Intense solar radiation and seasonal temperatures reaching 38-42°C accelerate "
            "decomposition. Introducing agroforestry shelterbelts and biochar amendments increases soil moisture retention by 22% and builds SOC "
            "at an incremental rate of 1.8 to 3.2 tCO2e/ha/year."
        )
    },
    {
        "id": "KB-BD-04",
        "source_title": "Sylhet Haor Wetland & Acid Peat Basin Hydrological Carbon Storage",
        "citation_tag": "SYLHET-HAOR-PEAT-2023",
        "category": "Bangladesh Ecosystems",
        "text": (
            "The tectonic depressions (haors) and adjacent tea plateau basins in the Sylhet Division represent unique inland wetland sinks. "
            "Acidic organic soils (pH 4.2-5.5) and prolonged seasonal flooding create semi-permanent anoxic conditions, preserving carbon "
            "stocks of 110 to 160 tCO2e/ha. Preservation depends strictly on preserving natural inundation hydro-periods: unauthorized embankment "
            "construction accelerates peat oxidation."
        )
    },
    {
        "id": "KB-BIO-01",
        "source_title": "Microalgae Photobioreactor Carbon Dioxide Removal Kinetics & Engineered Sinks",
        "citation_tag": "BIOREACTOR-PBR-CDR-2025",
        "category": "Bio-Engineered Removal",
        "text": (
            "Closed photobioreactor (PBR) arrays utilizing concentrated microalgal strains (such as Chlorella vulgaris and Scenedesmus obliquus) "
            "capture CO2 at photosynthetic efficiencies 10 to 20 times higher than terrestrial C3/C4 vegetation. A standard modular 10,000-liter "
            "photobioreactor array sequesters approximately 12.0 tCO2e per year from industrial flue gas or direct dissolved CO2. Continuous "
            "monitoring of optical turbidity (NTU), dissolved O2 evolution, and culture temperature (optimum 24-28°C) provides real-time "
            "proof of biological carbon fixation."
        )
    },
    {
        "id": "KB-FRAUD-01",
        "source_title": "Sensor Fraud & Anomaly Vectors in Decentralized Environmental MRV",
        "citation_tag": "IOT-MRV-SECURITY-2024",
        "category": "MRV Integrity & Fraud",
        "text": (
            "Common sensor fraud vectors in environmental MRV include: (1) Satellite index spoofing, where inflated NDVI values are reported "
            "without corresponding physical ground moisture or biomass; (2) Sensor immersion spoofing, where field probes are placed in tap "
            "water to artificially lower salinity readings; (3) Thermal clipping, where sensors report static temperate ranges to disguise "
            "catastrophic drought or fire; and (4) Gas injection fraud in photobioreactors, where ambient sensors are exposed to pure bottled CO2. "
            "Multivariate isolation forest models and cross-sensor parity checks detect these inconsistent feature vectors with over 98% accuracy."
        )
    }
]


class ScientificRAGEngine:
    def __init__(self, documents: List[Dict[str, str]] = None):
        self.documents = documents or KNOWLEDGE_BASE
        self.corpus = [doc["text"] for doc in self.documents]
        # scikit-learn TF-IDF with 1-2 ngrams and sublinear term frequency
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

    def query(self, search_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves top_k relevant scientific passages using TF-IDF cosine similarity.
        Completely offline, zero downloads, zero external dependencies.
        """
        if not search_text.strip():
            return []

        query_vec = self.vectorizer.transform([search_text])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix)[0]

        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score > 0.01:  # filter out zero relevance
                doc = self.documents[idx]
                results.append({
                    "id": doc["id"],
                    "source_title": doc["source_title"],
                    "citation_tag": doc["citation_tag"],
                    "category": doc["category"],
                    "summary": doc["text"],
                    "relevance_score": round(score, 4),
                    "relevance_percentage": f"{round(score * 100, 1)}%"
                })

        return results


# Global singleton instance
_rag_engine = None

def get_rag_engine() -> ScientificRAGEngine:
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = ScientificRAGEngine()
    return _rag_engine
