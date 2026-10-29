"""
Risk Management Features for Trading
Including position sizing, stop-loss calculation, and risk metrics.
"""
import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple
from enum import Enum


class RiskLevel(Enum):
    """Risk level classifications."""
    VERY_LOW = 1
    LOW = 2
    MODERATE = 3
    HIGH = 4
    VERY_HIGH = 5


class PositionSizingMethod(Enum):
    """Position sizing methods."""
    FIXED_PERCENTAGE = "fixed_percentage"
    KELLY_CRITERION = "kelly_criterion"
    VOLATILITY_BASED = "volatility_based"
    RISK_PARITY = "risk_parity"


class RiskManager:
    """
    Comprehensive risk management for trading strategies.
    """
    
    def __init__(
        self,
        account_size: float = 100000.0,
        max_risk_per_trade: float = 0.02,  # 2%
        max_portfolio_risk: float = 0.06,   # 6%
        risk_free_rate: float = 0.05        # 5%
    ):
        """
        Initialize risk manager.
        
        Args:
            account_size: Total account value
            max_risk_per_trade: Maximum risk per trade as fraction
            max_portfolio_risk: Maximum total portfolio risk as fraction
            risk_free_rate: Risk-free rate for Sharpe ratio
        """
        self.account_size = account_size
        self.max_risk_per_trade = max_risk_per_trade
        self.max_portfolio_risk = max_portfolio_risk
        self.risk_free_rate = risk_free_rate
        
    def calculate_position_size(
        self,
        entry_price: float,
        stop_loss: float,
        method: PositionSizingMethod = PositionSizingMethod.FIXED_PERCENTAGE,
        win_probability: Optional[float] = None,
        volatility: Optional[float] = None
    ) -> Dict:
        """
        Calculate optimal position size.
        
        Args:
            entry_price: Planned entry price
            stop_loss: Stop-loss price
            method: Position sizing method
            win_probability: Win probability for Kelly criterion
            volatility: Price volatility for volatility-based sizing
            
        Returns:
            Dictionary with position size details
        """
        risk_per_share = abs(entry_price - stop_loss)
        
        if risk_per_share == 0:
            return {
                'position_size': 0,
                'shares': 0,
                'risk_amount': 0,
                'method': method.value,
                'warning': 'Stop-loss equals entry price'
            }
        
        # Maximum risk amount
        max_risk_amount = self.account_size * self.max_risk_per_trade
        
        if method == PositionSizingMethod.FIXED_PERCENTAGE:
            shares = int(max_risk_amount / risk_per_share)
            
        elif method == PositionSizingMethod.KELLY_CRITERION:
            if win_probability is None:
                win_probability = 0.55  # Default
            
            # Kelly formula: f = (bp - q) / b
            # where b = odds, p = win prob, q = loss prob
            win_loss_ratio = 1.5  # Assume 1.5:1 reward/risk
            kelly_fraction = (win_loss_ratio * win_probability - (1 - win_probability)) / win_loss_ratio
            kelly_fraction = max(0, min(kelly_fraction, 0.25))  # Cap at 25%
            
            # Apply Kelly fraction to risk
            kelly_risk = max_risk_amount * kelly_fraction
            shares = int(kelly_risk / risk_per_share)
            
        elif method == PositionSizingMethod.VOLATILITY_BASED:
            if volatility is None:
                volatility = 0.02  # Default 2%
            
            # Inverse volatility weighting
            volatility_adjustment = 0.02 / max(volatility, 0.01)
            adjusted_risk = max_risk_amount * min(volatility_adjustment, 1.0)
            shares = int(adjusted_risk / risk_per_share)
            
        else:  # RISK_PARITY
            shares = int(max_risk_amount / risk_per_share)
        
        # Calculate actual values
        shares = max(1, shares)  # At least 1 share
        position_value = shares * entry_price
        actual_risk = shares * risk_per_share
        risk_percentage = (actual_risk / self.account_size) * 100
        
        # Check if position is too large
        max_position_value = self.account_size * 0.2  # Max 20% per position
        if position_value > max_position_value:
            shares = int(max_position_value / entry_price)
            position_value = shares * entry_price
            actual_risk = shares * risk_per_share
            risk_percentage = (actual_risk / self.account_size) * 100
        
        return {
            'method': method.value,
            'shares': shares,
            'position_value': round(position_value, 2),
            'risk_amount': round(actual_risk, 2),
            'risk_percentage': round(risk_percentage, 2),
            'risk_per_share': round(risk_per_share, 2),
            'max_position_check': position_value <= max_position_value
        }
    
    def calculate_stop_loss(
        self,
        entry_price: float,
        method: str = 'atr',
        atr: Optional[float] = None,
        support_level: Optional[float] = None,
        fixed_percentage: float = 0.02
    ) -> Dict:
        """
        Calculate stop-loss levels.
        
        Args:
            entry_price: Entry price
            method: 'atr', 'support', 'fixed_percentage'
            atr: Average True Range value
            support_level: Support level price
            fixed_percentage: Fixed stop-loss percentage
            
        Returns:
            Dictionary with stop-loss details
        """
        if method == 'atr' and atr is not None:
            # ATR-based stop: entry - (2 * ATR)
            stop_loss = entry_price - (2 * atr)
            stop_method = "ATR-based (2x ATR)"
            
        elif method == 'support' and support_level is not None:
            # Support-based stop: slightly below support
            stop_loss = support_level * 0.98  # 2% below support
            stop_method = "Support-based"
            
        else:  # fixed_percentage
            stop_loss = entry_price * (1 - fixed_percentage)
            stop_method = f"Fixed {fixed_percentage*100}%"
        
        # Calculate metrics
        stop_distance = entry_price - stop_loss
        stop_distance_pct = (stop_distance / entry_price) * 100
        
        # Risk/Reward calculation (assuming 2:1 target)
        take_profit = entry_price + (2 * stop_distance)
        risk_reward_ratio = 2.0
        
        return {
            'stop_loss': round(stop_loss, 2),
            'stop_distance': round(stop_distance, 2),
            'stop_distance_pct': round(stop_distance_pct, 2),
            'take_profit': round(take_profit, 2),
            'risk_reward_ratio': risk_reward_ratio,
            'method': stop_method
        }
    
    def calculate_risk_metrics(
        self,
        predictions: np.ndarray,
        confidences: np.ndarray,
        returns: Optional[np.ndarray] = None
    ) -> Dict:
        """
        Calculate risk metrics for a series of predictions.
        
        Args:
            predictions: Array of predictions
            confidences: Array of confidence scores
            returns: Optional array of actual returns
            
        Returns:
            Dictionary with risk metrics
        """
        metrics = {
            'avg_confidence': float(np.mean(confidences)),
            'confidence_std': float(np.std(confidences)),
            'low_confidence_rate': float(np.mean(confidences < 0.5)),
            'high_confidence_rate': float(np.mean(confidences > 0.7))
        }
        
        if returns is not None:
            metrics['sharpe_ratio'] = self._calculate_sharpe(returns)
            metrics['max_drawdown'] = self._calculate_max_drawdown(returns)
            metrics['win_rate'] = float(np.mean(returns > 0))
            metrics['avg_return'] = float(np.mean(returns))
            metrics['return_std'] = float(np.std(returns))
        
        return metrics
    
    def assess_trade_risk(
        self,
        signal: str,
        confidence: float,
        entry_price: float,
        stop_loss: float,
        volatility: float,
        market_regime: str = "neutral"
    ) -> Dict:
        """
        Comprehensive risk assessment for a trade.
        
        Args:
            signal: BUY, SELL, or HOLD
            confidence: Model confidence (0-1)
            entry_price: Entry price
            stop_loss: Stop-loss price
            volatility: Current volatility
            market_regime: bull, bear, or neutral
            
        Returns:
            Dictionary with risk assessment
        """
        # Base risk score
        risk_score = 50.0
        
        # Adjust for confidence
        if confidence < 0.4:
            risk_score += 30
        elif confidence < 0.6:
            risk_score += 15
        elif confidence > 0.8:
            risk_score -= 10
        
        # Adjust for stop-loss distance
        stop_distance_pct = abs(entry_price - stop_loss) / entry_price * 100
        if stop_distance_pct > 5:
            risk_score += 20
        elif stop_distance_pct < 2:
            risk_score -= 5
        
        # Adjust for volatility
        if volatility > 0.03:  # High volatility (>3%)
            risk_score += 15
        elif volatility < 0.01:  # Low volatility
            risk_score -= 5
        
        # Adjust for market regime
        if market_regime == "bear" and signal == "BUY":
            risk_score += 10
        elif market_regime == "bull" and signal == "SELL":
            risk_score += 10
        
        # Normalize to 0-100
        risk_score = np.clip(risk_score, 0, 100)
        
        # Classify risk level
        if risk_score < 30:
            risk_level = RiskLevel.VERY_LOW
            recommendation = "Low risk - suitable for most traders"
        elif risk_score < 45:
            risk_level = RiskLevel.LOW
            recommendation = "Moderate-low risk - acceptable with proper sizing"
        elif risk_score < 60:
            risk_level = RiskLevel.MODERATE
            recommendation = "Moderate risk - use caution and tight stops"
        elif risk_score < 75:
            risk_level = RiskLevel.HIGH
            recommendation = "High risk - reduce position size or avoid"
        else:
            risk_level = RiskLevel.VERY_HIGH
            recommendation = "Very high risk - strongly consider avoiding"
        
        # Calculate suggested position size adjustment
        if risk_score < 50:
            position_multiplier = 1.0
        else:
            # Reduce position size for higher risk
            position_multiplier = max(0.25, 1.0 - (risk_score - 50) / 100)
        
        return {
            'risk_score': round(risk_score, 1),
            'risk_level': risk_level.name,
            'recommendation': recommendation,
            'position_multiplier': round(position_multiplier, 2),
            'confidence_component': round(confidence * 100, 1),
            'volatility_component': round(volatility * 100, 1),
            'stop_distance_pct': round(stop_distance_pct, 1)
        }
    
    def _calculate_sharpe(self, returns: np.ndarray) -> float:
        """Calculate Sharpe ratio."""
        if len(returns) == 0:
            return 0.0
        
        excess_returns = returns - self.risk_free_rate / 252  # Daily risk-free rate
        if np.std(excess_returns) == 0:
            return 0.0
        
        sharpe = np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)
        return float(sharpe)
    
    def _calculate_max_drawdown(self, returns: np.ndarray) -> float:
        """Calculate maximum drawdown."""
        if len(returns) == 0:
            return 0.0
        
        cumulative = np.cumprod(1 + returns)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = (cumulative - running_max) / running_max
        max_dd = float(np.min(drawdown))
        
        return max_dd
    
    def generate_trade_plan(
        self,
        symbol: str,
        signal: str,
        confidence: float,
        current_price: float,
        atr: Optional[float] = None,
        support_level: Optional[float] = None,
        volatility: float = 0.02
    ) -> Dict:
        """
        Generate a complete trade plan with risk management.
        
        Args:
            symbol: Stock symbol
            signal: BUY, SELL, or HOLD
            confidence: Model confidence
            current_price: Current stock price
            atr: Average True Range
            support_level: Support level
            volatility: Current volatility
            
        Returns:
            Complete trade plan with risk parameters
        """
        if signal == "HOLD":
            return {
                'symbol': symbol,
                'signal': 'HOLD',
                'recommendation': 'No trade recommended',
                'confidence': round(confidence * 100, 2)
            }
        
        # Calculate stop-loss
        stop_info = self.calculate_stop_loss(
            entry_price=current_price,
            method='atr' if atr else 'fixed_percentage',
            atr=atr,
            support_level=support_level,
            fixed_percentage=0.02
        )
        
        # Calculate position size
        position_info = self.calculate_position_size(
            entry_price=current_price,
            stop_loss=stop_info['stop_loss'],
            method=PositionSizingMethod.VOLATILITY_BASED,
            volatility=volatility,
            win_probability=confidence
        )
        
        # Risk assessment
        risk_assessment = self.assess_trade_risk(
            signal=signal,
            confidence=confidence,
            entry_price=current_price,
            stop_loss=stop_info['stop_loss'],
            volatility=volatility
        )
        
        # Adjust position size based on risk
        adjusted_shares = int(position_info['shares'] * risk_assessment['position_multiplier'])
        adjusted_position_value = adjusted_shares * current_price
        
        return {
            'symbol': symbol,
            'signal': signal,
            'confidence': round(confidence * 100, 2),
            'entry_price': round(current_price, 2),
            'stop_loss': stop_info['stop_loss'],
            'take_profit': stop_info['take_profit'],
            'position_size': {
                'shares': adjusted_shares,
                'value': round(adjusted_position_value, 2),
                'percentage_of_portfolio': round((adjusted_position_value / self.account_size) * 100, 2)
            },
            'risk_metrics': {
                'risk_amount': round(adjusted_shares * stop_info['stop_distance'], 2),
                'risk_percentage': round((adjusted_shares * stop_info['stop_distance'] / self.account_size) * 100, 2),
                'risk_reward_ratio': stop_info['risk_reward_ratio'],
                'stop_distance_pct': stop_info['stop_distance_pct']
            },
            'risk_assessment': risk_assessment,
            'warnings': self._generate_warnings(risk_assessment, confidence, signal)
        }
    
    def _generate_warnings(
        self,
        risk_assessment: Dict,
        confidence: float,
        signal: str
    ) -> List[str]:
        """Generate warning messages for the trade."""
        warnings = []
        
        if confidence < 0.5:
            warnings.append("⚠ Low confidence prediction - consider avoiding trade")
        
        if risk_assessment['risk_level'] in ['HIGH', 'VERY_HIGH']:
            warnings.append(f"⚠ {risk_assessment['risk_level']} risk trade")
        
        if risk_assessment['position_multiplier'] < 0.5:
            warnings.append("⚠ Position size heavily reduced due to risk")
        
        if signal == "SELL":
            warnings.append("ℹ Short positions carry unlimited risk - use tight stops")
        
        if not warnings:
            warnings.append("✓ Trade parameters within acceptable risk limits")
        
        return warnings


def create_trade_plan(
    symbol: str,
    prediction_result: Dict,
    current_price: float,
    account_size: float = 100000.0,
    atr: Optional[float] = None,
    support_level: Optional[float] = None
) -> Dict:
    """
    Convenience function to create a trade plan from prediction results.
    
    Args:
        symbol: Stock symbol
        prediction_result: Result from StockPredictor.predict()
        current_price: Current stock price
        account_size: Account size
        atr: Average True Range
        support_level: Support level
        
    Returns:
        Complete trade plan
    """
    risk_manager = RiskManager(account_size=account_size)
    
    signal = prediction_result['prediction']
    confidence = prediction_result['confidence'] / 100.0  # Convert to 0-1
    volatility = prediction_result.get('quality_metrics', {}).get('normalized_entropy', 0.5) / 2
    
    return risk_manager.generate_trade_plan(
        symbol=symbol,
        signal=signal,
        confidence=confidence,
        current_price=current_price,
        atr=atr,
        support_level=support_level,
        volatility=volatility
    )
