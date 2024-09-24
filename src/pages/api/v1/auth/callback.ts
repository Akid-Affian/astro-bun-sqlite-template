import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { db } from '@lib/database/db';

export const prerender = false; // Ensure this route is not prerendered

// Constants for cookies
const maxAgeInSeconds = 6 * 60 * 60; // 6 hours
const isProduction = process.env.NODE_ENV === 'production'; // Check if we're in production
const secureFlag = isProduction ? 'Secure; ' : ''; // Only add Secure in production

// Cache environment variables to avoid repeated lookups
const clientId = import.meta.env.GOOGLE_CLIENT_ID;
const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return new Response(null, { status: 400 });
  }

  const currentUrl = new URL(request.url);
  const redirectUri = new URL('/api/v1/auth/callback', `${currentUrl.protocol}//${currentUrl.host}`).toString();

  // Create a new OAuth2Client instance with the dynamically generated redirect URI
  const client = new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });

  try {
    // Exchange authorization code for tokens
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) {
      return new Response(null, { status: 400 });
    }

    // Verify the ID token and extract user info
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket?.getPayload();
    if (!payload) {
      return new Response(null, { status: 400 });
    }

    const userId = payload['sub']; // User's unique Google ID
    const username = payload['name'] || ''; // Fallback if name is undefined
    const email = payload['email'] || '';  // User's email
    const oauthProvider = 'google';

    // Generate a UUID for the auth_token
    const authToken = crypto.randomUUID();
    const now = Date.now();

    // Check if user already exists
    const existingUser = db
      .prepare(`SELECT id FROM users WHERE oauth_id = ? AND oauth_provider = ?`)
      .get(userId, oauthProvider) as { id: string } | undefined;

    if (existingUser) {
      // Update existing user with new auth token and timestamps
      db.prepare(`
        UPDATE users
        SET auth_token = ?, auth_token_created_at = ?, updated_at = ?, oauth_username = ?, email = ?
        WHERE id = ?
      `).run(authToken, now, now, username, email, existingUser.id);
    } else {
      // Insert new user into the database
      db.prepare(`
        INSERT INTO users (oauth_provider, oauth_id, oauth_username, auth_token, auth_token_created_at, email, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?)
      `).run(
        oauthProvider, 
        userId, 
        username || null,  // Handle undefined username
        authToken, 
        now,
        email || null,  // Handle undefined email
        now, 
        now
      );
    }

    const frontendSessionValue = '1';

    // Create separate cookie strings
    const authTokenCookie = `auth_token=${authToken}; HttpOnly; ${secureFlag}Path=/; Max-Age=${maxAgeInSeconds}; SameSite=Strict`;
    const frontendSessionCookie = `frontend_session=${frontendSessionValue}; Path=/; ${secureFlag}Max-Age=${maxAgeInSeconds}; SameSite=Strict`;

    // Create a Headers object
    const headers = new Headers();
    headers.set('Location', '/'); // Redirect to home page
    headers.append('Set-Cookie', authTokenCookie);
    headers.append('Set-Cookie', frontendSessionCookie);

    return new Response(null, {
      status: 302,
      headers: headers,
    });
  } catch (error) {
    // Simple error logging to keep it lightweight
    console.error('OAuth callback error:', error);
    return new Response(null, { status: 500 });
  }
}
