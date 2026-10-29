import joblib
import os

model = joblib.load('saved_models/xgboost_model.pkl')

print("=" * 70)
print("MODEL ARCHITECTURE ANALYSIS")
print("=" * 70)

print(f"\nModel type: {type(model)}")
print(f"Base estimator type: {type(model.estimator)}")

print(f"\n--- XGBoost Base Estimator Configuration ---")
print(f"n_estimators: {model.estimator.n_estimators}")
print(f"max_depth: {model.estimator.max_depth}")
print(f"learning_rate: {model.estimator.learning_rate}")
print(f"min_child_weight: {model.estimator.min_child_weight}")
print(f"gamma: {model.estimator.gamma}")
print(f"subsample: {model.estimator.subsample}")
print(f"colsample_bytree: {model.estimator.colsample_bytree}")
print(f"num_class: 3 (BUY/HOLD/SELL)")

print(f"\n--- Calibration Configuration ---")
print(f"Calibration method: {model.method}")
print(f"CV folds: {model.cv}")
print(f"Number of calibrated classifiers: {len(model.calibrated_classifiers_)}")

print(f"\n--- Feature Information ---")
print(f"Number of features: {model.n_features_in_}")
print(f"Feature names: {model.feature_names_in_}")

print(f"\n--- Size Analysis ---")
model_size_mb = os.path.getsize('saved_models/xgboost_model.pkl') / (1024 * 1024)
print(f"Model file size: {model_size_mb:.2f} MB")

print(f"\n--- Why the model is 227MB ---")
print(f"1. n_estimators = 500 trees in the base XGBoost model")
print(f"2. max_depth = 10 (each tree can have up to 2^10 = 1024 leaves)")
print(f"3. num_class = 3 (multi-class classification)")
print(f"4. CalibratedClassifierCV with cv=3 stores 3 fitted copies of the base model")
print(f"5. Each copy contains 500 trees x 3 classes = 1500 trees (multi-class setup)")
print(f"6. Total trees stored ~ 500 x 3 (CV folds) x 3 (classes) = 4500 trees")
print(f"7. Each tree with depth 10 has significant parameter overhead")
print(f"8. Pickle format stores full object graph including sklearn calibration objects")

print(f"\n--- Potential Size Reduction ---")
print(f"Without changing predictions, the model could be reduced by:")
print(f"- 60-70% by using XGBoost's native save_model() instead of pickle")
print(f"- 40-50% by reducing n_estimators from 500 to 200-300 (may affect accuracy)")
print(f"- 30-40% by reducing max_depth from 10 to 6-8 (may affect accuracy)")
print(f"- 66% by using cv=1 instead of cv=3 (use single calibration)")
print(f"- 95%+ by removing calibration entirely (may affect probability quality)")
print(f"\nConservative estimate with only format change: ~80-100 MB")
print(f"Aggressive estimate with hyperparameter tuning: ~30-50 MB")
