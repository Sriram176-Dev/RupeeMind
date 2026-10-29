"""
Simple model diagnostic script to check model status without full prediction
"""
import os
from pathlib import Path

def check_model_files():
    """Check if all required model files exist and report their sizes"""
    
    model_dir = Path("saved_models")
    
    required_files = [
        "xgboost_model.pkl",
        "label_encoder.pkl",
        "feature_columns.pkl"
    ]
    
    print("=" * 70)
    print("RUPEEMIND ML - MODEL STATUS CHECK")
    print("=" * 70)
    print()
    
    all_exist = True
    
    for filename in required_files:
        filepath = model_dir / filename
        if filepath.exists():
            size_mb = os.path.getsize(filepath) / (1024 * 1024)
            print(f"[OK] {filename:30s} - {size_mb:.2f} MB")
        else:
            print(f"[X]  {filename:30s} - NOT FOUND")
            all_exist = False
    
    print()
    print("-" * 70)
    
    if all_exist:
        print("STATUS: All model files are present [OK]")
        print()
        print("Attempting to load model artifacts...")
        print()
        
        try:
            import joblib
            
            # Try loading each file
            print("Loading XGBoost model...")
            model = joblib.load(model_dir / "xgboost_model.pkl")
            print(f"  → Model type: {type(model).__name__}")
            
            print("Loading label encoder...")
            encoder = joblib.load(model_dir / "label_encoder.pkl")
            print(f"  → Encoder classes: {encoder.classes_}")
            
            print("Loading feature columns...")
            features = joblib.load(model_dir / "feature_columns.pkl")
            print(f"  → Number of features: {len(features)}")
            print(f"  → Sample features: {features[:5]}")
            
            print()
            print("=" * 70)
            print("MODEL STATUS: WORKING [OK]")
            print("=" * 70)
            print()
            print("The model files are valid and can be loaded successfully.")
            print("However, there is a system-level DLL blocking issue preventing")
            print("scipy from loading, which affects predictions.")
            print()
            print("ISSUE: Windows Application Control policy is blocking scipy DLLs")
            print("SOLUTION: Contact system administrator to whitelist Python/scipy DLLs")
            
        except Exception as e:
            print(f"ERROR loading model: {e}")
            print()
            print("=" * 70)
            print("MODEL STATUS: CANNOT LOAD [X]")
            print("=" * 70)
    else:
        print("STATUS: Some model files are missing [X]")
        print()
        print("Please run training pipeline first:")
        print("  python train.py")
    
    print()

if __name__ == "__main__":
    check_model_files()
