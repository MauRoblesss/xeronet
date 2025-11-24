export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!api/auth|api/nodes/.*/rules|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
