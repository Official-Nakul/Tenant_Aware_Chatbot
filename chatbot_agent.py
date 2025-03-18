from fastapi import FastAPI, HTTPException
from langchain_groq import ChatGroq
from langchain.agents import create_react_agent, AgentExecutor, tool
from langchain_core.prompts import PromptTemplate
import requests
import json
import re
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS Middleware to allow all origins (Modify for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@tool
def get_api_data():
    """
    Fetches the list of available APIs stored in the database.
    """
    url = "https://tenant-aware-chatbot-1.onrender.com/api/all"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        return data if isinstance(data, list) else {"error": "Unexpected response format"}
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


# Custom prompt template for JSON output
custom_prompt = """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: your final answer should be formatted as a valid JSON object with this exact structure:

{{
  "api": {{
    "company_name": "name of the API provider",
    "base_url": "the base URL of the API",
    "purpose": "purpose of the API",
    "api_key": "API key if available",
    "headers": {{"key": "value"}},
    "auth_type": "authentication type"
  }},
  "endpoints": [
    {{
      "api_id": "ID of the endpoint",
      "path": "the endpoint path",
      "method": "HTTP method (GET, POST, etc.)",
      "purpose": "purpose of the endpoint",
      "params": {{"key": "value"}},
      "headers": {{"key": "value"}}
    }}
  ]
}}

Begin!

Question: {input}
{agent_scratchpad}
"""

llm = ChatGroq(
    model="mixtral-8x7b-32768",
    temperature=0,
    max_tokens=None,
    timeout=60,
    max_retries=2,
)

# Initialize agent with custom prompt
prompt = PromptTemplate.from_template(custom_prompt)
tools = [get_api_data]
agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)


class QueryRequest(BaseModel):
    input: str


@app.post("/query/")
async def query_api(request: QueryRequest):
    """
    Endpoint to query the chatbot and return structured API details.
    """
    try:
        response = agent_executor.invoke({"input": request.input})
        final_answer = response.get('output', '').replace("\\_", "_")  # Fix escaped underscores

        return json.loads(final_answer)  # Return structured JSON output

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"JSON Decode Error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing response: {e}")
