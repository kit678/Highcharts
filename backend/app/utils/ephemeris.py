"""
Ephemeris Utility

This module provides functions to calculate the position of the sun
and other celestial bodies using the Swiss Ephemeris library.
"""

import swisseph as swe
import datetime
from typing import Dict, Any, Tuple


def initialize_ephemeris() -> None:
    """Initialize the Swiss Ephemeris library."""
    # Set the path to the ephemeris files (optional)
    # If not set, the library will try to use the environment variable SE_EPHE_PATH
    # or look in the current directory
    # swe.set_ephe_path('/path/to/ephemeris/files')
    
    # Use the tropical zodiac (default)
    swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)


def calculate_sun_position(date: datetime.datetime = None) -> Dict[str, Any]:
    """
    Calculate the position of the sun in the tropical zodiac.
    
    Args:
        date: The date for calculation (default: current date and time)
        
    Returns:
        dict: Contains the sun's position data
    """
    # Initialize the ephemeris if not already done
    initialize_ephemeris()
    
    # Use current date and time if not provided
    if date is None:
        date = datetime.datetime.now()
    
    # Convert date to Julian day
    jd = swe.julday(
        date.year,
        date.month,
        date.day,
        date.hour + date.minute / 60.0 + date.second / 3600.0
    )
    
    # Calculate the sun's position
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    result, flags = swe.calc_ut(jd, swe.SUN, flags)
    
    # Extract the longitude (position in the zodiac)
    longitude = result[0]
    
    # The result is in degrees (0-360)
    # We'll normalize it to ensure it's in the range 0-360
    longitude = longitude % 360
    
    # Get the zodiac sign (0-11, where 0 is Aries, 1 is Taurus, etc.)
    zodiac_sign = int(longitude / 30)
    
    # Get the degrees within the zodiac sign
    degrees_in_sign = longitude % 30
    
    # Define the zodiac sign names
    zodiac_names = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ]
    
    return {
        "date": date.strftime("%Y-%m-%d %H:%M:%S"),
        "julian_day": jd,
        "longitude": longitude,
        "zodiac_sign": zodiac_names[zodiac_sign],
        "degrees_in_sign": degrees_in_sign,
        "angle": longitude  # This is the angle we need for Gann Square calculations
    }


def calculate_sun_position_for_date(
    year: int, month: int, day: int, 
    hour: int = 12, minute: int = 0, second: int = 0
) -> Dict[str, Any]:
    """
    Calculate the position of the sun for a specific date and time.
    
    Args:
        year: The year
        month: The month (1-12)
        day: The day (1-31)
        hour: The hour (0-23)
        minute: The minute (0-59)
        second: The second (0-59)
        
    Returns:
        dict: Contains the sun's position data
    """
    date = datetime.datetime(year, month, day, hour, minute, second)
    return calculate_sun_position(date)


def get_current_sun_angle() -> float:
    """
    Get the current angle of the sun in the tropical zodiac.
    
    Returns:
        float: The sun's longitude in degrees (0-360)
    """
    return calculate_sun_position()["angle"] 