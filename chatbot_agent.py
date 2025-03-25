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
import urllib.parse
from typing import Dict, Any, List
import os

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

# Get port from environment variable or use default
BACKEND_PORT = os.getenv("BACKEND_PORT", "5000")
BACKEND_URL = "https://tenant-aware-chatbot-1.onrender.com/api/all"

@tool
def get_api_data():
    """
    Fetches the list of available APIs stored in the database.
    """
    url = f"{BACKEND_URL}/api/all"
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
  "endpoint": {{
    "api_id": "ID of the endpoint",
    "path": "the endpoint path",
    "method": "HTTP method (GET, POST, etc.)",
    "purpose": "purpose of the endpoint",
    "params": {{"key": "value"}},
    "headers": {{"key": "value"}},
    "body": {{"key": "value"}}  // only for POST/PUT requests
  }}
}}

Important Guidelines:
1. Always include the complete base_url and path
2. For POST/PUT requests, include the body structure
3. Include all required headers and parameters
4. Ensure the JSON is valid and properly escaped

Begin!

Question: {input}
{agent_scratchpad}
"""

llm = ChatGroq(
    model="llama3-70b-8192",
    temperature=0,
    max_tokens=None,
    timeout=60,
    max_retries=2,
)

# Initialize agent with custom prompt
prompt = PromptTemplate.from_template(custom_prompt)
tools = [get_api_data]
agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)

class QueryRequest(BaseModel):
    input: str

def extract_json_from_response(response_text: str) -> Dict[str, Any]:
    """Extracts JSON from the agent's response text."""
    try:
        # Try to parse the entire response as JSON first
        return json.loads(response_text)
    except json.JSONDecodeError:
        # If that fails, look for JSON in the response
        json_match = re.search(r'({.*})', response_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError as e:
                raise ValueError(f"Could not parse JSON from response: {e}")
        raise ValueError("No valid JSON found in response")

def call_constructed_api(api_info: Dict[str, Any]) -> Dict[str, Any]:
    """Makes the actual API call based on the constructed API info."""
    try:
        endpoint = api_info["endpoint"]
        full_url = urllib.parse.urljoin(api_info["api"]["base_url"], endpoint["path"])
        
        headers = {}
        if "headers" in api_info["api"]:
            headers.update(api_info["api"]["headers"])
        if "headers" in endpoint:
            headers.update(endpoint["headers"])
        
        params = endpoint.get("params", {})
        body = endpoint.get("body", None)
        
        method = endpoint["method"].upper()
        
        if method == "GET":
            response = requests.get(
                full_url,
                headers=headers,
                params=params
            )
        elif method in ["POST", "PUT", "PATCH"]:
            response = requests.request(
                method,
                full_url,
                headers=headers,
                params=params,
                json=body
            )
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        result = response.json()
        
        # Add a response field to match what the frontend expects
        return {
            "data": result,
            "response": f"Successfully called {method} {endpoint['path']} endpoint from {api_info['api']['company_name']} API."
        }
    except Exception as e:
        return {
            "error": str(e), 
            "details": f"Failed to call API: {full_url}",
            "response": f"Error calling API: {str(e)}"
        }

@app.post("/query/")
async def query_api(request: QueryRequest):
    """
    Endpoint to query the chatbot and return structured API details.
    """
    try:
        # Get the agent's response
        response = agent_executor.invoke({"input": request.input})
        response_text = response.get('output', '')
        
        # Clean and extract JSON from the response
        cleaned_response = response_text.replace("\\_", "_").replace("\\n", "\n")
        api_info = extract_json_from_response(cleaned_response)
        
        # Call the constructed API
        api_response = call_constructed_api(api_info)
        
        return {
            "api_info": api_info,
            "api_response": api_response
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Response parsing error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {e}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)