import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    const sessionToken = cookies?.session;
    let userId = null;
    
    if (sessionToken) {
      const sessionData = await redis.get(`session:${sessionToken}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        userId = session.userId;
      }
    }

    const { portfolioId, config, editToken } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Portfolio config is required' });
    }

    let id = portfolioId;
    let token = editToken;
    let isNew = false;

    // If updating existing portfolio, validate edit token or ownership
    if (portfolioId) {
      const existingData = await redis.get(`portfolio:${portfolioId}`);
      
      if (existingData) {
        const existing = JSON.parse(existingData);
        
        // Check if user owns this portfolio
        const userOwnsPortfolio = userId && existing.userId === userId;
        
        // Check if valid edit token provided
        const validToken = editToken && existing.editTokenHash && 
          hashToken(editToken) === existing.editTokenHash;
        
        if (!userOwnsPortfolio && !validToken) {
          return res.status(403).json({ error: 'Unauthorized to edit this portfolio' });
        }
      }
    } else {
      // Creating new portfolio
      isNew = true;
      id = generateId();
      token = generateEditToken();
    }

    // Store portfolio data
    const portfolioData = {
      userId: userId || null, // null for anonymous users
      config,
      editTokenHash: hashToken(token),
      createdAt: isNew ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
      claimed: !!userId // Track if portfolio is claimed by a user
    };

    // Remove undefined fields
    Object.keys(portfolioData).forEach(key => 
      portfolioData[key] === undefined && delete portfolioData[key]
    );

    // Store portfolio with 1 year expiration
    await redis.set(`portfolio:${id}`, JSON.stringify(portfolioData), 'EX', 31536000);

    // If user is authenticated, add to their portfolio list
    if (userId) {
      const userPortfoliosKey = `user:${userId}:portfolios`;
      const userPortfoliosData = await redis.get(userPortfoliosKey);
      const userPortfolios = userPortfoliosData ? JSON.parse(userPortfoliosData) : [];
      
      if (!userPortfolios.includes(id)) {
        userPortfolios.push(id);
        await redis.set(userPortfoliosKey, JSON.stringify(userPortfolios), 'EX', 31536000);
      }
    }

    return res.status(200).json({ 
      success: true, 
      portfolioId: id,
      editToken: isNew ? token : undefined, // Only return token for new portfolios
      isNew
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

function generateEditToken() {
  // Generate a secure random token (32 bytes = 64 hex characters)
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  // Hash the token for storage
  return crypto.createHash('sha256').update(token).digest('hex');
}
