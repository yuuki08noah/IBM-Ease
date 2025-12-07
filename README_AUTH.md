# IBM OAuth 2.0 + OIDC Authentication Implementation

## Overview
This implementation follows PRD requirements for IBM OAuth authentication with PKCE flow, token management, and session handling.

## Features Implemented

### 1. PKCE (Proof Key for Code Exchange)
- ✅ Code verifier generation (random 32 bytes, base64url encoded)
- ✅ Code challenge generation (SHA256 hash of verifier)
- ✅ S256 challenge method

### 2. OAuth Flow
- ✅ Authorization endpoint with PKCE parameters
- ✅ Token exchange endpoint
- ✅ ID token parsing (JWT payload extraction)
- ✅ Access token storage
- ✅ Refresh token rotation

### 3. Session Management
- ✅ HTTP-only cookies for security
- ✅ SameSite=lax protection
- ✅ Secure flag for production
- ✅ Cookie expiration:
  - User session: 7 days
  - Access token: 1 hour
  - Refresh token: 30 days

### 4. API Routes

#### `/api/auth/login`
- Generates PKCE verifier and challenge
- Stores verifier in HTTP-only cookie
- Redirects to IBM OAuth authorize endpoint

#### `/api/auth/callback`
- Exchanges authorization code for tokens
- Validates PKCE verifier
- Parses ID token to extract user info
- Sets session cookies
- Redirects to home page

#### `/api/auth/logout`
- Clears all session cookies
- Redirects to login page

#### `/api/auth/me`
- Returns current user info from session
- Returns null if not authenticated

#### `/api/auth/refresh` (POST)
- Exchanges refresh token for new access token
- Rotates refresh token if provided
- Updates token cookies

### 5. Middleware

#### `server/middleware/auth.ts`
- Protects all routes except public paths
- Redirects unauthenticated users to login
- Allows API routes to pass through

### 6. Utilities

#### `server/utils/auth.ts`
- `getUser(event)`: Get current user or null
- `requireUser(event)`: Get user or throw 401
- `getAccessToken(event)`: Get access token or null
- `requireAccessToken(event)`: Get token or throw 401

#### `server/lib/pkce.ts`
- `generateCodeVerifier()`: Generate random verifier
- `generateCodeChallenge(verifier)`: Generate SHA256 challenge

## Configuration

### Environment Variables (.env)
```env
IBM_OAUTH_CLIENT_ID=your-client-id
IBM_OAUTH_CLIENT_SECRET=your-client-secret
IBM_OAUTH_AUTHORIZE_URL=https://iam.cloud.ibm.com/identity/authorize
IBM_OAUTH_TOKEN_URL=https://iam.cloud.ibm.com/identity/token
IBM_OAUTH_USERINFO_URL=https://iam.cloud.ibm.com/identity/userinfo
IBM_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
IBM_OAUTH_SCOPE=openid profile email
SESSION_SECRET=your-random-secret-min-32-chars
NODE_ENV=development
```

### Setup Steps

1. **Register OAuth Application in IBM Cloud**
   - Go to IBM Cloud IAM → Service IDs → Create
   - Add OAuth redirect URI: `http://localhost:3000/api/auth/callback`
   - Copy Client ID and Client Secret

2. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## User Flow

1. User visits protected page
2. Middleware redirects to `/login`
3. Login page calls `/api/auth/login`
4. User redirected to IBM OAuth
5. User authenticates with IBMid
6. IBM OAuth redirects to `/api/auth/callback?code=...`
7. Callback exchanges code for tokens
8. Callback parses ID token for user info
9. Callback sets session cookies
10. User redirected to home page
11. User info displayed in header

## Security Features

- ✅ PKCE prevents authorization code interception
- ✅ HTTP-only cookies prevent XSS attacks
- ✅ SameSite=lax prevents CSRF
- ✅ Secure flag in production (HTTPS only)
- ✅ No secrets in client-side code
- ✅ Token refresh mechanism
- ✅ Automatic session expiration

## ID Token Claims Extracted

```typescript
{
  id: decoded.sub || decoded.iam_id,
  email: decoded.email,
  name: decoded.name || decoded.given_name || decoded.email,
  role: 'user' // Can be upgraded based on claims
}
```

## Token Storage Strategy

| Token Type | Storage | Duration | Purpose |
|------------|---------|----------|---------|
| ID Token | Parsed to session cookie | 7 days | User identity |
| Access Token | HTTP-only cookie | 1 hour | API calls to IBM Cloud |
| Refresh Token | HTTP-only cookie | 30 days | Renew access token |
| PKCE Verifier | HTTP-only cookie | 5 min | OAuth flow security |

## API Usage Example

```typescript
// In a protected API route
import { requireUser, requireAccessToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireUser(event) // Throws 401 if not authenticated
  const token = requireAccessToken(event) // Get IBM Cloud access token

  // Call IBM Cloud API with token
  const response = await fetch('https://api.ibm.cloud.com/...', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  return { user, data: await response.json() }
})
```

## Future Enhancements

- [ ] MFA enforcement (check claims)
- [ ] Role-based access control (learner/dev/architect)
- [ ] IBM expert verification from claims
- [ ] Token revocation on logout
- [ ] Activity tracking for audit logs
- [ ] Enterprise SSO (SAML) support

## References

- IBM Cloud IAM OAuth: https://cloud.ibm.com/docs/account?topic=account-iamuserinv
- PKCE RFC 7636: https://datatracker.ietf.org/doc/html/rfc7636
- OAuth 2.0 Best Practices: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics
