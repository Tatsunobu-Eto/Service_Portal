import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { prisma } from "@/serverside/db/prisma";
import { getUserPermissions } from "@/serverside/services/permission/permissionService";

/**
>>>>+++ REPLACE

 * NextAuth 設定
 * Google 認証と Credentials (メール/パスワード) 認証をサポート
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Prisma をアダプターとして使用し、ユーザー情報を DB に保存
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // ユーザーの存在確認
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        // パスワードの検証
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  // セッション管理に JWT を使用 (Credentials プロバイダーを使用するために必須)
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * JWT トークン作成・更新時の処理
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    /**
     * セッション取得時の処理
     * クライアントサイドで利用可能なユーザー情報を構築
     */
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;

        // ユーザー権限情報を取得してセッションに付与
        // ※ 頻繁なアクセスの場合はキャッシュ（Redis 等）の導入を検討
        session.user.permissions = await getUserPermissions(session.user.id);
      }

      return session;
    },
  },
});
