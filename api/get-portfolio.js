import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Portfolio ID is required' });
    }

    // Retrieve portfolio from Vercel KV
    const portfolioData = await kv.get(`portfolio:${id}`);

    if (!portfolioData) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

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
