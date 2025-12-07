<template>
  <div class="page-wrapper">
    <div class="page-container">
      <!-- Hero Section -->
      <header class="home-hero">
        <div class="hero-content">
            <div class="hero-badge">
                <span class="pulse-dot"></span>
                <span>AI Architect Enabled</span>
            </div>
            <h1 class="hero-title">Build IBM Cloud<br><span class="highlight">With Ease & AI</span></h1>
            <p class="hero-sub">
                The unified developer studio. Design topologies, generate compliant Terraform, and validate architectures—all enhanced by Generative AI.
            </p>
            <div class="hero-actions">
                <NuxtLink to="/quickstart" class="primary-btn">
                  Start Project
                  <svg class="btn-icon" width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M22 16L12 26 10.6 24.6 19.2 16 10.6 7.4 12 6z" fill="currentColor"></path></svg>
                </NuxtLink>
                <NuxtLink to="/topology" class="secondary-btn">
                  Open Builder
                  <svg class="btn-icon" width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M22 16L12 26 10.6 24.6 19.2 16 10.6 7.4 12 6z" fill="currentColor"></path></svg>
                </NuxtLink>
            </div>
        </div>
        <div class="hero-visual">
            <img src="~/assets/images/ibm_ease_hero_visual.png" alt="Cloud Studio Visual" class="hero-img" onError="this.style.display='none'"/>
            <div class="visual-glow"></div>
        </div>
      </header>

      <!-- Main Features Grid -->
      <div class="section-header">
        <h2 class="section-title" style="margin-bottom: 8px;">Studio Tools</h2>
        <p>Everything you need to ship faster.</p>
      </div>

      <div class="features-grid">
        <!-- Quickstart Card (Large) -->
        <NuxtLink to="/quickstart" class="feature-card large card-blue">
          <div class="card-bg"></div>
          <div class="card-content">
            <div class="icon-wrapper">🚀</div>
            <h3>Quick Start</h3>
            <p>Generate production-ready Terraform bundles with AI assistance. Vetted templates for VPC, ROKS, and more.</p>
            <span class="link-text">Generate Config →</span>
          </div>
        </NuxtLink>

        <!-- Topology Card (Large) -->
        <NuxtLink to="/topology" class="feature-card large card-purple">
          <div class="card-bg"></div>
          <div class="card-content">
            <div class="icon-wrapper">💠</div>
            <h3>Topology Builder</h3>
            <p>Visually design your cloud architecture. Drag, drop, and connect services to auto-generate Infrastructure-as-Code.</p>
            <span class="link-text">Open Canvas →</span>
          </div>
        </NuxtLink>

        <!-- Playground Card -->
        <NuxtLink to="/playground" class="feature-card card-green">
          <div class="card-bg"></div>
          <div class="card-content">
            <div class="icon-wrapper">🧪</div>
            <h3>Playground</h3>
            <p>Interactive SDK labs & docs. Execute code directly in your browser.</p>
            <span class="link-text">Start Coding →</span>
          </div>
        </NuxtLink>

        <!-- Community Card -->
        <NuxtLink to="/community" class="feature-card card-teal">
          <div class="card-bg"></div>
          <div class="card-content">
            <div class="icon-wrapper">👥</div>
            <h3>Community</h3>
            <p>Q&A and expert best practices. Connect with IBM Cloud architects.</p>
            <span class="link-text">Join Discussion →</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Footer Stats / Info -->
      <section class="home-footer">
        <div class="stat-item">
          <span class="stat-val">100+</span>
          <span class="stat-label">Templates</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-val">v1.59</span>
          <span class="stat-label">IBM Provider</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-val">Beta</span>
          <span class="stat-label">Status</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* IBM Carbon Design Spec Implementation */
/* Layout Overrides */

/* Hero */
.home-hero {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Corrected to fit gap */
  align-items: center;
  gap: 32px;
}

@media (max-width: 1056px) {
    .home-hero {
        grid-template-columns: 1fr;
    }
    .hero-visual {
        display: none;
    }
}

.hero-actions {
  display: flex;
  gap: 16px; 
  margin-top: 8px;
}

/* Visual */
.hero-img {
    width: 100%; /* Force fill container */
    max-width: 100%; 
    height: auto;
    border-radius: 0; /* Sharp corners */
    border: 1px solid var(--cds-border-subtle);
    box-shadow: none; /* Flat design */
}

.secondary-btn:hover {
    background: #4c4c4c; /* Gray 70 */
}

.btn-icon {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
}

/* Section Header Extras */
.section-header p {
    color: var(--cds-text-secondary);
    margin: 0;
}

/* Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px; /* 1rem gap */
}

/* Carbon Tile / Card Override */
.feature-card {
  justify-content: space-between;
  min-height: 240px;
  border-top: 4px solid transparent; 
}

.feature-card:hover {
    border-color: transparent;
}

/* Card Accents */
.card-blue {
    border-top: 4px solid #0f62fe;
}
.card-purple {
    border-top: 4px solid #8a3ffc;
}
.card-green {
    border-top: 4px solid #42be65;
}
.card-teal {
    border-top: 4px solid #009d9a;
}

.feature-card.medium {
    min-height: 180px;
}

.icon-wrapper {
    width: 32px;
    height: 32px;
    margin-bottom: 24px;
    font-size: 24px;
    background: transparent;
}

.feature-card h3 {
    font-size: 20px;
    font-weight: 400;
    margin: 0 0 8px;
    color: var(--cds-text-primary);
}

.feature-card p {
    font-size: 14px;
    color: var(--cds-text-secondary);
    margin: 0 0 24px;
    line-height: 1.4;
}

.link-text {
    font-size: 14px;
    color: #4589ff; /* Blue 60 */
}

/* Stats */
.home-footer {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 64px;
    padding-top: 48px;
    border-top: 1px solid var(--cds-border-subtle);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
}

.stat-val {
    font-size: 42px;
    font-weight: 300;
    color: var(--cds-text-primary);
    line-height: 1;
}

.stat-label {
    font-size: 12px;
    font-weight: 400;
    color: var(--cds-text-secondary);
    letter-spacing: 0.32px;
    margin-top: 4px;
}

.stat-divider {
    display: none;
}

@media (max-width: 600px) {
    .features-grid {
        grid-template-columns: 1fr;
    }
    .home-hero {
        gap: 32px;
    }
}
</style>
