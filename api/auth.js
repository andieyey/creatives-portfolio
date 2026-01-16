import Redis from 'ioredis';
import crypto from 'crypto';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || 'https://creatives-craftfolio.vercel.app';
const REDIRECT_URI = `${BASE_URL}/api/auth`;

// Helper functions
function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function exchangeCodeForTokens(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  return await response.json();
}

async function getUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  
  return await response.json();
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code, state, action } = req.query;

  try {
    // Handle OAuth callback
    if (code) {
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code);
      const userInfo = await getUserInfo(tokens.access_token);
      
      // Create or update user in Redis
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userData = {
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        createdAt: new Date().toISOString(),
      };
      
      await redis.set(`user:${userId}`, JSON.stringify(userData));
      await redis.set(`user:email:${userInfo.email}`, userId);
      
      // Create session
      const sessionToken = generateSessionToken();
      const sessionData = {
        sessionToken,
        userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };
      
      await redis.set(`session:${sessionToken}`, JSON.stringify(sessionData), 'EX', 2592000);
      
      // Set cookie and redirect
      res.setHeader('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
      return res.redirect(302, '/editor.html');
    }
    
    // Handle sign-in initiation
    if (action === 'signin' || req.url.includes('signin')) {
      const state = generateState();
      await redis.set(`oauth:state:${state}`, 'pending', 'EX', 600); // 10 minutes
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      
      return res.redirect(302, authUrl.toString());
    }
    
    // Handle session check
    if (action === 'session' || (req.method === 'GET' && !code && !action)) {
      const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      const sessionToken = cookies?.session;
      
      if (!sessionToken) {
        return res.status(200).json({ authenticated: false });
      }
      
      const sessionData = await redis.get(`session:${sessionToken}`);
      if (!sessionData) {
        return res.status(200).json({ authenticated: false });
      }
      
      const session = JSON.parse(sessionData);
      const userData = await redis.get(`user:${session.userId}`);
      
      if (!userData) {
        return res.status(200).json({ authenticated: false });
      }
      
      const user = JSON.parse(userData);
      
      return res.status(200).json({ 
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture
        },
        expires: session.expires 
      });
    }
    
    // Handle sign-out
    if (action === 'signout') {
      const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      const sessionToken = cookies?.session;
      
      if (sessionToken) {
        await redis.del(`session:${sessionToken}`);
      }
      
      res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
      
      // Redirect to auth page with signedout parameter
      return res.redirect(302, '/auth.html?signedout=true');
    }
    
    return res.status(400).json({ error: 'Invalid request' });
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
}
