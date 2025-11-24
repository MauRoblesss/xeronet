import NextAuth from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: Role;
    };
  }
}
