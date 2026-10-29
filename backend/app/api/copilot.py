from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.copilot import ChatRequest, ChatResponse
from app.ai.copilot import run_copilot

router = APIRouter(prefix="/copilot", tags=["Copilot"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_copilot(payload: ChatRequest, db: Session = Depends(get_db)):
    result = await run_copilot(
        query=payload.query,
        history=payload.history or [],
        db=db
    )
    return ChatResponse(
        reply=result["reply"],
        tools_executed=result.get("tools_executed", []),
        suggested_action=result.get("suggested_action")
    )
