"""
Main Application

This module sets up the FastAPI application and includes all routes.
"""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from .api.endpoints import router as api_router

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the FastAPI app
app = FastAPI(
    title="GannSq9 API",
    description="API for calculating Gann Square of 9 trading levels",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include the API router
app.include_router(api_router, prefix="/api")


# Add a global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"}
    )


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to the GannSq9 API",
        "docs": "/docs",
        "api": "/api"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Run the application if executed directly
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True) 