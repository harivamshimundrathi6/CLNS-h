import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";
import { auth as firebaseAuth, signInWithEmailAndPassword } from "@/lib/firebase";

class EmailNotVerifiedError extends CredentialsSignin {
    code = "EmailNotVerified";
}


async function getUser(email: string) {
    try {
        const user = await db.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    
                    try {
                        // Authenticate with Firebase
                        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
                        const firebaseUser = userCredential.user;

                        if (!firebaseUser.emailVerified) {
                            throw new EmailNotVerifiedError();
                        }
                        
                        // Get user data from Firestore
                        const user = await getUser(email);
                        if (!user) return null;

                        if (user.status === "REJECTED" || user.status === "SUSPENDED") {
                            console.warn(`Blocked login attempt for ${email} with status ${user.status}`);
                            return null;
                        }

                        try {
                            await db.systemLog.create({
                                action: "USER_LOGIN",
                                description: `User verified login: ${email}`,
                                userId: user.id,
                                createdAt: new Date().toISOString()
                            });
                        } catch (e) {
                            console.error("Failed to log login", e);
                        }
                        
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            status: user.status
                        };
                    } catch (error: any) {
                        console.error("Firebase auth error:", error);
                        console.log("Invalid credentials");
                        return null;
                    }
                }
                console.log("Invalid credentials");
                return null;
            },
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }) {
            // Handle Google OAuth sign in
            if (account?.provider === "google" && user.email) {
                try {
                    // Check if user exists with this email
                    const existingUser = await db.user.findUnique({
                        where: { email: user.email }
                    });

                    if (existingUser) {
                        // Link Google account to existing user
                        if (existingUser.status === "REJECTED" || existingUser.status === "SUSPENDED") {
                            return false; // Block sign in
                        }
                        return true;
                    } else {
                        // Create new user from Google account
                        const newUser = await db.user.create({
                            email: user.email,
                            name: user.name || (profile as any)?.name || "User",
                            role: "PROSPECT",
                            status: "ACTIVE",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });

                        await db.systemLog.create({
                            action: "USER_REGISTERED",
                            description: `New user registered via Google: ${user.email}`,
                            userId: newUser.id,
                            createdAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error("Error in Google sign in:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.status = user.status;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.status = token.status;
            }
            return session;
        },
    },
});
