from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from src.utils.constants import SAVED_MODELS_DIR


class StockPredictor:
    """
    Improved Stock Predictor with honest probability reporting and enhanced metrics.
    
    IMPORTANT: This model provides probabilities based on historical patterns.
    Stock market predictions are inherently uncertain and should not be the sole
    basis for investment decisions. Always use proper risk management.
    """

    def __init__(self, model_directory: Path = SAVED_MODELS_DIR, honest_mode: bool = True):
        """
        Initialize predictor.
        
        Args:
            model_directory: Path to saved model artifacts
            honest_mode: If True, report actual model probabilities without artificial boosting
        """
        self.model_directory = Path(model_directory)
        self.honest_mode = honest_mode
        self.model = None
        self.encoder = None
        self.feature_columns = None
        self.load_model_artifacts()

    def load_model_artifacts(self):
        model_path = self.model_directory / "xgboost_model.pkl"
        encoder_path = self.model_directory / "label_encoder.pkl"
        features_path = self.model_directory / "feature_columns.pkl"

        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path}. Please train the model first.")
        if not encoder_path.exists():
            raise FileNotFoundError(f"Label encoder file not found at {encoder_path}.")
        if not features_path.exists():
            raise FileNotFoundError(f"Feature columns file not found at {features_path}.")

        self.model = joblib.load(model_path)
        self.encoder = joblib.load(encoder_path)
        self.feature_columns = joblib.load(features_path)

    def _get_signal_strength(self, confidence: float, entropy: float) -> str:
        """
        Determine signal strength based on confidence and prediction entropy.
        
        Args:
            confidence: Probability of predicted class (0-100)
            entropy: Shannon entropy of probability distribution
            
        Returns:
            Signal strength classification
        """
        # High confidence + low entropy = strong signal
        if confidence >= 70.0 and entropy < 0.5:
            return "STRONG"
        elif confidence >= 55.0 and entropy < 0.8:
            return "MODERATE"
        elif confidence >= 40.0:
            return "WEAK"
        else:
            return "VERY WEAK"
    
    def _calculate_entropy(self, probabilities: np.ndarray) -> float:
        """
        Calculate Shannon entropy of probability distribution.
        Higher entropy = more uncertainty.
        
        Args:
            probabilities: Array of class probabilities
            
        Returns:
            Entropy value (0 = certain, log(n_classes) = maximum uncertainty)
        """
        # Avoid log(0)
        probs = np.clip(probabilities, 1e-10, 1.0)
        entropy = -np.sum(probs * np.log(probs))
        return float(entropy)
    
    def _calculate_prediction_quality(self, probabilities: np.ndarray) -> dict:
        """
        Calculate various metrics to assess prediction quality.
        
        Args:
            probabilities: Array of class probabilities [BUY, HOLD, SELL]
            
        Returns:
            Dictionary with quality metrics
        """
        max_prob = probabilities.max()
        entropy = self._calculate_entropy(probabilities)
        max_entropy = np.log(len(probabilities))  # Maximum possible entropy
        
        # Normalized entropy (0 = certain, 1 = maximum uncertainty)
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
        
        # Prediction margin (difference between top 2 probabilities)
        sorted_probs = np.sort(probabilities)[::-1]
        margin = sorted_probs[0] - sorted_probs[1] if len(sorted_probs) > 1 else sorted_probs[0]
        
        return {
            "entropy": round(entropy, 3),
            "normalized_entropy": round(normalized_entropy, 3),
            "prediction_margin": round(margin * 100, 2),  # As percentage
            "certainty_score": round((1 - normalized_entropy) * 100, 2)  # 0-100 scale
        }

    def predict(self, dataframe: pd.DataFrame, return_all_probs: bool = False) -> dict:
        """
        Make prediction with honest probability reporting.
        
        Args:
            dataframe: Input features DataFrame
            return_all_probs: If True, return probabilities for all classes
            
        Returns:
            Dictionary with prediction results and quality metrics
        """
        if self.model is None or self.encoder is None or self.feature_columns is None:
            self.load_model_artifacts()

        # Filter to feature columns
        dataframe = dataframe[self.feature_columns]

        # Get predictions
        prediction = self.model.predict(dataframe)
        probabilities = self.model.predict_proba(dataframe)[0]
        
        # Get predicted class and confidence
        pred_idx = np.argmax(probabilities)
        label = self.encoder.inverse_transform([pred_idx])[0]
        confidence = float(probabilities[pred_idx]) * 100.0
        
        # Calculate quality metrics
        quality_metrics = self._calculate_prediction_quality(probabilities)
        entropy = quality_metrics["entropy"]
        
        # Determine signal strength
        signal_strength = self._get_signal_strength(confidence, entropy)
        
        # Build result dictionary
        result = {
            "prediction": str(label),
            "confidence": round(confidence, 2),
            "signal_strength": signal_strength,
            "quality_metrics": quality_metrics,
            "recommendation": self._get_recommendation(confidence, signal_strength)
        }
        
        # Add all class probabilities if requested
        if return_all_probs:
            class_probs = {}
            for idx, class_name in enumerate(self.encoder.classes_):
                class_probs[class_name] = round(float(probabilities[idx]) * 100, 2)
            result["all_probabilities"] = class_probs
        
        return result
    
    def _get_recommendation(self, confidence: float, strength: str) -> str:
        """
        Provide trading recommendation based on prediction quality.
        
        Args:
            confidence: Prediction confidence percentage
            strength: Signal strength classification
            
        Returns:
            Recommendation string
        """
        if strength == "STRONG" and confidence >= 65:
            return "Consider action with proper risk management"
        elif strength in ["MODERATE", "WEAK"]:
            return "Low confidence - suggest additional analysis"
        else:
            return "Very uncertain - avoid acting on this signal alone"
    
    def predict_with_risk_assessment(self, dataframe: pd.DataFrame) -> dict:
        """
        Enhanced prediction with risk assessment metrics.
        
        Args:
            dataframe: Input features DataFrame
            
        Returns:
            Dictionary with prediction and risk metrics
        """
        base_prediction = self.predict(dataframe, return_all_probs=True)
        
        # Add risk warnings based on confidence
        confidence = base_prediction["confidence"]
        
        if confidence < 40:
            risk_level = "HIGH"
            warning = "Very uncertain prediction. High risk of incorrect signal."
        elif confidence < 55:
            risk_level = "MODERATE"
            warning = "Moderate uncertainty. Use with caution and additional analysis."
        elif confidence < 70:
            risk_level = "LOW-MODERATE"
            warning = "Reasonable confidence but not guaranteed. Apply risk management."
        else:
            risk_level = "LOW"
            warning = "Higher confidence signal, but markets are unpredictable. Always use stop-loss."
        
        base_prediction["risk_assessment"] = {
            "risk_level": risk_level,
            "warning": warning,
            "disclaimer": "Past patterns do not guarantee future results. Use at your own risk."
        }
        
        return base_prediction
