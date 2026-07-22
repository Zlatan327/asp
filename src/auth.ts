import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import TwitterProvider from "next-auth/providers/twitter";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })] : []),
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET ? [TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    })] : []),
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET ? [DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    })] : []),
    CredentialsProvider({
      id: "siwe",
      name: "Wallet",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials?.signature) return null;

          const siwe = new SiweMessage(credentials.message as string);
          
          // Verify signature and nonce
          const cookieStore = await cookies();
          const storedNonce = cookieStore.get('siwe_nonce')?.value;
          const result = await siwe.verify({
            signature: credentials.signature as string,
            nonce: storedNonce,
          });

          if (result.success) {
            const walletAddress = siwe.address;

            // Find or create user by wallet address
            let dbUser = await prisma.user.findUnique({
              where: { walletAddress },
            });

            if (!dbUser) {
              dbUser = await prisma.user.create({
                data: {
                  walletAddress,
                  role: "BOTH",
                  tier: "FREE",
                },
              });
            }

            // Return user object for the session
            return {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              image: dbUser.avatarUrl,
            };
          }
          return null;
        } catch (e) {
          console.error("SIWE error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Ensure user exists in DB
      let dbUser = null;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = profile as any;
      const handle = String(p?.data?.username || p?.preferred_username || p?.login || user.name || "");
      
      if (user.email) {
        dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
      } else if (account && account.provider !== 'siwe' && account.provider !== 'credentials') {
        // Find by social account if no email
        const social = await prisma.socialAccount.findFirst({
          where: {
            platform: account.provider.toUpperCase(),
            handle: handle,
          }
        });
        if (social) {
          dbUser = await prisma.user.findUnique({ where: { id: social.userId } });
        }
      }

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email: user.email || null,
            name: user.name || 'Anonymous User',
            avatarUrl: user.image,
            role: "BOTH",
            tier: "FREE",
          },
        });
      }

      // Link social account
      if (account && account.provider !== 'siwe' && account.provider !== 'credentials') {
        await prisma.socialAccount.upsert({
          where: {
            userId_platform: {
              userId: dbUser.id,
              platform: account.provider.toUpperCase(),
            },
          },
          update: {
            handle: handle,
            profileUrl: String(p?.html_url || ""),
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            verified: true,
          },
          create: {
            userId: dbUser.id,
            platform: account.provider.toUpperCase(),
            handle: handle,
            profileUrl: String(p?.html_url || ""),
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            verified: true,
          },
        });
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      // If user object is present (first sign in), we need to ensure token.sub is our DB user ID
      if (user) {
        if (account?.provider !== 'siwe' && account?.provider !== 'credentials') {
          // For OAuth providers, the user.id is the provider's ID.
          // We need to fetch the actual DB user ID.
          let dbUser = null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = profile as any;
          const handle = String(p?.data?.username || p?.preferred_username || p?.login || user.name || "");
          
          if (user.email) {
            dbUser = await prisma.user.findUnique({
              where: { email: user.email }
            });
          } else if (account) {
            const social = await prisma.socialAccount.findFirst({
              where: {
                platform: account.provider.toUpperCase(),
                handle: handle,
              }
            });
            if (social) {
              dbUser = await prisma.user.findUnique({ where: { id: social.userId } });
            }
          }
          
          if (dbUser) {
            token.sub = dbUser.id;
          } else {
            token.sub = user.id; // fallback
          }
        } else {
          // For SIWE, we explicitly returned the DB user ID in authorize()
          token.sub = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            freelancerProfile: true,
            clientProfile: true,
          },
        });
        
        if (dbUser) {
          session.user.id = dbUser.id;
          (session.user as any).role = dbUser.role;
          (session.user as any).walletAddress = dbUser.walletAddress;
          (session.user as any).onboarded = !!dbUser.onboardedAt;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  session: { strategy: "jwt" },
});

