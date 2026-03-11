import { NextRequest } from 'next/server';

/**
 * @deprecated Use `verifyAuth` from `@/lib/api-auth` instead.
 * This implementation incorrectly calls getUser() without a token and always returns null.
 * All API routes should import from lib/api-auth.ts which reads the Bearer token from headers.
 */
export async function verifyAuth(req: NextRequest) {
    const { verifyAuth: apiVerifyAuth } = await import('./api-auth');
    return apiVerifyAuth(req);
}
