<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

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

const labs = ref<LabSummary[]>([])
const selectedLab = ref<LabDetail | null>(null)
const currentStep = ref(1)
const completedSteps = ref<number[]>([])
const code = ref('')
const output = ref('')
const isRunning = ref(false)

// Demo State
const activeTab = ref<'labs' | 'demo'>('labs')
const selectedModel = ref<'gemini' | 'watson'>('gemini')
const chatInput = ref('')
const chatHistory = ref<{role: 'user'|'model', text: string}[]>([])
const isChatLoading = ref(false)
const chatError = ref('')
const watsonSessionId = ref('') // Store Watson Session ID
const chatHistoryRef = ref<HTMLElement | null>(null)


const selectModel = (model: 'gemini' | 'watson') => {
  selectedModel.value = model
  chatHistory.value = []
  chatError.value = ''
  watsonSessionId.value = '' // Reset session on model switch
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
        // Watson
        body = {
            action: 'send_message',
            message: userText,
            sessionId: watsonSessionId.value // Send existing session if we have one
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
                watsonSessionId.value = result.sessionId // Update session ID
            }
        } else {
            throw new Error(result.error)
        }
    } else {
        // Gemini
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

onMounted(async () => {
  const { data } = await useFetch('/api/playground/labs')
  if (data.value) {
    labs.value = data.value as LabSummary[]
  }
})

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

  isRunning.value = true
  output.value = '⏳ Running code in sandbox...\n'

  const { data, error } = await useFetch('/api/playground/execute', {
    method: 'POST',
    body: {
      code: code.value,
      language: selectedLab.value.language,
      labId: selectedLab.value.id,
      stepId: currentStep.value
    }
  })

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

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'var(--ibm-green-50)'
    case 'intermediate': return 'var(--ibm-blue-60)'
    case 'advanced': return 'var(--ibm-purple-60)'
    default: return 'var(--ibm-gray-50)'
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="page-container">
      <!-- Header Section -->
      <section class="page-header">
        <div class="header-content">
           <div class="breadcrumb">
            <NuxtLink to="/" class="breadcrumb-link">Home</NuxtLink> / Playground
          </div>
          <h1 class="page-title">Interactive Learning Playground</h1>
          <p class="page-sub">Hands-on labs and live AI demos. Execute secure code in a sandboxed environment.</p>
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

      <div v-else-if="!selectedLab">
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

      <div v-else class="lab-workspace">
        <!-- Lab Header area -->
        <section class="lab-header-section">
          <button class="ghost-btn" @click="selectedLab = null">← Back to labs</button>
          <div class="lab-info">
             <div>
                <h2 class="active-lab-title">{{ selectedLab.title }}</h2>
                <div class="step-progress">
                    <div class="progress-track">
                        <div class="progress-bar" :style="{ width: (currentStep / selectedLab.steps.length * 100) + '%' }"></div>
                    </div>
                    <span class="step-count">Step {{ currentStep }} / {{ selectedLab.steps.length }}</span>
                </div>
             </div>
             <div class="lab-status">
                <span v-if="completedSteps.includes(currentStep)" class="status-badge success">✓ Completed</span>
                <span v-else class="status-badge pending">In Progress</span>
             </div>
          </div>
          <p class="active-lab-desc">{{ selectedLab.description }}</p>
        </section>

        <!-- Lab Content Split -->
        <div class="editor-layout">
          <section class="editor-pane">
            <div class="pane-header">
                <h4>Code Editor</h4>
                <div class="pane-actions">
                    <button class="secondary-btn small" @click="loadStepCode">Reset</button>
                    <button class="primary-btn small" @click="runCode" :disabled="isRunning">
                        {{ isRunning ? 'Running...' : '▶ Run Code' }}
                    </button>
                </div>
            </div>
            <textarea
              v-model="code"
              class="code-editor"
              spellcheck="false"
            ></textarea>
          </section>

          <section class="output-pane">
            <div class="pane-header">
                <h4>Output</h4>
            </div>
            <div class="output-content">
              <pre v-if="output" class="output-text">{{ output }}</pre>
              <div v-else class="output-placeholder">
                Run your code to see output here...
              </div>
            </div>
            
             <div class="instruction-box">
                <div class="hint-title">💡 Current Step Hint</div>
                <p class="hint-text">
                  {{ selectedLab.steps.find(s => s.id === currentStep)?.hint || 'Follow the instructions above' }}
                </p>
              </div>

             <div class="nav-actions">
               <button class="secondary-btn" :disabled="currentStep === 1" @click="prevStep">
                 Previous
               </button>
               <button class="primary-btn" :disabled="currentStep === selectedLab.steps.length" @click="nextStep">
                 Next Step →
               </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout matching Home */
.page-wrapper {
  background-color: #161616; /* Gray 100 */
  min-height: calc(100vh - 48px);
  color: #f4f4f4; /* Gray 10 */
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
}

.page-container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 64px 32px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* Typography & Header */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 24px;
    border-bottom: 1px solid #393939;
}

.breadcrumb {
    font-size: 14px;
    color: #c6c6c6;
    margin-bottom: 16px;
}

.breadcrumb-link {
    color: #4589ff;
    text-decoration: none;
}

.page-title {
  font-size: 42px;
  font-weight: 300;
  margin: 0 0 8px;
  color: #f4f4f4;
}

.page-sub {
  font-size: 16px;
  color: #c6c6c6;
  max-width: 600px;
  margin: 0;
  line-height: 1.5;
}

/* Tabs */
.tab-controls {
    display: flex;
    gap: 0;
    background: #262626;
}

.tab-btn {
    background: transparent;
    border: none;
    color: #c6c6c6;
    padding: 13px 24px;
    cursor: pointer;
    font-size: 14px;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}

.tab-btn:hover {
    background: #353535;
    color: #f4f4f4;
}

.tab-btn.active {
    color: #f4f4f4;
    border-bottom: 2px solid #0f62fe;
    font-weight: 600;
}

/* Section Headers */
.section-header h3 {
    font-size: 24px;
    font-weight: 400;
    margin: 0 0 8px;
}
.section-header p {
     color: #c6c6c6;
     margin-bottom: 24px;
}

/* Lab Grid - Reusing Feature Card styles */
.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.feature-card {
  background: #262626;
  border: 1px solid transparent;
  padding: 16px;
  cursor: pointer;
  min-height: 200px;
  position: relative;
  transition: background-color 70ms;
}

.feature-card:hover {
    background: #353535;
}

.card-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.lab-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}

.lab-title {
    font-size: 20px;
    font-weight: 400;
    margin: 0 0 8px;
    color: #f4f4f4;
}

.lab-desc {
    font-size: 14px;
    color: #c6c6c6;
    line-height: 1.4;
    flex: 1;
}

.lab-meta {
    margin-top: 16px;
    font-size: 12px;
    color: #8d8d8d;
    display: flex;
    gap: 16px;
}

/* Badges */
.status-pill {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    background: #393939;
    color: #f4f4f4;
    text-transform: capitalize;
}

.status-pill.beginner { border-left: 3px solid #42be65; }
.status-pill.intermediate { border-left: 3px solid #4589ff; }
.status-pill.advanced { border-left: 3px solid #8a3ffc; }

.category-tag {
    font-size: 12px;
    color: #4589ff;
    border: 1px solid #4589ff;
    padding: 1px 8px;
    border-radius: 10px;
}

/* Lab Workspace */
.lab-workspace {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.ghost-btn {
    background: none;
    border: none;
    color: #4589ff;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    margin-bottom: 16px;
}
.ghost-btn:hover { text-decoration: underline; }

.active-lab-title {
    font-size: 32px;
    font-weight: 300;
    margin: 0 0 8px;
}

.step-progress {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 300px;
    margin-bottom: 16px;
}
.progress-track {
    flex: 1;
    height: 4px;
    background: #393939;
}
.progress-bar {
    height: 100%;
    background: #0f62fe;
    transition: width 0.3s;
}
.step-count {
    font-size: 12px;
    color: #c6c6c6;
}

/* Editor Layout */
.editor-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: #393939; /* Border color */
    border: 1px solid #393939;
}

.editor-pane, .output-pane {
    background: #161616;
    padding: 0;
    display: flex;
    flex-direction: column;
}

.pane-header {
    background: #262626;
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.pane-header h4 { margin: 0; font-size: 14px; color: #c6c6c6; font-weight: 600; }

.code-editor {
    width: 100%;
    height: 400px;
    background: #161616;
    color: #f4f4f4;
    border: none;
    padding: 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 14px;
    resize: none;
    line-height: 1.5;
}
.code-editor:focus { outline: none; background: #1f1f1f; }

.output-content {
    flex: 1;
    padding: 16px;
    background: #161616;
    border-bottom: 1px solid #393939;
    overflow-y: auto;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    height: 300px;
}

.output-text { color: #f4f4f4; margin: 0; white-space: pre-wrap; }
.output-placeholder { color: #525252; font-style: italic; }

.instruction-box {
    padding: 16px;
    background: #262626;
}
.hint-title { font-size: 12px; font-weight: 600; color: #f4f4f4; margin-bottom: 4px; }
.hint-text { font-size: 14px; color: #c6c6c6; margin: 0; }

.nav-actions {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    background: #161616;
}

/* Carbon Buttons */
.primary-btn {
    background: #0f62fe;
    color: white;
    border: none;
    padding: 14px 24px; /* Standard size */
    font-size: 14px;
    cursor: pointer;
    min-height: 48px;
}
.primary-btn:hover { background: #0353e9; }
.primary-btn:disabled { background: #393939; color: #8d8d8d; cursor: not-allowed; }

.secondary-btn {
    background: #393939;
    color: white;
    border: none;
    padding: 14px 24px;
    font-size: 14px;
    cursor: pointer;
    min-height: 48px;
}
.secondary-btn:hover { background: #4c4c4c; }
.secondary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.primary-btn.small, .secondary-btn.small {
    padding: 8px 16px;
    min-height: 32px;
    font-size: 12px;
}

/* Demo Specifics */
.split-view {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 24px;
    align-items: start;
}

.model-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.model-card {
    background: #262626;
    border: 1px solid transparent;
    padding: 16px;
    cursor: pointer;
}
.model-card:hover { background: #353535; }
.model-card.active { border: 2px solid #0f62fe; }

.model-header { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
.model-desc { font-size: 12px; color: #c6c6c6; margin: 0 0 8px; }
.model-meta { font-size: 11px; color: #8d8d8d; text-transform: uppercase; }
.model-meta.warning { color: #f1c21b; }

.badge { font-size: 10px; background: #393939; padding: 2px 6px; border-radius: 8px; }

.chat-interface {
    background: #262626;
    height: 600px;
    display: flex;
    flex-direction: column;
}
.chat-history { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }

.chat-message { padding: 12px 16px; max-width: 80%; line-height: 1.4; font-size: 14px; }
.chat-message.user { align-self: flex-end; background: #0f62fe; color: white; }
.chat-message.model { align-self: flex-start; background: #393939; color: #f4f4f4; }
.empty-state { color: #8d8d8d; text-align: center; margin-top: 100px; }

.chat-input-area {
    padding: 16px;
    border-top: 1px solid #393939;
    display: flex;
    gap: 8px;
}
.chat-input {
    flex: 1;
    background: #161616;
    border: 1px solid #393939;
    color: #f4f4f4;
    padding: 12px;
    font-family: inherit;
    font-size: 14px;
}
.chat-input:focus { outline: 2px solid #0f62fe; border-color: transparent; }

.error-text { color: #da1e28; padding: 8px 16px; font-size: 12px; }

@media (max-width: 900px) {
    .editor-layout, .split-view { grid-template-columns: 1fr; }
    .chat-interface { height: 500px; }
}
</style>
