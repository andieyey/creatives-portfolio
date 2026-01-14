import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google.js';
import Redis from 'ioredis';

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

const authHandler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    async jwt({ token, user }) {
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
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export default async function handler(req, res) {
  return await authHandler(req, res);
}
