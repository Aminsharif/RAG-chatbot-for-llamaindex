import asyncio
from typing import Optional, Union
from uuid import UUID

import langsmith
from chain import ChatRequest, answer_chain
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from langsmith import Client
from pydantic import BaseModel

client = Client()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

add_routes(
    app,
    answer_chain,
    path='/chat',
    input_type=ChatRequest,
    config_keys=["metadata","configurable", 'tags'],
)

class SendFeedbackBody(BaseModel):
    run_id: UUID
    key: str = "user_score"

    score: Union[float, int, bool, None] = None
    feedback_id: Optional[UUID] = None
    comment: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "API is running"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)