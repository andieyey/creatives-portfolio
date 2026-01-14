import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { portfolioId, config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Portfolio config is required' });
    }

    // Generate unique ID if not provided
    const id = portfolioId || generateId();

    // Store portfolio config in Vercel KV with 1 year expiration
    await kv.set(`portfolio:${id}`, config, { ex: 31536000 });

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
