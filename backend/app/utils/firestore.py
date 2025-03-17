"""
Firestore Utility

This module provides functions to interact with Firestore for data persistence.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables
db = None
initialized = False


def initialize_firestore() -> bool:
    """
    Initialize the Firestore client.
    
    Returns:
        bool: True if initialization is successful, False otherwise
    """
    global db, initialized
    
    if initialized:
        return True
    
    try:
        # Check for service account key file
        if os.path.exists('serviceAccountKey.json'):
            cred = credentials.Certificate('serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
        else:
            # Try environment variables or default credentials
            firebase_admin.initialize_app()
        
        db = firestore.client()
        initialized = True
        logger.info("Firestore initialized successfully")
        return True
    
    except Exception as e:
        logger.error(f"Error initializing Firestore: {str(e)}")
        return False


def save_ticker(ticker: str, price: float) -> bool:
    """
    Save a ticker and its current price to Firestore.
    
    Args:
        ticker: The ticker symbol
        price: The current price
        
    Returns:
        bool: True if the operation is successful, False otherwise
    """
    if not initialize_firestore():
        return False
    
    try:
        # Create a document reference
        ticker_ref = db.collection('tickers').document(ticker)
        
        # Set the data
        ticker_ref.set({
            'symbol': ticker,
            'price': price,
            'last_updated': firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        logger.info(f"Saved ticker {ticker} with price {price} to Firestore")
        return True
    
    except Exception as e:
        logger.error(f"Error saving ticker {ticker} to Firestore: {str(e)}")
        return False


def get_tickers() -> List[str]:
    """
    Get all tracked ticker symbols from Firestore.
    
    Returns:
        list: List of ticker symbols
    """
    if not initialize_firestore():
        return []
    
    try:
        # Query the tickers collection
        tickers_ref = db.collection('tickers').stream()
        
        # Extract the ticker symbols
        return [doc.id for doc in tickers_ref]
    
    except Exception as e:
        logger.error(f"Error getting tickers from Firestore: {str(e)}")
        return []


def save_gann_levels(
    ticker: str, 
    price: float, 
    sun_angle: float, 
    up_levels: List[float], 
    down_levels: List[float]
) -> bool:
    """
    Save Gann Square of 9 levels for a ticker to Firestore.
    
    Args:
        ticker: The ticker symbol
        price: The current price
        sun_angle: The sun angle used for calculation
        up_levels: List of up levels
        down_levels: List of down levels
        
    Returns:
        bool: True if the operation is successful, False otherwise
    """
    if not initialize_firestore():
        return False
    
    try:
        # Create a document reference
        levels_ref = db.collection('gann_levels').document(ticker)
        
        # Set the data
        levels_ref.set({
            'symbol': ticker,
            'price': price,
            'sun_angle': sun_angle,
            'up_levels': up_levels,
            'down_levels': down_levels,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        logger.info(f"Saved Gann levels for {ticker} to Firestore")
        return True
    
    except Exception as e:
        logger.error(f"Error saving Gann levels for {ticker} to Firestore: {str(e)}")
        return False


def get_gann_levels(ticker: str) -> Optional[Dict[str, Any]]:
    """
    Get Gann Square of 9 levels for a ticker from Firestore.
    
    Args:
        ticker: The ticker symbol
        
    Returns:
        dict: Dictionary containing the Gann levels data, or None if not found
    """
    if not initialize_firestore():
        return None
    
    try:
        # Get the document
        doc_ref = db.collection('gann_levels').document(ticker)
        doc = doc_ref.get()
        
        # Check if the document exists
        if not doc.exists:
            return None
        
        # Return the data
        return doc.to_dict()
    
    except Exception as e:
        logger.error(f"Error getting Gann levels for {ticker} from Firestore: {str(e)}")
        return None


def add_ticker(ticker: str) -> bool:
    """
    Add a ticker to the tracked list.
    
    Args:
        ticker: The ticker symbol
        
    Returns:
        bool: True if the operation is successful, False otherwise
    """
    if not initialize_firestore():
        return False
    
    try:
        # Create a document reference
        ticker_ref = db.collection('tickers').document(ticker)
        
        # Set the data
        ticker_ref.set({
            'symbol': ticker,
            'added_at': firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        logger.info(f"Added ticker {ticker} to tracked list")
        return True
    
    except Exception as e:
        logger.error(f"Error adding ticker {ticker} to tracked list: {str(e)}")
        return False


def remove_ticker(ticker: str) -> bool:
    """
    Remove a ticker from the tracked list.
    
    Args:
        ticker: The ticker symbol
        
    Returns:
        bool: True if the operation is successful, False otherwise
    """
    if not initialize_firestore():
        return False
    
    try:
        # Delete the ticker document
        db.collection('tickers').document(ticker).delete()
        
        # Also delete any Gann levels data
        db.collection('gann_levels').document(ticker).delete()
        
        logger.info(f"Removed ticker {ticker} from tracked list")
        return True
    
    except Exception as e:
        logger.error(f"Error removing ticker {ticker} from tracked list: {str(e)}")
        return False 