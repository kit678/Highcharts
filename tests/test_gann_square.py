"""
Tests for the Gann Square of 9 calculator.
"""

import sys
import os
import unittest
import numpy as np

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.gann_square import GannSquare, calculate_gann_levels


class TestGannSquare(unittest.TestCase):
    """Test cases for the GannSquare class."""
    
    def setUp(self):
        """Set up the test case."""
        self.gann = GannSquare(size=20)
    
    def test_generate_square(self):
        """Test that the square is generated correctly."""
        # Check that the center value is 1
        center = self.gann.size // 2
        self.assertEqual(self.gann.matrix[center][center], 1)
        
        # Check that the values spiral outward
        self.assertEqual(self.gann.matrix[center][center-1], 2)  # Left of center
        self.assertEqual(self.gann.matrix[center-1][center-1], 3)  # Top-left of center
        self.assertEqual(self.gann.matrix[center-1][center], 4)  # Top of center
        
        # Check that the matrix has the correct shape
        self.assertEqual(self.gann.matrix.shape, (20, 20))
    
    def test_find_nearest_value(self):
        """Test finding the nearest value in the square."""
        # Test exact match
        self.assertEqual(self.gann.find_nearest_value(1), 1)
        
        # Test approximate match
        nearest = self.gann.find_nearest_value(10.5)
        self.assertTrue(nearest in [10, 11])
    
    def test_get_position(self):
        """Test getting the position of a value in the square."""
        # Test center value
        center = self.gann.size // 2
        self.assertEqual(self.gann.get_position(1), (center, center))
        
        # Test value not in the matrix
        self.assertIsNone(self.gann.get_position(1000))
    
    def test_get_angle(self):
        """Test calculating the angle of a value from the center."""
        # Test center value
        self.assertEqual(self.gann.get_angle(1), 0)
        
        # Test value not in the matrix
        self.assertIsNone(self.gann.get_angle(1000))
    
    def test_is_on_cardinal_angle(self):
        """Test checking if a value is on a cardinal angle."""
        # Test center value
        self.assertTrue(self.gann.is_on_cardinal_angle(1))
        
        # Test value not in the matrix
        self.assertFalse(self.gann.is_on_cardinal_angle(1000))
    
    def test_find_spoke_values(self):
        """Test finding values that lie on the spokes."""
        # Test with sun angle 0
        spoke_values = self.gann.find_spoke_values(1, 0)
        self.assertIn(1, spoke_values)
        
        # Test with sun angle 90
        spoke_values = self.gann.find_spoke_values(1, 90)
        self.assertIn(1, spoke_values)


class TestCalculateGannLevels(unittest.TestCase):
    """Test cases for the calculate_gann_levels function."""
    
    def test_calculate_gann_levels(self):
        """Test calculating Gann levels for a price and sun angle."""
        # Test with a simple price and sun angle
        price = 100.0
        sun_angle = 0.0
        levels = calculate_gann_levels(price, sun_angle)
        
        # Check that the function returns a dictionary with up and down levels
        self.assertIn('up_levels', levels)
        self.assertIn('down_levels', levels)
        
        # Check that the levels are lists
        self.assertIsInstance(levels['up_levels'], list)
        self.assertIsInstance(levels['down_levels'], list)
        
        # Check that the levels have the correct length
        self.assertEqual(len(levels['up_levels']), 5)
        self.assertEqual(len(levels['down_levels']), 5)


if __name__ == '__main__':
    unittest.main() 