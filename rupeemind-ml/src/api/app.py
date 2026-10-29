from fastapi import FastAPI

from src.api.routes import router

app = FastAPI(
    title="RupeeMind ML API",
    version="1.0.0"
)

app.include_router(router)


@app.get("/")
def home():

    return {
        "message": "RupeeMind ML API Running Successfully"
    }
