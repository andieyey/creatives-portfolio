import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  // Get user session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      id: token.id || token.sub,
      email: token.email,
      name: token.name,
      image: token.picture
    }
  });
}
