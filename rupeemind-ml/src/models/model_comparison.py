"""
Model Comparison Framework
Compare multiple ML algorithms for stock prediction.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import joblib
import time

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False


class ModelComparison:
    """
    Framework for comparing multiple ML models on the same dataset.
    """
    
    def __init__(self, random_state: int = 42):
        """
        Initialize model comparison framework.
        
        Args:
            random_state: Random seed for reproducibility
        """
        self.random_state = random_state
        self.models = {}
        self.results = {}
        self.trained_models = {}
        
    def register_models(self, model_configs: Optional[Dict] = None):
        """
        Register models for comparison.
        
        Args:
            model_configs: Optional custom model configurations
        """
        if model_configs:
            self.models = model_configs
            return
        
        # Default model configurations
        self.models = {
            'Logistic Regression': LogisticRegression(
                max_iter=1000,
                random_state=self.random_state,
                class_weight='balanced'
            ),
            'Random Forest': RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=self.random_state,
                class_weight='balanced',
                n_jobs=-1
            ),
            'Gradient Boosting': GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=self.random_state
            ),
            'Naive Bayes': GaussianNB()
        }
        
        # Add XGBoost if available
        if XGBOOST_AVAILABLE:
            self.models['XGBoost'] = xgb.XGBClassifier(
                n_estimators=300,
                learning_rate=0.05,
                max_depth=6,
                random_state=self.random_state,
                objective='multi:softprob',
                eval_metric='mlogloss',
                use_label_encoder=False
            )
        
        # Add LightGBM if available
        if LIGHTGBM_AVAILABLE:
            self.models['LightGBM'] = lgb.LGBMClassifier(
                n_estimators=300,
                learning_rate=0.05,
                max_depth=6,
                random_state=self.random_state,
                class_weight='balanced',
                verbose=-1
            )
        
        print(f"✓ Registered {len(self.models)} models for comparison")
        
    def train_and_evaluate(
        self,
        X_train: pd.DataFrame,
        X_val: pd.DataFrame,
        y_train: pd.Series,
        y_val: pd.Series
    ) -> Dict:
        """
        Train all models and evaluate on validation set.
        
        Args:
            X_train: Training features
            X_val: Validation features
            y_train: Training labels
            y_val: Validation labels
            
        Returns:
            Dictionary with results for each model
        """
        print("\n" + "=" * 70)
        print("MODEL COMPARISON: TRAINING AND EVALUATION")
        print("=" * 70)
        
        for model_name, model in self.models.items():
            print(f"\n--- Training {model_name} ---")
            
            start_time = time.time()
            
            try:
                # Train model
                model.fit(X_train, y_train)
                
                # Make predictions
                y_pred = model.predict(X_val)
                y_pred_proba = model.predict_proba(X_val) if hasattr(model, 'predict_proba') else None
                
                # Calculate metrics
                metrics = {
                    'accuracy': accuracy_score(y_val, y_pred),
                    'precision': precision_score(y_val, y_pred, average='weighted', zero_division=0),
                    'recall': recall_score(y_val, y_pred, average='weighted', zero_division=0),
                    'f1': f1_score(y_val, y_pred, average='weighted', zero_division=0),
                    'training_time': time.time() - start_time
                }
                
                # Add confidence metrics if probabilities available
                if y_pred_proba is not None:
                    max_probs = np.max(y_pred_proba, axis=1)
                    metrics['avg_confidence'] = np.mean(max_probs)
                    metrics['median_confidence'] = np.median(max_probs)
                
                self.results[model_name] = metrics
                self.trained_models[model_name] = model
                
                # Print results
                print(f"  Accuracy  : {metrics['accuracy']:.4f}")
                print(f"  Precision : {metrics['precision']:.4f}")
                print(f"  Recall    : {metrics['recall']:.4f}")
                print(f"  F1 Score  : {metrics['f1']:.4f}")
                print(f"  Train Time: {metrics['training_time']:.2f}s")
                if 'avg_confidence' in metrics:
                    print(f"  Avg Conf  : {metrics['avg_confidence']:.4f}")
                
            except Exception as e:
                print(f"  ❌ Error: {e}")
                self.results[model_name] = {'error': str(e)}
        
        return self.results
    
    def get_ranking(self, metric: str = 'f1') -> List[Tuple[str, float]]:
        """
        Get models ranked by a specific metric.
        
        Args:
            metric: Metric to rank by (accuracy, precision, recall, f1)
            
        Returns:
            List of (model_name, score) tuples sorted by score
        """
        rankings = []
        
        for model_name, metrics in self.results.items():
            if 'error' not in metrics and metric in metrics:
                rankings.append((model_name, metrics[metric]))
        
        rankings.sort(key=lambda x: x[1], reverse=True)
        return rankings
    
    def print_comparison_table(self):
        """Print a formatted comparison table."""
        print("\n" + "=" * 70)
        print("MODEL COMPARISON TABLE")
        print("=" * 70)
        
        # Header
        print(f"{'Model':<20} {'Accuracy':<10} {'Precision':<10} {'Recall':<10} {'F1 Score':<10} {'Time(s)':<8}")
        print("-" * 70)
        
        # Sort by F1 score
        rankings = self.get_ranking('f1')
        
        for model_name, _ in rankings:
            metrics = self.results[model_name]
            print(f"{model_name:<20} "
                  f"{metrics['accuracy']:<10.4f} "
                  f"{metrics['precision']:<10.4f} "
                  f"{metrics['recall']:<10.4f} "
                  f"{metrics['f1']:<10.4f} "
                  f"{metrics['training_time']:<8.2f}")
        
        # Errors
        for model_name, metrics in self.results.items():
            if 'error' in metrics:
                print(f"{model_name:<20} ERROR: {metrics['error']}")
        
        print("=" * 70)
    
    def get_best_model(self, metric: str = 'f1') -> Tuple[str, object, Dict]:
        """
        Get the best performing model.
        
        Args:
            metric: Metric to use for selection
            
        Returns:
            Tuple of (model_name, model_object, metrics)
        """
        rankings = self.get_ranking(metric)
        
        if not rankings:
            raise ValueError("No models successfully trained")
        
        best_model_name, best_score = rankings[0]
        best_model = self.trained_models[best_model_name]
        best_metrics = self.results[best_model_name]
        
        return best_model_name, best_model, best_metrics
    
    def save_comparison_results(self, output_path: str = "reports/model_comparison.txt"):
        """
        Save comparison results to file.
        
        Args:
            output_path: Path to save results
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            f.write("=" * 70 + "\n")
            f.write("MODEL COMPARISON RESULTS\n")
            f.write("=" * 70 + "\n\n")
            
            # Rankings
            f.write("RANKING BY F1 SCORE\n")
            f.write("-" * 70 + "\n")
            
            rankings = self.get_ranking('f1')
            for rank, (model_name, score) in enumerate(rankings, 1):
                f.write(f"{rank}. {model_name}: {score:.4f}\n")
            
            f.write("\n\nDETAILED METRICS\n")
            f.write("-" * 70 + "\n\n")
            
            for model_name, metrics in self.results.items():
                f.write(f"{model_name}:\n")
                for metric_name, value in metrics.items():
                    if metric_name != 'error':
                        f.write(f"  {metric_name}: {value}\n")
                f.write("\n")
        
        print(f"\n✓ Comparison results saved to {output_path}")
    
    def save_best_model(
        self,
        output_dir: str = "saved_models",
        metric: str = 'f1'
    ):
        """
        Save the best performing model.
        
        Args:
            output_dir: Directory to save model
            metric: Metric to use for selection
        """
        best_name, best_model, best_metrics = self.get_best_model(metric)
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = output_dir / f"best_model_{best_name.lower().replace(' ', '_')}.pkl"
        joblib.dump(best_model, model_path)
        
        # Save model info
        info_path = output_dir / "best_model_info.txt"
        with open(info_path, 'w') as f:
            f.write(f"Best Model: {best_name}\n")
            f.write(f"Selection Metric: {metric}\n\n")
            f.write("Performance Metrics:\n")
            for metric_name, value in best_metrics.items():
                f.write(f"  {metric_name}: {value}\n")
        
        print(f"\n✓ Best model ({best_name}) saved to {model_path}")
        print(f"  F1 Score: {best_metrics['f1']:.4f}")


class EnsembleModel:
    """
    Ensemble multiple models using voting or stacking.
    """
    
    def __init__(self, models: Dict, voting: str = 'soft'):
        """
        Initialize ensemble.
        
        Args:
            models: Dictionary of {name: model} pairs
            voting: 'soft' (probability voting) or 'hard' (majority voting)
        """
        self.models = models
        self.voting = voting
        
    def fit(self, X_train: pd.DataFrame, y_train: pd.Series):
        """Train all models in the ensemble."""
        print(f"\nTraining ensemble with {len(self.models)} models...")
        
        for name, model in self.models.items():
            print(f"  Training {name}...")
            model.fit(X_train, y_train)
        
        print("✓ Ensemble training complete")
        
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make ensemble predictions."""
        if self.voting == 'soft':
            return self._predict_soft(X)
        else:
            return self._predict_hard(X)
    
    def _predict_soft(self, X: pd.DataFrame) -> np.ndarray:
        """Soft voting: average probabilities."""
        all_probas = []
        
        for model in self.models.values():
            if hasattr(model, 'predict_proba'):
                probas = model.predict_proba(X)
                all_probas.append(probas)
        
        if not all_probas:
            raise ValueError("No models with predict_proba available for soft voting")
        
        # Average probabilities
        avg_probas = np.mean(all_probas, axis=0)
        predictions = np.argmax(avg_probas, axis=1)
        
        return predictions
    
    def _predict_hard(self, X: pd.DataFrame) -> np.ndarray:
        """Hard voting: majority vote."""
        all_predictions = []
        
        for model in self.models.values():
            predictions = model.predict(X)
            all_predictions.append(predictions)
        
        # Stack predictions
        stacked = np.column_stack(all_predictions)
        
        # Majority vote
        from scipy import stats
        predictions = stats.mode(stacked, axis=1)[0].flatten()
        
        return predictions
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Get ensemble probability predictions."""
        all_probas = []
        
        for model in self.models.values():
            if hasattr(model, 'predict_proba'):
                probas = model.predict_proba(X)
                all_probas.append(probas)
        
        if not all_probas:
            raise ValueError("No models with predict_proba available")
        
        # Average probabilities
        avg_probas = np.mean(all_probas, axis=0)
        
        return avg_probas


def run_model_comparison(
    X_train: pd.DataFrame,
    X_val: pd.DataFrame,
    y_train: pd.Series,
    y_val: pd.Series,
    save_results: bool = True
) -> Dict:
    """
    Convenience function to run complete model comparison.
    
    Args:
        X_train: Training features
        X_val: Validation features
        y_train: Training labels
        y_val: Validation labels
        save_results: Whether to save results to file
        
    Returns:
        Dictionary with comparison results
    """
    comparison = ModelComparison()
    comparison.register_models()
    results = comparison.train_and_evaluate(X_train, X_val, y_train, y_val)
    comparison.print_comparison_table()
    
    if save_results:
        comparison.save_comparison_results()
        comparison.save_best_model()
    
    return results
