# IBM Ease - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` file with your IBM Cloud credentials.

### 3. OAuth Setup (Required for Authentication)

#### Option A: Use IBM Cloud IAM OAuth (Production)

1. **Create an IBM Cloud Account**
   - Go to https://cloud.ibm.com
   - Sign up or log in

2. **Create OAuth Application**
   - Navigate to: **Manage** → **Access (IAM)** → **Service IDs**
   - Click **Create**
   - Name: `IBM Ease OAuth`
   - Click **Create**

3. **Add API Key**
   - In the Service ID details, go to **API keys** tab
   - Click **Create**
   - Name: `IBM Ease Key`
   - Copy the API key (this is your `CLIENT_SECRET`)

4. **Configure OAuth Settings**
   - You'll need to contact IBM Cloud support to register your redirect URI
   - Or use IBM App ID service for easier OAuth setup

5. **Update .env file**
   ```env
   IBM_OAUTH_CLIENT_ID=your-service-id-here
   IBM_OAUTH_CLIENT_SECRET=your-api-key-here
   IBM_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
   ```

#### Option B: Development Mode (Skip Auth)

For local development without OAuth, you can temporarily bypass authentication:

1. Comment out the auth middleware in `server/middleware/auth.ts`
2. Or use mock authentication (see below)

### 4. Terraform Backend (Optional)

If you want to use Terraform features:

```env
TF_BACKEND_BUCKET=your-cos-bucket-name
TF_BACKEND_REGION=us-south
TF_BACKEND_ENDPOINT=https://s3.us-south.cloud-object-storage.appdomain.cloud
```

Create an IBM Cloud Object Storage bucket:
- Go to IBM Cloud console
- Create a Cloud Object Storage instance
- Create a bucket
- Copy the bucket name and endpoint

### 5. Run Development Server

```bash
npm run dev
```

Access the app at: http://localhost:3000

## Features Available Without OAuth

The following features work without authentication:
- ✅ View Quick Start templates
- ✅ Generate Terraform plans (download only)
- ✅ Browse playground labs (read-only)
- ✅ Browse community Q&A

The following features require authentication:
- ❌ Execute code in playground sandbox
- ❌ Save lab progress
- ❌ Use pre-authenticated API demos
- ❌ Post to community Q&A

## Troubleshooting

### Error: "OAuth configuration missing"

**Solution:** Your `.env` file is missing OAuth credentials.

**Quick Fix for Development:**
```bash
# Edit .env and add placeholder values:
IBM_OAUTH_CLIENT_ID=demo-client-id
IBM_OAUTH_CLIENT_SECRET=demo-secret
```

Then restart the server. The login will fail, but the app will load.

### Error: "Token exchange failed"

**Solution:** Your OAuth credentials are incorrect or the redirect URI doesn't match.

**Check:**
1. `IBM_OAUTH_CLIENT_ID` is correct
2. `IBM_OAUTH_REDIRECT_URI` matches exactly what's registered in IBM Cloud
3. OAuth URLs are correct (default IBM Cloud IAM URLs are in `.env.example`)

### Running without Authentication

To disable authentication temporarily:

1. Edit `server/middleware/auth.ts`:
```typescript
export default defineEventHandler((event) => {
  // Temporarily disabled for development
  return
})
```

2. Restart the server

## Production Deployment

### Environment Variables

Set the following in production:
```env
NODE_ENV=production
IBM_OAUTH_CLIENT_ID=<your-prod-client-id>
IBM_OAUTH_CLIENT_SECRET=<your-prod-secret>
IBM_OAUTH_REDIRECT_URI=https://your-domain.com/api/auth/callback
SESSION_SECRET=<generate-random-32-char-string>
TF_BACKEND_BUCKET=<your-prod-bucket>
TF_BACKEND_REGION=us-south
```

### Build and Start
```bash
npm run build
npm run start
```

## Next Steps

1. ✅ Set up OAuth credentials
2. ✅ Configure Terraform backend (optional)
3. ✅ Explore Quick Start templates
4. ✅ Try Interactive Playground labs
5. ✅ Build Cloud Topology diagrams

## Support

- GitHub Issues: https://github.com/ibm/ibm-ease/issues
- Documentation: See `README_*.md` files
- PRD: See `prd_ibm_style.md`

## Architecture Overview

```
IBM Ease
├── Frontend (Nuxt 3 + Vue 3)
├── API Layer (Nitro)
│   ├── OAuth Authentication (PKCE)
│   ├── Terraform Generation
│   ├── Code Sandbox
│   └── IBM Cloud API Proxy
└── IBM Cloud Services
    ├── IAM (Authentication)
    ├── Watson Assistant
    ├── Cloudant
    └── Cloud Object Storage
```
