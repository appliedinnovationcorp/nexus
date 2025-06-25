"""Authentication Service API"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uvicorn

from ..application.dtos import TokenValidationResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Authentication Service initialized")
    yield
    logger.info("Authentication Service shutdown")


app = FastAPI(
    title="AIC Nexus - Authentication Service",
    description="Authentication and authorization microservice",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "authentication"}


@app.post("/api/v1/auth/validate", response_model=TokenValidationResponse)
async def validate_token(authorization: Optional[str] = Header(None)):
    # TODO: Implement full token validation
    return TokenValidationResponse(valid=False)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
