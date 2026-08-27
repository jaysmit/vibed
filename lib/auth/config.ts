import type { NextAuthConfig } from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from './mongodb-adapter';

export const authConfig: NextAuthConfig = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM || 'Vibed <noreply@vibed.com>',
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login/check-email',
    error: '/login/error',
  },
  callbacks: {
    session({ session, user }) {
      // Add user id to session
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: 'database',
  },
};
