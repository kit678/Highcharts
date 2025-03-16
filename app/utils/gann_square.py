"""
Gann Square of 9 Calculator

This module provides functions to calculate Gann Square of 9 values
and find corresponding market reaction levels based on a given price.
"""

import numpy as np
import math
from typing import List, Dict, Tuple, Union, Optional
import logging


class GannSquare:
    """
    A class to generate and operate on a Gann Square of 9 chart.
    
    The Gann Square of 9 is a spiral of numbers that starts with 1 in the center
    and spirals outward, where each number is one higher than the previous.
    """
    
    def __init__(self, size: int = 60):
        """
        Initialize a Gann Square of 9 with a given size.
        
        Args:
            size: The size of the square matrix (default: 60)
        """
        self.size = size
        self.matrix = self._generate_square()
        self.cardinal_angles = [0, 45, 90, 135, 180, 225, 270, 315]
        
    def _generate_square(self) -> np.ndarray:
        """
        Generate the Gann Square of 9 matrix.
        
        Returns:
            numpy.ndarray: The generated square matrix
        """
        # Create a matrix of zeros
        square = np.zeros((self.size, self.size), dtype=int)
        
        # Center of the square
        center_x, center_y = self.size // 2, self.size // 2
        
        # Directions: right, up, left, down
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]
        
        # Starting position and value
        x, y = center_x, center_y
        square[y][x] = 1  # Center value is 1
        
        # Current value and direction index
        value = 2
        dir_idx = 0
        
        # Steps to take in current direction
        steps = 1
        
        # Number of times we've moved in the current step count
        step_count = 0
        
        # Generate the spiral
        while value <= self.size * self.size:
            # Move in the current direction
            dx, dy = directions[dir_idx]
            x += dx
            y += dy
            
            # Check if we're still within the matrix bounds
            if 0 <= x < self.size and 0 <= y < self.size:
                square[y][x] = value
                value += 1
            else:
                # If we're out of bounds, stop
                break
            
            # Increment step count
            step_count += 1
            
            # Check if we need to change direction
            if step_count == steps:
                dir_idx = (dir_idx + 1) % 4
                step_count = 0
                
                # After moving East or West, increase the step count
                if dir_idx == 0 or dir_idx == 2:
                    steps += 1
        
        return square
    
    def find_nearest_value(self, value: float) -> int:
        """
        Find the nearest value in the Gann Square.
        
        Args:
            value: The value to find in the square
            
        Returns:
            int: The nearest value found in the square
        """
        # Flatten the matrix for easier searching
        flat_matrix = self.matrix.flatten()
        
        # Find the index of the value closest to our target
        idx = (np.abs(flat_matrix - value)).argmin()
        
        # Return the closest value
        return flat_matrix[idx]
    
    def get_position(self, value: int) -> Tuple[int, int]:
        """
        Find the position (row, col) of a value in the Gann Square.
        
        Args:
            value: The value to find
            
        Returns:
            tuple: (row, col) position in the square
        """
        # Find the position of the value in the matrix
        positions = np.where(self.matrix == value)
        
        # If the value is not in the matrix, return None
        if len(positions[0]) == 0:
            return None
        
        # Return the position (row, col)
        return positions[0][0], positions[1][0]
    
    def get_angle(self, value: int) -> float:
        """
        Calculate the angle of a value from the center of the Gann Square.
        
        Args:
            value: The value to find
            
        Returns:
            float: The angle in degrees
        """
        # Get the center position
        center_x, center_y = self.size // 2, self.size // 2
        
        # Get the position of the value
        position = self.get_position(value)
        
        # If the value is not in the matrix, return None
        if position is None:
            return None
        
        row, col = position
        
        # Calculate the angle
        dx = col - center_x
        dy = row - center_y
        
        # Handle the center value
        if dx == 0 and dy == 0:
            return 0
        
        # Calculate the angle in radians
        angle_rad = math.atan2(dy, dx)
        
        # Convert to degrees and normalize to 0-360
        angle_deg = math.degrees(angle_rad)
        if angle_deg < 0:
            angle_deg += 360
            
        # Convert to Gann's angle system where 0 is East (right)
        angle_deg = (angle_deg + 90) % 360
        
        return angle_deg
    
    def is_on_cardinal_angle(self, value: int, tolerance: float = 5.0) -> bool:
        """
        Check if a value is on a cardinal angle.
        
        Args:
            value: The value to check
            tolerance: The angle tolerance in degrees
            
        Returns:
            bool: True if the value is on a cardinal angle
        """
        angle = self.get_angle(value)
        
        if angle is None:
            return False
        
        # Check if the angle is close to any cardinal angle
        for cardinal in self.cardinal_angles:
            if abs((angle - cardinal + 180) % 360 - 180) <= tolerance:
                return True
                
        return False
    
    def find_spoke_values(self, value: int, sun_angle: float) -> List[int]:
        """
        Find values that lie on the spokes radiating from the sun position.
        
        Args:
            value: The current value
            sun_angle: The angle of the sun in degrees
            
        Returns:
            list: Values that lie on the spokes
        """
        spoke_values = []
        
        # Find values on the spokes radiating from the sun position
        for i in range(8):
            # Calculate the spoke angle
            spoke_angle = (sun_angle + i * 45) % 360
            
            # Find values that lie on this spoke
            for v in range(1, self.size * self.size + 1):
                angle = self.get_angle(v)
                if angle is not None and abs((angle - spoke_angle + 180) % 360 - 180) <= 5:
                    spoke_values.append(v)
        
        return spoke_values


def calculate_gann_levels(price: float, sun_angle: float, num_levels: int = 5) -> Dict[str, List[float]]:
    """
    Calculate Gann Square of 9 levels for a given price and sun angle.
    
    Args:
        price: The current price of the asset
        sun_angle: The current angle of the sun in degrees
        num_levels: The number of levels to calculate (up and down)
        
    Returns:
        dict: Dictionary containing up and down levels
    """
    logger = logging.getLogger(__name__)
    
    logger.info(f"Starting calculate_gann_levels with price={price}, sun_angle={sun_angle}")
    
    try:
        # Create a Gann Square with enough size
        logger.info("Creating GannSquare instance")
        gann = GannSquare(size=150)
        
        # Calculate the normalized price (mod 360)
        normalized_price = price % 360
        logger.info(f"Normalized price: {normalized_price}")
        
        # Scale factor is 10 as mentioned in requirements
        scaled_price = normalized_price * 10
        logger.info(f"Scaled price: {scaled_price}")
        
        # Find the nearest value in the Gann Square
        nearest_value = gann.find_nearest_value(scaled_price)
        logger.info(f"Nearest value found: {nearest_value}")
        
        # Find values that lie on the spokes
        logger.info(f"Finding spoke values for nearest_value={nearest_value}, sun_angle={sun_angle}")
        spoke_values = gann.find_spoke_values(nearest_value, sun_angle)
        logger.info(f"Found {len(spoke_values)} spoke values")
        
        # Sort the spoke values
        spoke_values.sort()
        
        # Error handling for empty spoke_values
        if not spoke_values:
            logger.warning("No spoke values found, returning empty levels")
            return {
                "up_levels": [None] * num_levels,
                "down_levels": [None] * num_levels
            }
        
        # Find the index of the nearest value
        try:
            nearest_idx = spoke_values.index(nearest_value)
            logger.info(f"Found nearest_value at index {nearest_idx}")
        except ValueError:
            logger.warning(f"nearest_value {nearest_value} not found in spoke_values")
            # Find closest value instead
            nearest_idx = min(range(len(spoke_values)), 
                              key=lambda i: abs(spoke_values[i] - nearest_value))
            logger.info(f"Using closest value at index {nearest_idx} instead")
        
        # Extract up and down levels
        up_values = spoke_values[nearest_idx+1:nearest_idx+1+num_levels]
        down_values = spoke_values[max(0, nearest_idx-num_levels):nearest_idx]
        logger.info(f"Extracted up_values: {up_values}, down_values: {down_values}")
        
        # Convert back to actual price levels
        up_levels = [(v / 10) + (math.floor(price / 360) * 360) for v in up_values]
        down_levels = [(v / 10) + (math.floor(price / 360) * 360) for v in down_values]
        logger.info(f"Converted to actual price levels - up: {up_levels}, down: {down_levels}")
        
        # Ensure we have the correct number of levels
        while len(up_levels) < num_levels:
            up_levels.append(None)
        while len(down_levels) < num_levels:
            down_levels.append(None)
        
        result = {
            "up_levels": up_levels[:num_levels],
            "down_levels": down_levels[-num_levels:]
        }
        logger.info(f"Final result: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error in calculate_gann_levels: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Return empty levels rather than propagating the exception
        return {
            "up_levels": [None] * num_levels,
            "down_levels": [None] * num_levels
        } 