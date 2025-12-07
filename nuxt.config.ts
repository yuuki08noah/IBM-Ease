import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,

  typescript: {
    strict: true
  },

  devtools: { enabled: false },

  runtimeConfig: {
    ibmOauth: {
      clientId: process.env.IBM_OAUTH_CLIENT_ID,
      clientSecret: process.env.IBM_OAUTH_CLIENT_SECRET,
      authorizeUrl: process.env.IBM_OAUTH_AUTHORIZE_URL,
      tokenUrl: process.env.IBM_OAUTH_TOKEN_URL,
      userinfoUrl: process.env.IBM_OAUTH_USERINFO_URL,
      redirectUri: process.env.IBM_OAUTH_REDIRECT_URI,
      scope: process.env.IBM_OAUTH_SCOPE || 'openid profile email'
    },
    googleOauth: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
    },
    sessionSecret: process.env.SESSION_SECRET,
    terraform: {
      backendBucket: process.env.TF_BACKEND_BUCKET,
      backendRegion: process.env.TF_BACKEND_REGION,
      registry: process.env.TF_MODULE_REGISTRY || 'registry.terraform.io/ibm-cloud'
    },
    public: {
      appName: 'IBM Ease'
    }
  },

  css: ['~/assets/styles/global.scss'],
  compatibilityDate: '2025-12-02'
})