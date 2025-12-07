<template>
  <div>
    <header class="app-header">
      <div class="app-header__bar">
        <div class="app-header__content">
          <div class="brand-section">
            <NuxtLink to="/" class="brand">
              <img src="/logo/image.png" alt="IBM Ease" class="logo-img" />
              <div class="brand-text">
                <strong>IBM Ease</strong>
              </div>
            </NuxtLink>
            <nav class="nav">
              <NuxtLink to="/" class="nav-link">Home</NuxtLink>
              <NuxtLink to="/quickstart" class="nav-link">Quick Start</NuxtLink>
              <NuxtLink to="/topology" class="nav-link">Topology</NuxtLink>
              <NuxtLink to="/playground" class="nav-link">Playground</NuxtLink>
              <NuxtLink to="/community" class="nav-link">Community</NuxtLink>
            </nav>
          </div>

          <div class="meta-section">
            <div class="pills">
               <span class="badge">v1.0</span>
            </div>
            <div class="auth-slot">
              <AuthStatus />
            </div>
          </div>
        </div>
      </div>
    </header>
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.app-header {
  background: #161616;
  color: #f4f4f4;
  border-bottom: 1px solid #393939;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo {
  font-weight: 700;
  font-size: 18px;
}

.logo-img {
  height: 24px;
  width: auto;
  object-fit: contain;
}

.app-header__bar {
  background: transparent;
  padding: 0;
}

.app-header__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 32px; /* Restored visible margin */
  max-width: 1500px; /* Constrained width */
  margin: 0 auto;
  width: 100%;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 100%;
}

.meta-section {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand-text strong {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
}

.nav {
  display: flex;
  gap: 0;
  align-items: center;
  height: 100%;
}

.nav-link {
  color: #c6c6c6;
  text-decoration: none;
  font-weight: 400;
  font-size: 14px;
  padding: 0 16px;
  height: 48px;
  display: flex;
  align-items: center;
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
  transition: background 0.1s, color 0.1s;
}

.nav-link:hover {
  background: #262626;
  color: white;
}

.router-link-active {
  color: white;
  border-bottom-color: var(--cds-primary, #0f62fe);
  font-weight: 600;
  background: #262626;
}

.pills {
  display: flex;
  align-items: center;
}

.badge {
  background: rgba(255, 255, 255, 0.15);
  color: #f4f4f4;
  border: none;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 100px;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.auth-slot {
  display: flex;
  align-items: center;
  height: 100%;
}
</style>
