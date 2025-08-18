import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Auth0 client instance for server-side operations
// This file is separate from auth-utils to avoid importing database code in Edge Runtime
export const auth0 = new Auth0Client();
