import Redis from 'ioredis';
import { getToken } from 'next-auth/jwt';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id || token.sub;

    // Get user's portfolio list
    const portfolioIdsData = await redis.get(`user:${userId}:portfolios`);
    const portfolioIds = portfolioIdsData ? JSON.parse(portfolioIdsData) : [];

    // Fetch portfolio details
    const portfolios = [];
    for (const id of portfolioIds) {
      const data = await redis.get(`portfolio:${id}`);
      if (data) {
        const portfolioData = JSON.parse(data);
        const config = portfolioData.config || portfolioData;
        portfolios.push({
          id,
          name: config.name || 'Untitled Portfolio',
          updatedAt: portfolioData.updatedAt || portfolioData.createdAt,
        });
      }
    }

    // Sort by updated date
    portfolios.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({ 
      success: true, 
      portfolios 
    });
  } catch (error) {
    console.error('List portfolios error:', error);
    return res.status(500).json({ error: 'Failed to load portfolios' });
  }
}
