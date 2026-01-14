import { kv } from '@vercel/kv';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    const userId = token.id || token.sub;
    const { portfolioId, config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Portfolio config is required' });
    }

    // Generate unique ID if not provided
    const id = portfolioId || generateId();

    // Store portfolio with user association
    const portfolioData = {
      userId,
      config,
      createdAt: portfolioId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store portfolio config in Vercel KV with 1 year expiration
    await kv.set(`portfolio:${id}`, portfolioData, { ex: 31536000 });

    // Add to user's portfolio list
    const userPortfoliosKey = `user:${userId}:portfolios`;
    const userPortfolios = await kv.get(userPortfoliosKey) || [];
    
    if (!userPortfolios.includes(id)) {
      userPortfolios.push(id);
      await kv.set(userPortfoliosKey, userPortfolios, { ex: 31536000 });
    }

    return res.status(200).json({ 
      success: true, 
      portfolioId: id 
    });
  } catch (error) {
    console.error('Save portfolio error:', error);
    return res.status(500).json({ error: 'Failed to save portfolio' });
  }
}

function generateId() {
  // Generate a random 8-character ID
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
