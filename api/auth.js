const NextAuth = require('next-auth').default;
const GoogleProvider = require('next-auth/providers/google').default;
const { kv } = require('@vercel/kv');

// Custom KV adapter for NextAuth
const KVAdapter = {
  async createUser(user) {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userData = { ...user, id, createdAt: new Date().toISOString() };
    await kv.set(`user:${id}`, userData);
    await kv.set(`user:email:${user.email}`, id);
    return userData;
  },
  
  async getUser(id) {
    return await kv.get(`user:${id}`);
  },
  
  async getUserByEmail(email) {
    const userId = await kv.get(`user:email:${email}`);
    if (!userId) return null;
    return await kv.get(`user:${userId}`);
  },
  
  async getUserByAccount({ provider, providerAccountId }) {
    const userId = await kv.get(`account:${provider}:${providerAccountId}`);
    if (!userId) return null;
    return await kv.get(`user:${userId}`);
  },
  
  async updateUser(user) {
    const existing = await kv.get(`user:${user.id}`);
    const updated = { ...existing, ...user };
    await kv.set(`user:${user.id}`, updated);
    return updated;
  },
  
  async linkAccount(account) {
    await kv.set(`account:${account.provider}:${account.providerAccountId}`, account.userId);
    return account;
  },
  
  async createSession(session) {
    await kv.set(`session:${session.sessionToken}`, session, { ex: 2592000 }); // 30 days
    return session;
  },
  
  async getSessionAndUser(sessionToken) {
    const session = await kv.get(`session:${sessionToken}`);
    if (!session) return null;
    const user = await kv.get(`user:${session.userId}`);
    return { session, user };
  },
  
  async updateSession(session) {
    const existing = await kv.get(`session:${session.sessionToken}`);
    const updated = { ...existing, ...session };
    await kv.set(`session:${session.sessionToken}`, updated, { ex: 2592000 });
    return updated;
  },
  
  async deleteSession(sessionToken) {
    await kv.del(`session:${sessionToken}`);
  },
  
  async createVerificationToken(token) {
    await kv.set(`verification:${token.identifier}:${token.token}`, token, { ex: 86400 }); // 24 hours
    return token;
  },
  
  async useVerificationToken({ identifier, token }) {
    const key = `verification:${identifier}:${token}`;
    const verificationToken = await kv.get(key);
    if (!verificationToken) return null;
    await kv.del(key);
    return verificationToken;
  }
};

const authHandler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  adapter: KVAdapter,
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

module.exports = async function handler(req, res) {
  // Handle all NextAuth routes
  return await authHandler(req, res);
}
