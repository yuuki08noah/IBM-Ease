<script setup lang="ts">
import { computed, ref } from 'vue'

const templates = ref([] as Array<{
  id: string
  name: string
  description: string
  services: string[]
  estCost: string
  category: string
}>)
const selected = ref('')
const params = ref({
  name: 'ai-chatbot-demo',
  region: 'us-south',
  resourceGroup: 'default',
  env: 'dev',
  tags: '' 
})
const deployStatus = ref<'idle' | 'planning' | 'applying' | 'done' | 'error'>('idle')
const deployResult = ref<{ plan?: string; logs?: string; downloadUrl?: string; error?: string; readme?: string }>({})
const errorMessage = ref('')

const filteredTemplates = computed(() => templates.value)

onMounted(async () => {
  const { data } = await useFetch('/api/quickstart/templates')
  if (data.value) {
    templates.value = data.value
    selected.value = data.value[0]?.id || ''
  }
})

const runDeploy = async () => {
  if (!selected.value) return
  deployStatus.value = 'planning'
  deployResult.value = {}
  errorMessage.value = ''
  const { data, error } = await useFetch('/api/quickstart/deploy', {
    method: 'POST',
    body: {
      templateId: selected.value,
      params: params.value
    }
  })
  if (error.value) {
    deployStatus.value = 'error'
    errorMessage.value = error.value?.data?.statusMessage || error.value?.statusMessage || error.value.message
    deployResult.value = { error: errorMessage.value }
    return
  }
  deployStatus.value = 'done'
  deployResult.value = data.value || {}
}

const handleAIUpdate = (data: any) => {
    // Determine the closest template match
    if (data.template) {
        // Simple fuzzy match or direct ID match
        const match = templates.value.find(t => t.id === data.template || t.id.includes(data.template))
        if (match) {
            selected.value = match.id
        }
    }
    
    // Update params
    if (data.appName) params.value.name = data.appName
    if (data.region) params.value.region = data.region
    if (data.resourceGroup) params.value.resourceGroup = data.resourceGroup
    if (data.tags) {
        params.value.tags = data.tags
    }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="page-container">
      <!-- Hero Section -->
      <section class="home-hero">
        <div class="hero-content">
          <div class="hero-header">
            <span class="hero-badge">
                <span class="pulse-dot"></span>
                <span>IBM Ease Studio</span>
            </span>
          </div>
          <h1 class="hero-title">Deploy Infrastructure<br><span class="highlight">In Minutes</span></h1>
          <p class="hero-sub">
            Generate production-ready Terraform bundles for IBM Cloud. Select a vetted template, configure parameters, and download your Infrastructure-as-Code.
          </p>
        </div>
        <!-- Optional visual similar to Home, or just keep content left-aligned if no visual -->
      </section>

      <div class="grid layout-grid">
        <!-- AI Assistant Column -->
        <div class="col-ai">
           <h3 class="section-title">AI Architect</h3>
           <div class="ai-container">
              <AIChat mode="config" @update="handleAIUpdate" />
           </div>
        </div>

        <!-- Templates Column -->
        <div class="col-templates">
          <h3 class="section-title">Select Template</h3>
          <div class="template-list">
            <button
              v-for="tpl in filteredTemplates"
              :key="tpl.id"
              class="feature-card template-card"
              :class="{ active: tpl.id === selected }"
              @click="selected = tpl.id"
            >
              <div class="card-bg"></div>
              <div class="card-content">
                <div class="flex-row" style="justify-content: space-between; align-items: flex-start; width: 100%;">
                  <div>
                     <div class="template-name">{{ tpl.name }}</div>
                     <div class="template-cat">{{ tpl.category }}</div>
                  </div>
                  <span class="radio-indicator"></span>
                </div>
                <p class="template-desc">{{ tpl.description }}</p>
                <div class="template-tags">
                   <span class="mini-tag" v-for="svc in tpl.services" :key="svc">{{ svc }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Config Column -->
        <div class="col-config">
          <h3 class="section-title">Configuration</h3>
          <section class="feature-card config-card">
             <div class="form-group">
              <label class="label">Deployment Name</label>
              <input v-model="params.name" class="input" placeholder="e.g. my-app-prod" />
              <p class="input-hint">Used for resource naming prefix</p>
             </div>
             
             <div class="form-row">
               <div class="form-group">
                <label class="label">Region</label>
                <input v-model="params.region" class="input" />
               </div>
               <div class="form-group">
                <label class="label">Resource Group</label>
                <input v-model="params.resourceGroup" class="input" />
               </div>
             </div>

             <div class="form-group">
              <label class="label">Environment</label>
              <select v-model="params.env" class="input">
                <option value="dev">Development</option>
                <option value="test">Test</option>
                <option value="prod">Production</option>
              </select>
             </div>
             
             <!-- Tags input populated by AI -->
             <div class="form-group" v-if="params.tags">
              <label class="label">Tags</label>
              <input v-model="params.tags" class="input" readonly />
             </div>

             <div v-if="errorMessage" class="error-banner">
               {{ errorMessage }}
             </div>

             <button class="primary-btn full-width" @click="runDeploy" :disabled="deployStatus === 'planning'">
               {{ deployStatus === 'planning' ? 'Processing...' : 'Generate & Download' }}
             </button>
          </section>

          <!-- Status / Output -->
          <section v-if="deployStatus !== 'idle'" class="feature-card output-card">
              <div class="output-header">
                <h4>Generation Status</h4>
                <span class="status-pill" :class="{ success: deployStatus === 'done' }">
                  {{ deployStatus === 'done' ? 'Ready' : deployStatus === 'error' ? 'Failed' : 'Processing' }}
                </span>
              </div>
              
              <div v-if="deployStatus === 'done'" class="output-content">
                 <p style="font-size: 14px; margin-bottom: 12px; color: #c6c6c6;">✅ Your Terraform bundle is ready.</p>
                 <a v-if="deployResult.downloadUrl" :href="deployResult.downloadUrl" class="download-link">
                   Download .zip
                 </a>
              </div>
              <div v-else-if="deployStatus === 'error'" class="output-content error">
                {{ deployResult.error }}
              </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped Styles for Quickstart unique layout */

.hero-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

/* Layout */
.layout-grid {
  display: grid;
  grid-template-columns: 350px 1fr 320px; /* AI | Templates | Config */
  gap: 24px;
}

@media (max-width: 1100px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}

/* AI Column */
.ai-container {
    height: 600px;
    border: 1px solid var(--cds-border-subtle);
    border-radius: 0;
    background: #262626;
    overflow: hidden; 
}

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}

/* Template Cards Extras */
.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.template-card {
  cursor: pointer;
  /* inherits .feature-card styles */
}

/* Active State for Template Card */
.template-card.active {
    border: 1px solid #0f62fe; /* Blue 60 */
    background: #353535;
}

.template-name {
    font-size: 16px;
    font-weight: 400;
    color: #f4f4f4;
    margin-bottom: 4px;
}

.template-cat {
    font-size: 12px;
    color: #c6c6c6;
    text-transform: uppercase;
    margin-bottom: 8px;
}

.template-desc {
    font-size: 14px;
    color: #c6c6c6;
    margin: 12px 0;
    line-height: 1.4;
}

/* Radio Indicator for Selection */
.radio-indicator {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid #8d8d8d;
    background: transparent;
    flex-shrink: 0;
}

.template-card.active .radio-indicator {
    border-color: #0f62fe;
    background: #0f62fe;
    box-shadow: inset 0 0 0 2px #262626;
}

/* Tags */
.template-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
}

.mini-tag {
    font-size: 12px;
    background: #393939;
    color: #c6c6c6;
    padding: 2px 8px;
    border-radius: 12px;
}

/* Config Column */
.config-card {
    padding: 24px;
    display: block;
}

.output-card {
    margin-top: 24px;
    display: block;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #393939;
  margin-bottom: 16px;
}

.output-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #f4f4f4;
}

.download-link {
  display: block;
  text-align: center;
  background: #24a148; /* Green 60 */
  color: #ffffff;
  font-weight: 600;
  padding: 12px;
  text-decoration: none;
  transition: all 70ms;
}

.download-link:hover {
  background: #198038; /* Green 70 */
}
</style>
