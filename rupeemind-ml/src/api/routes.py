import pandas as pd
from fastapi import APIRouter

from src.models.predictor import StockPredictor
from src.api.schemas import StockFeatures

router = APIRouter()


@router.post("/predict")
def predict(stock: StockFeatures):
    predictor = StockPredictor()
    dataframe = pd.DataFrame([stock.model_dump()])
    result = predictor.predict(dataframe)
    return result
