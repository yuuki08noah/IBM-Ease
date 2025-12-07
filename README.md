# IBM Ease (Vertical Slice: Quick Start + Terraform)

This is a Nuxt 3 + Nitro scaffold for the IBM Ease Quick Start Studio vertical slice, wired for IBM OAuth (PKCE) and Terraform-first delivery. It now generates a Terraform bundle (main.tf + README) and serves a downloadable ZIP with IBM Ease guardrails (backend block, provider pinning).

## What’s included
- Nuxt 3 app with Carbon-friendly layout hooks.
- IBM OAuth PKCE login stub (`/api/auth/login`, `/api/auth/callback`, `/api/auth/me`).
- Quick Start templates UI + params form, calling Nitro APIs.
- Terraform generator stub returning backend block + module block and surfacing a download URL.
- Placeholder Terraform template in `infra/terraform/templates/ai-chatbot.tf`.

## Env setup
Use Node 20.19.0 (nvm recommended):
```bash
export NVM_DIR=\"$HOME/.nvm\" && . \"$NVM_DIR/nvm.sh\" && nvm install 20.19.0 && nvm use 20.19.0
```

Create `.env` from the example and fill IBM OAuth + Terraform backend details:

```bash
cp .env.example .env
```

Key vars:
- `IBM_OAUTH_CLIENT_ID`, `IBM_OAUTH_CLIENT_SECRET`
- `IBM_OAUTH_AUTHORIZE_URL`, `IBM_OAUTH_TOKEN_URL`
- `IBM_OAUTH_USERINFO_URL` (e.g., https://iam.cloud.ibm.com/identity/userinfo)
- `IBM_OAUTH_REDIRECT_URI` (e.g., http://localhost:3000/api/auth/callback)
- `IBM_OAUTH_SCOPE` (e.g., `openid profile email`)
- `TF_BACKEND_BUCKET`, `TF_BACKEND_REGION`, `TF_MODULE_REGISTRY`
  - Optional: `TF_BACKEND_ENDPOINT` for COS S3-compatible endpoint

## Running locally
```bash
# install deps (requires network)
npm install
npm run dev
```
Visit `http://localhost:3000` and start login → select template → generate Terraform.

## Next steps to productionize
- Harden IBM OAuth session handling with a signed/encrypted server-side session store, logout, and token refresh.
- Replace Terraform stub with job queue + worker that runs `terraform plan` using COS/Schematics backend and emits signed artifact URLs.
- Add policy-as-code checks (OPA/Sentinel), `terraform fmt/validate/tflint`, and drift detection.
- Swap placeholder module sources with approved registry modules and add README generation per plan (currently stubbed sources).
- Implement status streaming (SSE/WebSocket) for plan/apply progress.
- Add persistence/TTL store for bundles beyond in-memory map (currently 30m TTL in-memory only).
