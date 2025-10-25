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
    value: Optional[str] = None
    feedback_id: Optional[UUID] = None
    comment: Optional[str] = None
    source_info: Optional[dict] = None

@app.post("/feedback")
async def create_feedback(body: SendFeedbackBody):
    try:
        fb = client.create_feedback(
            run_id=body.run_id,
            key=body.key,
            score=body.score,
            value=body.value,
            comment=body.comment,
            feedback_id=body.feedback_id,
            source_info=body.source_info,
        )
        return {"result": "success", "code": 200, "id": str(fb.id)}
    except Exception as e:
        return {"result": f"error: {e}", "code": 500}

class UpdateFeedbackBody(BaseModel):
    feedback_id: UUID
    score: Union[float, int, bool, None] = None
    value: Optional[str] = None
    comment: Optional[str] = None
    source_info: Optional[dict] = None

@app.patch("/feedback")
async def update_feedback(body: UpdateFeedbackBody):
    try:
        fb = client.update_feedback(
            body.feedback_id,
            score=body.score,
            value=body.value,
            comment=body.comment,
            source_info=body.source_info,
        )
        return {"result": "success", "code": 200, "id": str(fb.id)}
    except Exception as e:
        return {"result": f"error: {e}", "code": 500}

@app.get("/")
async def root():
    return {"message": "API is running"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)