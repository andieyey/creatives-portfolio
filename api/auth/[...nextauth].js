import { createRequire } from 'module';
import Redis from 'ioredis';

const require = createRequire(import.meta.url);
const NextAuth = require('next-auth').default;
const GoogleProvider = require('next-auth/providers/google').default;

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

// Custom Redis adapter for NextAuth
const RedisAdapter = {
  async createUser(user) {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userData = { ...user, id, createdAt: new Date().toISOString() };
    await redis.set(`user:${id}`, JSON.stringify(userData));
    await redis.set(`user:email:${user.email}`, id);
    return userData;
  },
  
  async getUser(id) {
    const data = await redis.get(`user:${id}`);
    return data ? JSON.parse(data) : null;
  },
  
  async getUserByEmail(email) {
    const userId = await redis.get(`user:email:${email}`);
    if (!userId) return null;
    const data = await redis.get(`user:${userId}`);
    return data ? JSON.parse(data) : null;
  },
  
  async getUserByAccount({ provider, providerAccountId }) {
    const userId = await redis.get(`account:${provider}:${providerAccountId}`);
    if (!userId) return null;
    const data = await redis.get(`user:${userId}`);
    return data ? JSON.parse(data) : null;
  },
  
  async updateUser(user) {
    const data = await redis.get(`user:${user.id}`);
    const existing = data ? JSON.parse(data) : {};
    const updated = { ...existing, ...user };
    await redis.set(`user:${user.id}`, JSON.stringify(updated));
    return updated;
  },
  
  async linkAccount(account) {
    await redis.set(`account:${account.provider}:${account.providerAccountId}`, account.userId);
    return account;
  },
  
  async createSession(session) {
    await redis.set(`session:${session.sessionToken}`, JSON.stringify(session), 'EX', 2592000); // 30 days
    return session;
  },
  
  async getSessionAndUser(sessionToken) {
    const sessionData = await redis.get(`session:${sessionToken}`);
    if (!sessionData) return null;
    const session = JSON.parse(sessionData);
    const userData = await redis.get(`user:${session.userId}`);
    const user = userData ? JSON.parse(userData) : null;
    return { session, user };
  },
  
  async updateSession(session) {
    const data = await redis.get(`session:${session.sessionToken}`);
    const existing = data ? JSON.parse(data) : {};
    const updated = { ...existing, ...session };
    await redis.set(`session:${session.sessionToken}`, JSON.stringify(updated), 'EX', 2592000);
    return updated;
  },
  
  async deleteSession(sessionToken) {
    await redis.del(`session:${sessionToken}`);
  },
  
  async createVerificationToken(token) {
    await redis.set(`verification:${token.identifier}:${token.token}`, JSON.stringify(token), 'EX', 86400); // 24 hours
    return token;
  },
  
  async useVerificationToken({ identifier, token }) {
    const key = `verification:${identifier}:${token}`;
    const data = await redis.get(key);
    if (!data) return null;
    await redis.del(key);
    return JSON.parse(data);
  }
};

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  adapter: RedisAdapter,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth.html',
    error: '/auth.html',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode to see detailed logs
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // NextAuth handler for all auth routes
    return await NextAuth(req, res, authOptions);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
