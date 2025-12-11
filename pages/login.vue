<script setup lang="ts">
const errorMessage = ref('')
const isDev = process.env.NODE_ENV === 'development'

const start = async (provider: string) => {
  errorMessage.value = ''
  const { data, error } = await useFetch(`/api/auth/login?provider=${provider}`)
  if (error.value) {
    errorMessage.value = error.value?.data?.statusMessage || error.value?.statusMessage || 'Login failed. Check OAuth config.'
    return
  }
  if (data.value?.redirect) {
    window.location.href = data.value.redirect
  } else {
    errorMessage.value = 'Missing redirect URL. Check OAuth config.'
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="login-container">
      <div class="login-grid">
        <!-- Main Login Pane -->
        <div class="feature-card login-pane">
          <div class="pane-header">
            <img src="/logo/image.png" alt="IBM Ease" class="logo-img" />
            <div>
              <p class="eyebrow">IBM Ease</p>
              <h1>Sign in with IBM OAuth</h1>
            </div>
          </div>
          
          <p class="login-sub">
            Secure entry with IBMid/OIDC (PKCE). You’ll be redirected to IBM Authorization and returned to IBM Ease.
          </p>

          <div class="login-meta">
            <span class="hero-badge">PKCE</span>
            <span class="hero-badge">IBMid/OIDC</span>
            <span class="hero-badge">HTTP-only cookie</span>
          </div>

          <div class="login-actions">
            <button class="primary-btn" @click="start('ibm')">
              Continue with IBM ID
              <svg class="btn-icon-right" width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M22 16L12 26 10.6 24.6 19.2 16 10.6 7.4 12 6z" fill="currentColor" /></svg>
            </button>
            <button class="secondary-btn" @click="start('google')">
              Continue with Google
            </button>
            <!-- Dev Login -->
            <button v-if="isDev" class="ghost-btn" style="color: var(--cds-support-warning)" @click="start('mock')">
              Dev Login
            </button>
            <button class="ghost-btn" @click="$router.push('/')">Back home</button>
          </div>

          <p class="hint" v-if="!errorMessage">If redirection does not start, click “Continue”.</p>
          <p class="hint error" v-else>{{ errorMessage }}</p>
        </div>

        <!-- Side Pane -->
        <div class="login-side">
          <p class="eyebrow muted">Security Controls</p>
          <ul class="bullet">
            <li>PKCE + short-lived access token</li>
            <li>HTTP-only session cookie (no tokens in JS)</li>
            <li>IBMid userinfo for profile hydration</li>
          </ul>
          <div class="side-badges">
            <span class="status-pill">Zero trust</span>
            <span class="status-pill">IBM Cloud</span>
            <span class="status-pill">Audit-ready</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 64px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 48px);
}

.login-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 32px;
  width: 100%;
}

@media (max-width: 768px) {
  .login-grid {
    grid-template-columns: 1fr;
  }
}

.login-pane {
  background: var(--cds-layer);
  /* feature-card already handles padding and base styles, but we can override if needed */
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-top: 4px solid var(--cds-primary); /* Match home card accent style */
}

/* Override feature-card hover effect for this static form */
.login-pane:hover {
  background: var(--cds-layer);
}

.pane-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.pane-header h1 {
  font-size: 28px;
  font-weight: 300;
  margin: 4px 0 0;
  color: var(--cds-text-primary);
  line-height: 1.25;
}

.eyebrow {
  font-size: 12px;
  font-weight: 400;
  color: var(--cds-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.eyebrow.muted {
  color: var(--cds-text-secondary);
  margin-bottom: 16px;
}

.login-sub {
  font-size: 16px;
  color: var(--cds-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.login-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.login-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}

.btn-icon-right {
  margin-left: 8px;
}

.hint {
  font-size: 12px;
  color: var(--cds-text-secondary);
  margin: 0;
}

.hint.error {
  color: var(--cds-danger);
}

.login-side {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--cds-layer-accent);
  border: 1px solid var(--cds-border-subtle);
  /* Match height with main pane if aligned, but height: fit-content is fine */
  height: fit-content;
}

.bullet {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}

.bullet li {
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--cds-text-secondary);
  display: flex;
  align-items: flex-start;
}

.bullet li::before {
  content: "•";
  color: var(--cds-primary);
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
}

.side-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Reusing hero-badge from global, or re-declaring if scoped affects it (Vue scoped styles apply to local elements, but global classes work if defined globally. Since hero-badge is in global.scss, we can use it directly.) */
/* But wait, I need to make sure global classes are accessible. Yes they are. */

</style>
