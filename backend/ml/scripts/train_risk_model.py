"""
AgriGuard AI — ML Script: Train Predictive Weather Disease Risk Model (XGBoost)
==============================================================================
Phase 2 Scientific Improvement

SCIENTIFIC CONTEXT & TARGET-GENERATION METHODOLOGY:
This model learns the epidemiological Disease Triangle (Host + Pathogen + Environment)
based on established micro-meteorological infection kinetics (e.g., Magarey et al. 2005):
    1. Moisture Requirement: Spore germination requires sustained leaf wetness and high RH (>80%).
    2. Thermal Suitability: Pathogen germination rate and hyphal extension depend on cardinal
       temperatures (optimal vs sub-optimal thermal windows).
    3. Host & Seasonality: Crop susceptibility aligns with active phenological vegetative cycles.
    4. Stochastic Heterogeneity: Micro-climate variance and cultivar resistance variation.

IMPORTANT TRANSPARENCY NOTICE:
Training labels are synthetic/threshold-derived for the hackathon prototype and are NOT
based on real Pakistani historical disease outbreak surveillance data.
Cross-validation scores reflect performance on this synthetic epidemiological simulation
and must NOT be interpreted as real-world Pakistani outbreak surveillance accuracy.

Features Engineered:
    1. high_humidity_hours_7d (float): Count of hours in 7d window where RH > 80%
    2. temp_in_optimal_range (int): 1 if in optimal pathogen growth range, 0 otherwise
    3. rainfall_3d (float): 3-day accumulated precipitation in mm
    4. crop_encoded (int): 0=cotton, 1=wheat, 2=rice, 3=sugarcane
    5. season_encoded (int): 0=rabi (winter), 1=kharif (summer/monsoon), 2=zaid (spring)

Outputs:
    backend/ml/models/risk_model.json
    backend/ml/models/risk_model.joblib
"""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import joblib
import numpy as np
import xgboost as xgb
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold

# Feature Names aligned with Blueprint
FEATURE_NAMES = [
    "high_humidity_hours_7d",
    "temp_in_optimal_range",
    "rainfall_3d",
    "crop_encoded",
    "season_encoded",
]

# Optimal pathogen growth temperature ranges per crop (°C)
# Documented agronomic references:
# - Wheat (Leaf/Yellow Rust: Puccinia spp.): 12°C - 25°C
# - Cotton (Bacterial Blight / CLCuD vector optimal): 25°C - 35°C
# - Rice (Blast: Magnaporthe oryzae): 20°C - 30°C
# - Sugarcane (Red Rot: Colletotrichum falcatum): 22°C - 32°C
OPTIMAL_TEMP_RANGES = {
    0: (25.0, 35.0),  # Cotton
    1: (12.0, 25.0),  # Wheat
    2: (20.0, 30.0),  # Rice
    3: (22.0, 32.0),  # Sugarcane
}

CROPS = ["cotton", "wheat", "rice", "sugarcane"]
SEASONS = ["rabi", "kharif", "zaid"]


def generate_improved_epidemiological_dataset(n_samples: int = 10000, seed: int = 42):
    """
    Generate synthetic weather-derived feature rows with multi-factor
    epidemiological infection labels. Avoids single-variable hard gates.
    """
    rng = np.random.default_rng(seed)

    # 1. High humidity hours in 7-day window (0 to 168 hrs)
    high_humidity_hours = rng.beta(2.0, 2.5, n_samples) * 168.0

    # 2. Daily mean temperature (°C) across Pakistani agricultural zones (8°C to 44°C)
    temperatures = rng.uniform(8.0, 44.0, n_samples)

    # 3. 3-day accumulated rainfall (mm)
    rainfall_3d = rng.exponential(6.0, n_samples).clip(0.0, 100.0)

    # 4. Crop type (0: cotton, 1: wheat, 2: rice, 3: sugarcane)
    crop_encoded = rng.integers(0, 4, n_samples)

    # 5. Season (0: rabi [winter/spring], 1: kharif [summer/monsoon], 2: zaid)
    season_encoded = rng.integers(0, 3, n_samples)

    temp_in_optimal = np.zeros(n_samples, dtype=np.float32)
    thermal_suitability = np.zeros(n_samples, dtype=np.float32)

    for i in range(n_samples):
        c = int(crop_encoded[i])
        t = temperatures[i]
        min_t, max_t = OPTIMAL_TEMP_RANGES[c]

        if min_t <= t <= max_t:
            temp_in_optimal[i] = 1.0
            # Peak thermal efficiency at center of optimal window
            mid_t = (min_t + max_t) / 2.0
            half_w = (max_t - min_t) / 2.0
            thermal_suitability[i] = 1.0 - 0.25 * (abs(t - mid_t) / half_w)
        elif (min_t - 5.0 <= t < min_t) or (max_t < t <= max_t + 5.0):
            temp_in_optimal[i] = 0.0
            thermal_suitability[i] = 0.40  # Sub-optimal infection proceeds at reduced rate
        else:
            temp_in_optimal[i] = 0.0
            thermal_suitability[i] = 0.10  # Extreme cold/heat inhibits germination

    # Biological Moisture Factor:
    # Fungal germination requires prolonged RH > 80% and/or rain for leaf wetness duration
    moisture_factor = (
        np.clip((high_humidity_hours - 15.0) / 45.0, 0.0, 1.5)
        + np.tanh(rainfall_3d / 12.0) * 0.6
    )

    # Host-Season Phenological Compatibility:
    # Host crops are most susceptible during active vegetative / reproductive cycles
    season_compatibility = np.zeros(n_samples, dtype=np.float32)
    for i in range(n_samples):
        c = crop_encoded[i]
        s = season_encoded[i]
        if (c == 1 and s == 0) or (c in (0, 2) and s == 1) or (c == 3 and s in (0, 1)):
            season_compatibility[i] = 1.0
        elif s == 2:
            season_compatibility[i] = 0.6
        else:
            season_compatibility[i] = 0.35

    # Multiplicative Epidemiological Interaction:
    # Infection Risk = Moisture Requirement x Thermal Efficiency x Host Susceptibility
    infection_index = (
        0.45 * moisture_factor
        + 0.30 * thermal_suitability
        + 0.35 * (moisture_factor * thermal_suitability)
        + 0.20 * season_compatibility
    )

    # Convert to outbreak probability via logistic function with micro-environmental variance
    z = (infection_index - 1.25) * 3.2 + rng.normal(0.0, 0.35, n_samples)
    probs = 1.0 / (1.0 + np.exp(-z))
    labels = (rng.uniform(0.0, 1.0, n_samples) < probs).astype(np.int32)

    X = np.column_stack([
        high_humidity_hours,
        temp_in_optimal,
        rainfall_3d,
        crop_encoded.astype(np.float32),
        season_encoded.astype(np.float32),
    ])

    return X, labels


def train_and_evaluate_model():
    print("=" * 80)
    print("AGRIGUARD AI — PHASE 2 IMPROVED PREDICTIVE RISK MODEL TRAINING")
    print("=" * 80)
    print("Generating improved multi-factor epidemiological dataset (n=10000, seed=42)...")
    X, y = generate_improved_epidemiological_dataset(n_samples=10000, seed=42)

    positive_rate = np.mean(y) * 100
    print(f"Dataset generated: {X.shape[0]} rows, {X.shape[1]} features.")
    print(
        f"Class Distribution: Outbreak=1 ({positive_rate:.1f}%), "
        f"Normal=0 ({100 - positive_rate:.1f}%)"
    )

    # ──────────────────────────────────────────────────────────────────────────
    # Stratified 5-Fold Cross Validation
    # ──────────────────────────────────────────────────────────────────────────
    print("\nRunning Stratified 5-Fold Cross Validation...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    accuracies = []
    precisions = []
    recalls = []
    f1s = []
    aucs = []

    fold = 1
    for train_idx, val_idx in skf.split(X, y):
        X_tr, X_va = X[train_idx], X[val_idx]
        y_tr, y_va = y[train_idx], y[val_idx]

        clf = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.85,
            colsample_bytree=0.85,
            objective="binary:logistic",
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
        clf.fit(X_tr, y_tr)

        y_pred = clf.predict(X_va)
        y_prob = clf.predict_proba(X_va)[:, 1]

        acc = accuracy_score(y_va, y_pred)
        prec = precision_score(y_va, y_pred, zero_division=0)
        rec = recall_score(y_va, y_pred, zero_division=0)
        f1 = f1_score(y_va, y_pred, zero_division=0)
        auc = roc_auc_score(y_va, y_prob)

        accuracies.append(acc)
        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)
        aucs.append(auc)

        print(
            f"  Fold {fold}: Acc={acc*100:.2f}%, Prec={prec*100:.2f}%, "
            f"Rec={rec*100:.2f}%, F1={f1*100:.2f}%, AUC={auc:.4f}"
        )
        fold += 1

    print("-" * 80)
    print("5-FOLD CV MEAN METRICS (ON MULTI-FACTOR EPIDEMIOLOGICAL LABELS):")
    print(f"  Accuracy  : {np.mean(accuracies)*100:.2f}% (±{np.std(accuracies)*100:.2f}%)")
    print(f"  Precision : {np.mean(precisions)*100:.2f}% (±{np.std(precisions)*100:.2f}%)")
    print(f"  Recall    : {np.mean(recalls)*100:.2f}% (±{np.std(recalls)*100:.2f}%)")
    print(f"  F1-Score  : {np.mean(f1s)*100:.2f}% (±{np.std(f1s)*100:.2f}%)")
    print(f"  ROC-AUC   : {np.mean(aucs):.4f} (±{np.std(aucs):.4f})")
    print("-" * 80)
    print("LIMITATION NOTE: Performance is evaluated on synthetic threshold rules.")
    print("Real Pakistani historical surveillance data is required for production.")

    # ──────────────────────────────────────────────────────────────────────────
    # Final Model Training on Full Dataset & Storage
    # ──────────────────────────────────────────────────────────────────────────
    print("\nTraining final XGBoost model on full dataset...")
    final_model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )
    final_model.fit(X, y)

    # Feature Importance Breakdown
    importances = final_model.feature_importances_
    print("\nXGBoost Feature Importances:")
    for name, imp in zip(FEATURE_NAMES, importances):
        print(f"  - {name:<25}: {imp * 100:.2f}%")

    out_dir = Path(__file__).resolve().parents[2] / "ml" / "models"
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / "risk_model.json"
    joblib_path = out_dir / "risk_model.joblib"

    final_model.save_model(str(json_path))
    joblib.dump(final_model, str(joblib_path))

    print("\nModel saved successfully:")
    print(f"  - Native JSON : {json_path}")
    print(f"  - Joblib file : {joblib_path}")
    print("=" * 80)


if __name__ == "__main__":
    train_and_evaluate_model()
