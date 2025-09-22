import ast
from typing import TypedDict, Annotated, Optional
from langgraph.graph import add_messages, StateGraph, END
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langgraph.checkpoint.memory import MemorySaver
from uuid import uuid4
import json
from rich import print as rprint
from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage, ToolMessage
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # load api keys

model = ChatGroq(model="llama-3.1-8b-instant")  # initialize the model
search_tool = TavilySearch(max_results=4)
tools = [search_tool]
memory = MemorySaver()
llm_with_tools = model.bind_tools(tools=tools)

class State(TypedDict):
    messages: Annotated[list, add_messages]
    
async def model_node(state: State):
    result = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [result]}

async def tools_router(state: State):
    last_message = state["messages"][-1]
    
    if (hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0):
        return "tool_node"
    else:
        return END
    
async def tool_node(state):
    """Custom tool node that handles tool calls from the LLM."""
    # Get the tool calls from the last message 
    tool_calls = state["messages"][-1].tool_calls
    
    # Initialize list to store tool messages 
    tool_messages = []
    
    # Process each tool call
    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]
        
        # Handle the search tool 
        if tool_name == "tavily_search":
            # Execute the search tool with the provided arguments
            search_results = await search_tool.ainvoke(tool_args)
            
            # Create a tool message for this result
            tool_message = ToolMessage(
                content=str(search_results),
                tool_call_id=tool_id,
                name=tool_name
            )
            
            tool_messages.append(tool_message)
    
    # Add the tool messages to the state
    return {"messages": tool_messages}

graph_builder = StateGraph(State)
graph_builder.add_node("model", model_node)
graph_builder.add_node("tool_node", tool_node)
graph_builder.set_entry_point("model")
graph_builder.add_conditional_edges("model", tools_router)
graph_builder.add_edge("tool_node", "model")  # Add this missing edge
graph = graph_builder.compile(checkpointer=memory)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware with settings that match the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type"],
)

def serialise_ai_message_chunk(chunk):
    """Extract content from AI message chunks for streaming."""
    if isinstance(chunk, AIMessageChunk):
        return chunk.content
    elif isinstance(chunk, AIMessage):
        return chunk.content
    elif isinstance(chunk, str):
        return chunk
    else:
        # For other types, try to get content or convert to string
        if hasattr(chunk, 'content'):
            return chunk.content
        return str(chunk)
def truncate(obj, max_len=15):
    """
    Recursively truncate long strings inside dicts/lists.
    """
    if isinstance(obj, dict):
        return {k: truncate(v, max_len) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [truncate(i, max_len) for i in obj]
    elif isinstance(obj, str):
        return obj if len(obj) <= max_len else obj[:max_len] + "..."
    else:
        return obj
    
    
async def generate_chat_response(message: str, checkpoint_id: Optional[str] = None):
    is_new_conversation = checkpoint_id is None
    
    if is_new_conversation:
        new_checkpoint_id = str(uuid4())
        config = {"configurable": {"thread_id": new_checkpoint_id}}
        
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            version="v2",
            config=config
        )
        yield f"data:{{\"type\":\"checkpoint\",\"checkpoint_id\":\"{new_checkpoint_id}\"}}\n\n"
    else:
        config = {"configurable": {"thread_id": checkpoint_id}}
        # Continue existing conversation
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            version="v2",
            config=config
        )
    
    async for event in events:
        event_type = event["event"]
        
        
        
        # Handle streaming content from ChatGroq - use on_chain_stream for the model node
        if event_type == "on_chain_stream" and event.get("name") == "model":
            
            # Extract the AI message from the chunk
            chunk_data = event["data"]["chunk"]
            if "messages" in chunk_data and len(chunk_data["messages"]) > 0:
                ai_message = chunk_data["messages"][0]
                chunk_content = serialise_ai_message_chunk(ai_message)
                # Escape single quotes and newlines for safe JSON parsing
               
                safe_content = str(chunk_content).replace("'", "\\'").replace("\n", "\\n").replace('"', '\\"')
                print("json.dumps(chunk_content)",json.dumps(chunk_content))
                yield f"data: {{\"type\": \"content\", \"content\": {json.dumps(chunk_content)}}}\n\n"

            
        # Handle end of model generation to check for tool calls
        elif event_type == "on_chain_end" and event.get("name") == "model":
            # Check if there are tool calls for search
            output = event["data"].get("output")
            if output and "messages" in output and len(output["messages"]) > 0:
                ai_message = output["messages"][0]
                
                tool_calls = getattr(ai_message, "tool_calls", [])
                search_calls = [call for call in tool_calls if call["name"] == "tavily_search"]
                
                if search_calls:
                    # Signal that a search is starting
                    search_query = search_calls[0]["args"].get("query", "")
                    # Escape quotes and special characters
                    safe_query = search_query.replace('"', '\\"').replace("'", "\\'").replace("\n", "\\n")
                    yield f"data: {{\"type\": \"search_start\", \"query\": \"{safe_query}\"}}\n\n"
        
        # Handle tool completion
        elif event_type == "on_chain_stream" and event.get("name") == "tool_node":
    # Tool output received (tavily_search results)
            chunk = event["data"].get("chunk", {})
            messages = chunk.get("messages", [])

            print(messages)
            for msg in messages:
                if getattr(msg, "name", None) == "tavily_search":
                    try:
                        raw_content = msg.content  # string like "{'query': ... }"

                        # Parse the string into a Python dict (handles single quotes)
                        data = ast.literal_eval(raw_content)

                        # Extract results -> urls
                        results = data.get("results", [])
                        urls = [item["url"] for item in results if isinstance(item, dict) and "url" in item]

                        # Yield JSON
                        urls_json = json.dumps(urls)
                        yield f"data: {{\"type\": \"search_results\", \"urls\": {urls_json}}}\n\n"

                    except Exception as e:
                        yield f"data: {{\"type\": \"search_results\", \"error\": \"{str(e)}\"}}\n\n"

                
    # Send an end event
    yield f"data: {{\"type\": \"end\"}}\n\n"

@app.get("/chat_stream/{message}")
async def chat_stream(message: str, checkpoint_id: Optional[str] = Query(None)):
    return StreamingResponse(
        generate_chat_response(message, checkpoint_id),
        media_type="text/event-stream"
    )

# SSE - server-sent events