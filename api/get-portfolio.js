import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    // Retrieve portfolio from Redis
    const data = await redis.get(`portfolio:${id}`);

    if (!data) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const portfolioData = JSON.parse(data);

    // Return the config (backward compatible with old format)
    const config = portfolioData.config || portfolioData;

    return res.status(200).json({ 
      success: true, 
      config 
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    return res.status(500).json({ error: 'Failed to load portfolio' });
  }
}
