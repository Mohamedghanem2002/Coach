import { auth } from "./backend/auth";

export default auth;
export const proxy = auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth internal route handlers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
