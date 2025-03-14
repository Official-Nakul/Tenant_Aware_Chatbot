from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
import asyncio  # Needed for async streaming

load_dotenv()

app = FastAPI()

llm = ChatGroq(
    model="mixtral-8x7b-32768",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

@app.post("/chat/")
async def chat_with_robot(request: dict):
    messages = [
        SystemMessage(
            content="You are a smart AI assistant that extracts 'robot_id' and 'action'. "
                    "Output a **valid JSON object** in this format: {'robot_id': '<robot_name>', 'action': '<direction>'}. "
                    "Ensure 'action' contains only 'forward', 'backward', 'left', or 'right'. "
                    "Respond only with the JSON object, nothing else."
        ),
        HumanMessage(content=request["message"]),
    ]

    async def response_stream():
        async for chunk in llm.stream(messages):  # 👈 Streaming AI response
            yield chunk.content  # Yield chunk-by-chunk

    return StreamingResponse(response_stream(), media_type="text/plain")

