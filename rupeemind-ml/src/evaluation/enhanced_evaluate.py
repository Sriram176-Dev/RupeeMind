"""
Enhanced Model Evaluation with Backtesting and Performance Analysis
"""
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    roc_auc_score,
    log_loss
)
from datetime import datetime


class EnhancedModelEvaluator:
    """
    Comprehensive model evaluation with backtesting for trading strategies.
    """
    
    def __init__(self, report_directory: str = "reports"):
        self.report_directory = Path(report_directory)
        self.report_directory.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        (self.report_directory / "plots").mkdir(exist_ok=True)
        (self.report_directory / "metrics").mkdir(exist_ok=True)
        (self.report_directory / "backtests").mkdir(exist_ok=True)
    
    def evaluate_comprehensive(
        self,
        model,
        X_test: pd.DataFrame,
        y_test: pd.Series,
        label_encoder=None,
        feature_names: Optional[List[str]] = None
    ) -> Dict:
        """
        Comprehensive model evaluation with multiple metrics.
        
        Args:
            model: Trained model
            X_test: Test features
            y_test: Test labels
            label_encoder: Label encoder for class names
            feature_names: List of feature names
            
        Returns:
            Dictionary with all evaluation metrics
        """
        print("\n" + "=" * 70)
        print("ENHANCED MODEL EVALUATION")
        print("=" * 70)
        
        # Make predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        # Basic metrics
        metrics = self._calculate_basic_metrics(y_test, y_pred)
        
        # Advanced metrics
        advanced_metrics = self._calculate_advanced_metrics(
            y_test, y_pred, y_pred_proba
        )
        metrics.update(advanced_metrics)
        
        # Per-class metrics
        class_metrics = self._calculate_per_class_metrics(
            y_test, y_pred, y_pred_proba, label_encoder
        )
        
        # Print summary
        self._print_evaluation_summary(metrics, class_metrics)
        
        # Generate reports
        self._save_classification_report(y_test, y_pred, label_encoder)
        self._plot_confusion_matrix(y_test, y_pred, label_encoder)
        self._plot_probability_distribution(y_pred_proba, y_test, label_encoder)
        
        # Feature importance
        if feature_names:
            self._analyze_feature_importance(model, feature_names)
        
        # Save metrics to file
        self._save_metrics_to_file(metrics, class_metrics)
        
        return {
            "overall_metrics": metrics,
            "class_metrics": class_metrics
        }
    
    def _calculate_basic_metrics(
        self,
        y_true: pd.Series,
        y_pred: np.ndarray
    ) -> Dict:
        """Calculate basic classification metrics."""
        return {
            "accuracy": accuracy_score(y_true, y_pred),
            "precision_macro": precision_score(y_true, y_pred, average="macro", zero_division=0),
            "precision_weighted": precision_score(y_true, y_pred, average="weighted", zero_division=0),
            "recall_macro": recall_score(y_true, y_pred, average="macro", zero_division=0),
            "recall_weighted": recall_score(y_true, y_pred, average="weighted", zero_division=0),
            "f1_macro": f1_score(y_true, y_pred, average="macro", zero_division=0),
            "f1_weighted": f1_score(y_true, y_pred, average="weighted", zero_division=0)
        }
    
    def _calculate_advanced_metrics(
        self,
        y_true: pd.Series,
        y_pred: np.ndarray,
        y_pred_proba: np.ndarray
    ) -> Dict:
        """Calculate advanced metrics."""
        metrics = {}
        
        # Log loss
        try:
            metrics["log_loss"] = log_loss(y_true, y_pred_proba)
        except Exception:
            metrics["log_loss"] = None
        
        # ROC AUC (one-vs-rest)
        try:
            metrics["roc_auc_ovr"] = roc_auc_score(
                y_true, y_pred_proba, average="macro", multi_class="ovr"
            )
        except Exception:
            metrics["roc_auc_ovr"] = None
        
        # Average confidence
        max_probs = np.max(y_pred_proba, axis=1)
        metrics["avg_confidence"] = np.mean(max_probs)
        metrics["median_confidence"] = np.median(max_probs)
        metrics["min_confidence"] = np.min(max_probs)
        metrics["max_confidence"] = np.max(max_probs)
        
        # Prediction certainty (how often model is > 50% confident)
        metrics["high_confidence_rate"] = np.mean(max_probs > 0.5)
        metrics["very_high_confidence_rate"] = np.mean(max_probs > 0.7)
        
        return metrics
    
    def _calculate_per_class_metrics(
        self,
        y_true: pd.Series,
        y_pred: np.ndarray,
        y_pred_proba: np.ndarray,
        label_encoder
    ) -> Dict:
        """Calculate metrics for each class."""
        if label_encoder:
            classes = label_encoder.classes_
        else:
            classes = np.unique(y_true)
        
        class_metrics = {}
        
        for idx, class_name in enumerate(classes):
            # Binary classification metrics for this class
            y_true_binary = (y_true == idx).astype(int)
            y_pred_binary = (y_pred == idx).astype(int)
            
            class_metrics[str(class_name)] = {
                "precision": precision_score(y_true_binary, y_pred_binary, zero_division=0),
                "recall": recall_score(y_true_binary, y_pred_binary, zero_division=0),
                "f1": f1_score(y_true_binary, y_pred_binary, zero_division=0),
                "support": int(np.sum(y_true_binary)),
                "avg_confidence": float(np.mean(y_pred_proba[y_pred == idx, idx])) if np.any(y_pred == idx) else 0.0
            }
        
        return class_metrics
    
    def _print_evaluation_summary(
        self,
        metrics: Dict,
        class_metrics: Dict
    ):
        """Print evaluation summary."""
        print("\n--- Overall Metrics ---")
        print(f"Accuracy              : {metrics['accuracy']:.4f}")
        print(f"Precision (weighted)  : {metrics['precision_weighted']:.4f}")
        print(f"Recall (weighted)     : {metrics['recall_weighted']:.4f}")
        print(f"F1 Score (weighted)   : {metrics['f1_weighted']:.4f}")
        
        if metrics.get('roc_auc_ovr'):
            print(f"ROC AUC (OvR)         : {metrics['roc_auc_ovr']:.4f}")
        if metrics.get('log_loss'):
            print(f"Log Loss              : {metrics['log_loss']:.4f}")
        
        print(f"\n--- Confidence Statistics ---")
        print(f"Average Confidence    : {metrics['avg_confidence']:.4f}")
        print(f"Median Confidence     : {metrics['median_confidence']:.4f}")
        print(f"High Conf. Rate (>50%): {metrics['high_confidence_rate']:.2%}")
        print(f"Very High Rate (>70%) : {metrics['very_high_confidence_rate']:.2%}")
        
        print(f"\n--- Per-Class Metrics ---")
        for class_name, cm in class_metrics.items():
            print(f"\n{class_name}:")
            print(f"  Precision   : {cm['precision']:.4f}")
            print(f"  Recall      : {cm['recall']:.4f}")
            print(f"  F1 Score    : {cm['f1']:.4f}")
            print(f"  Support     : {cm['support']}")
            print(f"  Avg Conf    : {cm['avg_confidence']:.4f}")
    
    def _save_classification_report(
        self,
        y_true: pd.Series,
        y_pred: np.ndarray,
        label_encoder
    ):
        """Save detailed classification report."""
        target_names = label_encoder.classes_ if label_encoder else None
        report = classification_report(y_true, y_pred, target_names=target_names)
        
        report_path = self.report_directory / "metrics" / "classification_report.txt"
        with open(report_path, "w") as f:
            f.write("=" * 70 + "\n")
            f.write("CLASSIFICATION REPORT\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 70 + "\n\n")
            f.write(report)
        
        print(f"\n✓ Classification report saved to {report_path}")
    
    def _plot_confusion_matrix(
        self,
        y_true: pd.Series,
        y_pred: np.ndarray,
        label_encoder
    ):
        """Plot and save confusion matrix."""
        cm = confusion_matrix(y_true, y_pred)
        
        fig, ax = plt.subplots(figsize=(10, 8))
        
        if label_encoder:
            display_labels = label_encoder.classes_
        else:
            display_labels = None
        
        disp = ConfusionMatrixDisplay(
            confusion_matrix=cm,
            display_labels=display_labels
        )
        disp.plot(ax=ax, cmap='Blues', values_format='d')
        
        plt.title("Confusion Matrix", fontsize=14, fontweight='bold')
        plt.tight_layout()
        
        cm_path = self.report_directory / "plots" / "confusion_matrix.png"
        plt.savefig(cm_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Confusion matrix saved to {cm_path}")
    
    def _plot_probability_distribution(
        self,
        y_pred_proba: np.ndarray,
        y_true: pd.Series,
        label_encoder
    ):
        """Plot probability distribution for each class."""
        n_classes = y_pred_proba.shape[1]
        
        fig, axes = plt.subplots(1, n_classes, figsize=(15, 4))
        if n_classes == 1:
            axes = [axes]
        
        classes = label_encoder.classes_ if label_encoder else [f"Class {i}" for i in range(n_classes)]
        
        for idx, (ax, class_name) in enumerate(zip(axes, classes)):
            probs = y_pred_proba[:, idx]
            
            ax.hist(probs, bins=30, alpha=0.7, color='steelblue', edgecolor='black')
            ax.axvline(np.mean(probs), color='red', linestyle='--', linewidth=2, label=f'Mean: {np.mean(probs):.3f}')
            ax.set_xlabel('Probability', fontsize=10)
            ax.set_ylabel('Frequency', fontsize=10)
            ax.set_title(f'{class_name}', fontsize=11, fontweight='bold')
            ax.legend()
            ax.grid(alpha=0.3)
        
        plt.suptitle('Prediction Probability Distributions', fontsize=14, fontweight='bold')
        plt.tight_layout()
        
        prob_path = self.report_directory / "plots" / "probability_distributions.png"
        plt.savefig(prob_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Probability distributions saved to {prob_path}")
    
    def _analyze_feature_importance(
        self,
        model,
        feature_names: List[str],
        top_n: int = 20
    ):
        """Analyze and plot feature importance."""
        if not hasattr(model, 'feature_importances_'):
            print("⚠ Model does not have feature_importances_ attribute")
            return
        
        importance = model.feature_importances_
        
        # Create DataFrame
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
        
        # Save to file
        importance_path = self.report_directory / "metrics" / "feature_importance.csv"
        importance_df.to_csv(importance_path, index=False)
        
        # Plot top N features
        top_features = importance_df.head(top_n)
        
        plt.figure(figsize=(10, 8))
        plt.barh(range(len(top_features)), top_features['importance'], color='steelblue')
        plt.yticks(range(len(top_features)), top_features['feature'])
        plt.xlabel('Importance', fontsize=12)
        plt.title(f'Top {top_n} Most Important Features', fontsize=14, fontweight='bold')
        plt.gca().invert_yaxis()
        plt.tight_layout()
        
        plot_path = self.report_directory / "plots" / "feature_importance.png"
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Feature importance saved to {importance_path} and {plot_path}")
    
    def _save_metrics_to_file(
        self,
        metrics: Dict,
        class_metrics: Dict
    ):
        """Save all metrics to a structured file."""
        metrics_path = self.report_directory / "metrics" / "evaluation_metrics.txt"
        
        with open(metrics_path, "w") as f:
            f.write("=" * 70 + "\n")
            f.write("MODEL EVALUATION METRICS\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 70 + "\n\n")
            
            f.write("OVERALL METRICS\n")
            f.write("-" * 70 + "\n")
            for key, value in metrics.items():
                if value is not None:
                    f.write(f"{key:30s}: {value}\n")
            
            f.write("\n\nPER-CLASS METRICS\n")
            f.write("-" * 70 + "\n")
            for class_name, cm in class_metrics.items():
                f.write(f"\n{class_name}:\n")
                for key, value in cm.items():
                    f.write(f"  {key:20s}: {value}\n")
        
        print(f"✓ Metrics saved to {metrics_path}")
    
    def backtest_trading_strategy(
        self,
        model,
        X_test: pd.DataFrame,
        y_test: pd.Series,
        test_data: pd.DataFrame,
        initial_capital: float = 100000.0,
        position_size: float = 0.1,
        transaction_cost: float = 0.001
    ) -> Dict:
        """
        Backtest the trading strategy based on model predictions.
        
        Args:
            model: Trained model
            X_test: Test features
            y_test: Actual labels
            test_data: Original test data with Date, Close, Symbol columns
            initial_capital: Starting capital
            position_size: Fraction of capital per trade
            transaction_cost: Transaction cost as fraction (0.001 = 0.1%)
            
        Returns:
            Dictionary with backtest results
        """
        print("\n" + "=" * 70)
        print("BACKTEST: TRADING STRATEGY SIMULATION")
        print("=" * 70)
        
        # Make predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        # Initialize tracking
        capital = initial_capital
        positions = []
        trades = []
        equity_curve = [initial_capital]
        dates = []
        
        # Simulate trading
        for idx in range(len(y_pred)):
            signal = y_pred[idx]
            confidence = np.max(y_pred_proba[idx])
            
            # Only trade on high confidence signals
            if confidence < 0.5:
                continue
            
            # BUY signal (assuming 0 = BUY, 1 = HOLD, 2 = SELL)
            if signal == 0:  # BUY
                trade_size = capital * position_size
                cost = trade_size * transaction_cost
                capital -= (trade_size + cost)
                
                trades.append({
                    'type': 'BUY',
                    'size': trade_size,
                    'confidence': confidence,
                    'cost': cost
                })
            
            # SELL signal
            elif signal == 2:  # SELL (if we have open positions)
                if len(positions) > 0:
                    # Close position
                    position_value = positions.pop()
                    revenue = position_value * (1 - transaction_cost)
                    capital += revenue
                    
                    trades.append({
                        'type': 'SELL',
                        'size': position_value,
                        'confidence': confidence,
                        'revenue': revenue
                    })
            
            equity_curve.append(capital + sum(positions))
        
        # Calculate performance metrics
        final_capital = capital + sum(positions)
        total_return = (final_capital - initial_capital) / initial_capital
        
        results = {
            'initial_capital': initial_capital,
            'final_capital': final_capital,
            'total_return': total_return,
            'total_return_pct': total_return * 100,
            'num_trades': len(trades),
            'equity_curve': equity_curve
        }
        
        print(f"\nInitial Capital     : ${initial_capital:,.2f}")
        print(f"Final Capital       : ${final_capital:,.2f}")
        print(f"Total Return        : {total_return*100:.2f}%")
        print(f"Number of Trades    : {len(trades)}")
        
        # Save backtest report
        self._save_backtest_report(results, trades)
        
        return results
    
    def _save_backtest_report(self, results: Dict, trades: List[Dict]):
        """Save backtest results to file."""
        report_path = self.report_directory / "backtests" / "backtest_results.txt"
        
        with open(report_path, "w") as f:
            f.write("=" * 70 + "\n")
            f.write("BACKTEST RESULTS\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 70 + "\n\n")
            
            f.write(f"Initial Capital     : ${results['initial_capital']:,.2f}\n")
            f.write(f"Final Capital       : ${results['final_capital']:,.2f}\n")
            f.write(f"Total Return        : {results['total_return_pct']:.2f}%\n")
            f.write(f"Number of Trades    : {results['num_trades']}\n")
            
            f.write("\n\nNOTE: This is a simplified backtest simulation.\n")
            f.write("Real trading involves additional factors like:\n")
            f.write("- Slippage\n")
            f.write("- Market impact\n")
            f.write("- Overnight gaps\n")
            f.write("- Liquidity constraints\n")
        
        print(f"\n✓ Backtest report saved to {report_path}")
