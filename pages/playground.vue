<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { marked } from 'marked'

interface LabSummary {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  steps: number
  category: string
}

interface LabStep {
  id: number
  title: string
  description: string
  hint: string
  starterCode: string
  validation?: any
}

interface LabDetail {
  id: string
  title: string
  description: string
  difficulty: string
  duration: string
  category: string
  language: 'javascript' | 'python'
  steps: LabStep[]
}

// Data fetching
const { data: labs } = await useFetch('/api/playground/labs', {
  default: () => [] as LabSummary[]
})

const selectedLab = ref<LabDetail | null>(null)
const currentStep = ref(1)
const completedSteps = ref<number[]>([])
const code = ref('')
const output = ref('')
const isRunning = ref(false)

// Manual Credentials
const showCredsModal = ref(false)
const showMissingCredsModal = ref(false)
const localApiKey = ref('')
const tempApiKey = ref('')

const saveCredentials = () => {
    if (tempApiKey.value.trim().startsWith('3')) { // Basic check
        localApiKey.value = tempApiKey.value.trim()
        showCredsModal.value = false
    } else {
        alert('Invalid API Key format (usually starts with "3")')
    }
}

// Demo State (Kept for compatibility, though tab/layout might change)
const activeTab = ref<'labs' | 'demo'>('labs')
const selectedModel = ref<'gemini' | 'watson'>('gemini')
const chatInput = ref('')
const chatHistory = ref<{role: 'user'|'model', text: string}[]>([])
const isChatLoading = ref(false)
const chatError = ref('')
const watsonSessionId = ref('')
const chatHistoryRef = ref<HTMLElement | null>(null)

// Computed
const currentStepData = computed(() => {
  if (!selectedLab.value) return null
  return selectedLab.value.steps.find(s => s.id === currentStep.value)
})

const renderedMarkdown = computed(() => {
  if (!currentStepData.value) return ''
  return marked.parse(currentStepData.value.description)
})

const selectModel = (model: 'gemini' | 'watson') => {
  selectedModel.value = model
  chatHistory.value = []
  chatError.value = ''
  watsonSessionId.value = ''
}

const sendMessage = async () => {
  if (!chatInput.value) return

  const userText = chatInput.value
  chatHistory.value.push({ role: 'user', text: userText })
  chatInput.value = ''
  isChatLoading.value = true
  chatError.value = ''

  try {
    const endpoint = selectedModel.value === 'gemini'
      ? '/api/playground/demo/gemini'
      : '/api/playground/demo/watson'

    let body: any = {}

    if (selectedModel.value === 'gemini') {
      body = {
        action: 'chat',
        message: userText,
        history: chatHistory.value.slice(0, -1).map(h => ({
           role: h.role,
           parts: h.text
        }))
      }
    } else {
        body = {
            action: 'send_message',
            message: userText,
            sessionId: watsonSessionId.value
        }
    }

    const { data, error } = await useFetch(endpoint, {
      method: 'POST',
      body
    })

    if (error.value) {
      throw new Error(error.value.statusMessage || 'API Error')
    }

    const result = data.value as any

    if (selectedModel.value === 'watson') {
        if (result.success) {
            chatHistory.value.push({ role: 'model', text: result.response })
            if (result.sessionId) {
                watsonSessionId.value = result.sessionId
            }
        } else {
            throw new Error(result.error)
        }
    } else {
        if (result.success) {
            chatHistory.value.push({ role: 'model', text: result.response })
        } else {
             throw new Error(result.error)
        }
    }

  } catch (err: any) {
    chatError.value = err.message
    if (selectedModel.value === 'watson' && err.message?.includes('401')) {
        chatError.value = 'Authentication failed. Please check your credentials.'
    }
  } finally {
    isChatLoading.value = false
    nextTick(() => {
        if (chatHistoryRef.value) {
            chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
        }
    })
  }
}

const selectLab = async (lab: LabSummary) => {
  const { data } = await useFetch(`/api/playground/labs/${lab.id}`)
  if (data.value) {
    selectedLab.value = data.value as LabDetail

    const { data: progress } = await useFetch(`/api/playground/progress/${lab.id}`)
    if (progress.value) {
      completedSteps.value = (progress.value as any).completedSteps || []
      currentStep.value = (progress.value as any).currentStep || 1
    } else {
      completedSteps.value = []
      currentStep.value = 1
    }

    loadStepCode()
  }
}

const loadStepCode = () => {
  if (!selectedLab.value) return
  const step = selectedLab.value.steps.find(s => s.id === currentStep.value)
  if (step) {
    code.value = step.starterCode
    output.value = ''
  }
}

const runCode = async () => {
  if (!selectedLab.value) return

  // Check for credentials
  if (!localApiKey.value) {
      showMissingCredsModal.value = true
      return
  }

  isRunning.value = true
  output.value = '⏳ Running code in sandbox...\n'

  const { data, error } = await useFetch('/api/playground/execute', {
    method: 'POST',
    body: {
      code: code.value,
      language: selectedLab.value.language,
      labId: selectedLab.value.id,
      stepId: currentStep.value,
      env: localApiKey.value ? { IAM_API_KEY: localApiKey.value } : undefined
    }
  })

  // ... rest of existing logic ...
  if (error.value) {
    output.value = `❌ Execution failed:\n${error.value.message}`
    isRunning.value = false
    return
  }

  const result = data.value as any
  if (result.success) {
    output.value = `✓ Code executed successfully (${result.executionTime}ms)\n\n${result.output}`

    if (!completedSteps.value.includes(currentStep.value)) {
      completedSteps.value.push(currentStep.value)
      await saveProgress()
    }
  } else {
    output.value = `❌ Execution failed:\n\nOutput:\n${result.output}\n\nError:\n${result.error}`
  }

  isRunning.value = false
}

const simulateExecution = async () => {
    showMissingCredsModal.value = false
    isRunning.value = true
    output.value = '⏳ Simulating execution (Offline Mode)...\n'
    
    // Fake delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    output.value = `✓ [SIMULATION] Code executed successfully (Mock)\n\n> Note: This was a simulated run because no API Key was provided.\n> Resources were not actually created on IBM Cloud.\n\nMock Output:\nResource 'example-instance' created.\nID: crn:v1:bluemix:public:service:us-south:a/account:instance::`
    
    if (!completedSteps.value.includes(currentStep.value)) {
      completedSteps.value.push(currentStep.value)
      await saveProgress() // This saves local progress, which is fine
    }
    
    isRunning.value = false
}

const saveProgress = async () => {
  if (!selectedLab.value) return

  await useFetch(`/api/playground/progress/${selectedLab.value.id}`, {
    method: 'POST',
    body: {
      completedSteps: completedSteps.value,
      currentStep: currentStep.value
    }
  })
}

const nextStep = () => {
  if (!selectedLab.value || currentStep.value >= selectedLab.value.steps.length) return
  currentStep.value++
  loadStepCode()
  saveProgress()
}

const prevStep = () => {
  if (currentStep.value <= 1) return
  currentStep.value--
  loadStepCode()
  saveProgress()
}
</script>

<template>
  <div class="page-wrapper">
    <!-- Main Content Area -->
    <div v-if="!selectedLab || activeTab === 'demo'" class="catalog-view">
      <div class="page-container">
        <!-- Header -->
        <section class="page-header">
           <div class="header-content">
            <div class="breadcrumb">
              <NuxtLink to="/" class="breadcrumb-link">Home</NuxtLink> / Playground
            </div>
            <h1 class="page-title">Interactive Learning Playground</h1>
            <p class="page-sub">Hands-on labs and live AI demos. Run code directly in your browser.</p>
          </div>
          <div class="tab-controls">
            <button 
              :class="activeTab === 'labs' ? 'tab-btn active' : 'tab-btn'" 
              @click="activeTab = 'labs'"
            >Labs</button>
            <button 
              :class="activeTab === 'demo' ? 'tab-btn active' : 'tab-btn'" 
              @click="activeTab = 'demo'"
            >AI Demo</button>
          </div>
        </section>

        <!-- Active Tab Content -->
        <div v-if="activeTab === 'demo'">
             <section class="content-section">
              <div class="section-header">
                <h3>AI Assistant Demo</h3>
                <p>Chat with enterprise-grade AI models.</p>
              </div>
              
              <div class="split-view">
                 <!-- Model Selection Sidebar -->
                 <div class="model-list">
                    <div 
                      class="model-card" 
                      :class="{ active: selectedModel === 'gemini' }"
                      @click="selectModel('gemini')"
                    >
                      <div class="model-header">
                        <h4>Google Gemini</h4>
                        <span class="badge">Recommended</span>
                      </div>
                      <p class="model-desc">Multimodal generative AI (Flash 2.5)</p>
                      <div class="model-meta">No Login Required</div>
                    </div>
                    
                    <div 
                      class="model-card" 
                      :class="{ active: selectedModel === 'watson' }"
                      @click="selectModel('watson')"
                    >
                       <div class="model-header">
                        <h4>IBM Watson</h4>
                        <span class="badge">Enterprise</span>
                      </div>
                      <p class="model-desc">Conversational AI Assistant</p>
                      <div class="model-meta warning">Requires IBM Login</div>
                    </div>
                 </div>

                 <!-- Chat Area -->
                 <div class="chat-interface">
                    <div class="chat-history" ref="chatHistoryRef">
                      <div v-if="chatHistory.length === 0" class="empty-state">
                        <p>Start a conversation with {{ selectedModel === 'gemini' ? 'Gemini' : 'Watson' }}!</p>
                      </div>
                      <div 
                        v-for="(msg, idx) in chatHistory" 
                        :key="idx" 
                        class="chat-message"
                        :class="msg.role"
                      >
                        <div class="message-role">{{ msg.role === 'user' ? 'You' : 'AI' }}</div>
                        <div class="message-content">{{ msg.text }}</div>
                      </div>
                      <div v-if="isChatLoading" class="chat-message model loading">
                        <div class="typing-indicator"><span></span><span></span><span></span></div>
                      </div>
                    </div>
                    <div class="chat-input-area">
                      <input 
                        v-model="chatInput" 
                        @keyup.enter="sendMessage"
                        placeholder="Type your message..."
                        :disabled="isChatLoading"
                        class="chat-input"
                      />
                      <button class="primary-btn small" @click="sendMessage" :disabled="!chatInput || isChatLoading">Send</button>
                    </div>
                    <p v-if="chatError" class="error-text">{{ chatError }}</p>
                 </div>
              </div>
            </section>
        </div>

        <div v-else>
           <section class="content-section">
              <div class="section-header">
                 <h3>Available Labs</h3>
                 <p>Select a guided tutorial to start coding.</p>
              </div>
              <div class="lab-grid">
                <div
                  v-for="lab in labs"
                  :key="lab.id"
                  class="feature-card lab-card"
                  @click="selectLab(lab)"
                >
                  <div class="card-bg"></div>
                  <div class="card-content">
                      <div class="lab-header">
                         <span class="status-pill" :class="lab.difficulty">{{ lab.difficulty }}</span>
                         <span class="category-tag">{{ lab.category }}</span>
                      </div>
                      <h4 class="lab-title">{{ lab.title }}</h4>
                      <p class="lab-desc">{{ lab.description }}</p>
                      <div class="lab-meta">
                        <span>⏱️ {{ lab.duration }}</span>
                        <span>📋 {{ lab.steps }} steps</span>
                      </div>
                  </div>
                </div>
              </div>
            </section>
        </div>
      </div>
    </div>

    <!-- Workspace View (Split Pane) -->
    <div v-else class="workspace-view">
       <!-- Top Bar -->
       <header class="workspace-header">
          <div class="left-controls">
             <button class="icon-btn" @click="selectedLab = null">
              ← Back
            </button>
            <div class="workspace-titles">
               <h2>{{ selectedLab.title }}</h2>
               <span class="step-badge">Step {{ currentStep }} / {{ selectedLab.steps.length }}</span>
            </div>
          </div>
          <div class="header-actions" style="display: flex; gap: 8px;">
              <div v-if="localApiKey" title="Credentials Set" style="color: #42be65; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                  🔒 Credentials Active
                  <button @click="localApiKey = ''" style="background:none; border:none; color: #8d8d8d; cursor: pointer;">×</button>
              </div>
              <button v-else class="secondary-btn small" @click="showCredsModal = true">Set Credentials</button>
          </div>
       </header>

       <!-- Credentials Modal -->
       <div v-if="showCredsModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100;">
           <div class="card" style="width: 400px; background: #262626; border: 1px solid #393939;">
               <h3 class="card-title">Session Credentials</h3>
               <p style="font-size: 13px; color: #c6c6c6; margin-bottom: 16px;">
                   Enter your IBM Cloud API Key to run this code. This key is used only for this session and is not stored permanently.
               </p>
               <input 
                   v-model="tempApiKey" 
                   type="password" 
                   placeholder="IBM Cloud API Key"
                   style="width: 100%; margin-bottom: 16px; padding: 8px; background: #393939; border: 1px solid #525252; color: #fff;"
               />
               <div style="display: flex; justify-content: flex-end; gap: 8px;">
                   <button class="secondary-btn" @click="showCredsModal = false">Cancel</button>
                   <button class="primary-btn" @click="saveCredentials">Save</button>
               </div>
           </div>
       </div>

       <!-- Missing Credentials Modal -->
       <div v-if="showMissingCredsModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100;">
           <div class="card" style="width: 450px; background: #262626; border: 1px solid #393939; padding: 24px;">
               <div style="margin-bottom: 24px;">
                   <h3 class="card-title" style="font-size: 18px; margin-bottom: 8px;">Authentication Required</h3>
                   <p style="font-size: 14px; color: #c6c6c6; line-height: 1.5;">
                       To execute code against real IBM Cloud resources, an API Key is required.
                   </p>
               </div>
               
               <div style="display: flex; flex-direction: column; gap: 12px;">
                   <button class="primary-btn" @click="{ showMissingCredsModal = false; showCredsModal = true }" style="display: flex; justify-content: space-between; align-items: center;">
                       <span>Enter API Key</span>
                       <span style="font-size: 12px; font-weight: normal; opacity: 0.8;">Full Execution</span>
                   </button>
                   
                   <div style="text-align: center; font-size: 12px; color: #8d8d8d;">— OR —</div>
                   
                   <button class="secondary-btn" @click="simulateExecution" style="display: flex; justify-content: space-between; align-items: center; border: 1px dashed #525252;">
                       <span>Simulate Execution</span>
                       <span style="font-size: 12px; font-weight: normal; opacity: 0.8;">Offline Mode</span>
                   </button>
               </div>
               
               <div style="margin-top: 24px; display: flex; justify-content: center;">
                   <button @click="showMissingCredsModal = false" style="background: none; border: none; color: #8d8d8d; font-size: 13px; cursor: pointer; text-decoration: underline;">Cancel</button>
               </div>
           </div>
       </div>

       <!-- Split Pane Content -->
       <main class="workspace-body">
          <!-- Left: Documentation -->
          <aside class="doc-pane">
             <div class="doc-content markdown-body" v-html="renderedMarkdown"></div>
             
             <div class="doc-nav">
                <button class="secondary-btn" :disabled="currentStep === 1" @click="prevStep">
                  ← Previous
                </button>
                <div class="spacer"></div>
                 <button 
                  class="primary-btn" 
                  :disabled="currentStep === selectedLab.steps.length" 
                  @click="nextStep"
                >
                  Next Step →
                </button>
             </div>
          </aside>

          <!-- Right: Code & Output -->
          <section class="code-pane">
              <!-- Editor -->
              <div class="editor-container">
                  <div class="pane-header">
                    <span class="file-name">main.js</span>
                    <button class="run-btn" @click="runCode" :disabled="isRunning">
                        {{ isRunning ? 'Running...' : '▶ Run Code' }}
                    </button>
                  </div>
                  <textarea
                    v-model="code"
                    class="code-editor"
                    spellcheck="false"
                  ></textarea>
              </div>
              
              <!-- Terminal/Output -->
              <div class="terminal-container">
                  <div class="pane-header small">
                    <span class="pane-title">Terminal Output</span>
                    <button class="clear-btn" @click="output = ''">Clear</button>
                  </div>
                  <div class="terminal-body">
                       <pre v-if="output" class="output-text">{{ output }}</pre>
                       <div v-else class="output-placeholder">Run code to see output...</div>
                  </div>
              </div>
          </section>
       </main>
    </div>
  </div>
</template>

<style scoped>
/* Base Layout */
.page-wrapper {
  background-color: #161616;
  min-height: calc(100vh - 48px);
  color: #f4f4f4;
  font-family: 'IBM Plex Sans', sans-serif;
  display: flex;
  flex-direction: column;
}

/* Catalog View (Home/List) */
.catalog-view {
    flex: 1;
}

.page-container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 64px 32px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* Header & Tabs (Same as before) */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 24px;
    border-bottom: 1px solid #393939;
}
.page-title { font-size: 42px; font-weight: 300; margin: 0 0 8px; color: #f4f4f4; }
.page-sub { font-size: 16px; color: #c6c6c6; margin: 0; }
.breadcrumb { font-size: 14px; color: #c6c6c6; margin-bottom: 16px; }
.breadcrumb-link { color: #4589ff; text-decoration: none; }

.tab-controls { display: flex; gap: 0; background: #262626; }
.tab-btn { background: transparent; border: none; color: #c6c6c6; padding: 13px 24px; cursor: pointer; font-size: 14px; border-bottom: 2px solid transparent; }
.tab-btn:hover { background: #353535; color: #f4f4f4; }
.tab-btn.active { color: #f4f4f4; border-bottom: 2px solid #0f62fe; font-weight: 600; }

/* Grid & Cards */
.lab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.feature-card { background: #262626; padding: 16px; cursor: pointer; min-height: 200px; transition: background-color 70ms; display: flex; flex-direction: column; }
.feature-card:hover { background: #353535; }
.lab-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.lab-title { font-size: 20px; font-weight: 400; margin: 0 0 8px; color: #f4f4f4; }
.lab-desc { font-size: 14px; color: #c6c6c6; line-height: 1.4; flex: 1; }
.lab-meta { margin-top: 16px; font-size: 12px; color: #8d8d8d; display: flex; gap: 16px; }
.status-pill { font-size: 12px; padding: 2px 8px; border-radius: 10px; background: #393939; color: #f4f4f4; text-transform: capitalize; }
.status-pill.beginner { border-left: 3px solid #42be65; }
.category-tag { font-size: 12px; color: #4589ff; border: 1px solid #4589ff; padding: 1px 8px; border-radius: 10px; }

/* WORKSPACE VIEW (New Split Layout) */
.workspace-view {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 48px); /* Full height minus global nav if any */
    background: #161616;
}

.workspace-header {
    height: 48px;
    background: #262626;
    border-bottom: 1px solid #393939;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    flex-shrink: 0;
}

.left-controls {
    display: flex;
    align-items: center;
    gap: 16px;
}

.icon-btn {
    background: none;
    border: none;
    color: #c6c6c6;
    cursor: pointer;
    font-size: 14px;
}
.icon-btn:hover { color: #f4f4f4; }

.workspace-titles h2 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    display: inline-block;
    margin-right: 12px;
}

.step-badge {
    font-size: 12px;
    background: #393939;
    padding: 2px 8px;
    border-radius: 4px;
    color: #c6c6c6;
}

.workspace-body {
    flex: 1;
    display: flex;
    overflow: hidden;
}

/* Documentation Pane (Left) */
.doc-pane {
    flex: 1;
    min-width: 400px;
    max-width: 50%; /* Adjust as needed */
    border-right: 1px solid #393939;
    display: flex;
    flex-direction: column;
    background: #161616;
}

.doc-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    line-height: 1.6;
}

/* Markdown Styling mimicry inside .markdown-body */
:deep(.markdown-body h3) { font-size: 24px; font-weight: 300; margin-bottom: 16px; color: #f4f4f4; }
:deep(.markdown-body p) { margin-bottom: 16px; font-size: 16px; color: #c6c6c6; }
:deep(.markdown-body ul) { margin-bottom: 16px; padding-left: 20px; color: #c6c6c6; }
:deep(.markdown-body li) { margin-bottom: 8px; }
:deep(.markdown-body code) { background: #262626; padding: 2px 4px; border-radius: 2px; font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: #a8a8a8; }
:deep(.markdown-body pre) { background: #262626; padding: 16px; border-radius: 4px; overflow-x: auto; margin-bottom: 16px; }
:deep(.markdown-body pre code) { background: transparent; padding: 0; color: #f4f4f4; }
:deep(.markdown-body blockquote) { border-left: 4px solid #0f62fe; padding-left: 16px; margin: 0 0 16px; color: #8d8d8d; font-style: italic; }
:deep(.markdown-body strong) { color: #f4f4f4; font-weight: 600; }

.doc-nav {
    padding: 16px 32px;
    border-top: 1px solid #393939;
    display: flex;
    justify-content: space-between;
    background: #161616;
}

/* Code Pane (Right) */
.code-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #1e1e1e; /* Slightly lighter than doc pane for contrast */
}

.editor-container {
    flex: 2; /* Takes up 2/3 of vertical space */
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid #393939;
}

.terminal-container {
    flex: 1; /* Takes up 1/3 */
    display: flex;
    flex-direction: column;
    background: #161616;
}

.pane-header {
    background: #262626;
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #393939;
}
.pane-header.small { padding: 4px 16px; min-height: 32px; }

.file-name { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #c6c6c6; }
.pane-title { font-size: 12px; font-weight: 600; color: #8d8d8d; text-transform: uppercase; }

.run-btn {
    background: #0f62fe;
    color: white;
    border: none;
    padding: 6px 16px;
    font-size: 12px;
    cursor: pointer;
    font-weight: 600;
}
.run-btn:hover { background: #0353e9; }
.run-btn:disabled { background: #393939; cursor: not-allowed; }

.clear-btn { background: none; border: none; color: #8d8d8d; font-size: 12px; cursor: pointer; }
.clear-btn:hover { color: #f4f4f4; }

.code-editor {
    flex: 1;
    width: 100%;
    background: #1e1e1e;
    color: #f4f4f4;
    border: none;
    padding: 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 14px;
    resize: none;
    line-height: 1.5;
}
.code-editor:focus { outline: none; }

.terminal-body {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
}
.output-text { color: #f4f4f4; margin: 0; white-space: pre-wrap; }
.output-placeholder { color: #525252; font-style: italic; }

/* Demo Mode Styling (kept simplified) */
.model-list { display: flex; flex-direction: column; gap: 16px; }
.model-card { background: #262626; padding: 16px; cursor: pointer; }
.model-card.active { border: 2px solid #0f62fe; }
.chat-interface { background: #262626; height: 600px; display: flex; flex-direction: column; }
.chat-history { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.chat-message.user { align-self: flex-end; background: #0f62fe; padding: 12px 16px; color: white; }
.chat-message.model { align-self: flex-start; background: #393939; padding: 12px 16px; color: #f4f4f4; }
.chat-input-area { padding: 16px; background: #393939; display: flex; gap: 8px;}
.chat-input { flex: 1; padding: 12px; background: #262626; border: none; color: white; }
.primary-btn { background: #0f62fe; color: white; border: none; padding: 14px 24px; cursor: pointer; }
.secondary-btn { background: #393939; color: white; border: none; padding: 14px 24px; cursor: pointer; }
</style>
