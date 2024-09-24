import { OAuth2Client } from 'google-auth-library';

export const prerender = false; // Ensure this route is not prerendered

// Initialize the OAuth2 client with your credentials
const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

export async function GET({ request }: { request: Request }) {
    const currentUrl = new URL(request.url);
    
    // Build redirect URI dynamically
    const redirectUri = new URL('/api/v1/auth/callback', `${currentUrl.protocol}//${currentUrl.host}`).toString();
  
    try {
      // Generate the Google OAuth URL
      const oauthUrl = client.generateAuthUrl({
        scope: ['profile', 'email'],
        redirect_uri: redirectUri,
      });
  
      // Redirect the user to Google's OAuth consent screen
      return new Response(null, {
        status: 302,
        headers: { Location: oauthUrl },
      });
    } catch (error) {
      console.error("Error generating Google OAuth URL:", error);
      return new Response("OAuth initialization failed", { status: 500 });
    }
  }
  