export default async function handler(req, res) {
  const { ticker } = req.query;
  
  try {
    // Proxy the request to your FastAPI backend
    const response = await fetch(`http://localhost:8000/api/history/${ticker}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return res.status(500).json({ error: error.message });
  }
} 