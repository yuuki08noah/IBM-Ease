<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps({
  mode: {
    type: String as () => 'chat' | 'config' | 'topology',
    default: 'chat'
  },
  initialMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update'])

const chatInput = ref('')
const chatHistory = ref<{role: 'user'|'model', text: string}[]>([])
const isChatLoading = ref(false)
const chatError = ref('')
const chatHistoryRef = ref<HTMLElement | null>(null)

if (props.initialMessage) {
    chatHistory.value.push({ role: 'model', text: props.initialMessage })
}

const sendMessage = async () => {
  if (!chatInput.value) return
  
  const userText = chatInput.value
  chatHistory.value.push({ role: 'user', text: userText })
  chatInput.value = ''
  isChatLoading.value = true
  chatError.value = ''

  try {
    let endpoint = '/api/playground/demo/gemini' // Default chat
    
    if (props.mode === 'config') {
        endpoint = '/api/ai/generate_config'
    } else if (props.mode === 'topology') {
        endpoint = '/api/ai/generate_topology'
    }

    const { data, error } = await useFetch(endpoint, {
      method: 'POST',
      body: {
        message: userText,
        history: chatHistory.value.slice(0, -1).map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
      }
    })

    if (error.value) {
      throw new Error(error.value.statusMessage || 'API Error')
    }

    const result = data.value as any
    const responseText = result.response || result.message // normalizing

    chatHistory.value.push({ role: 'model', text: responseText })
    
    // Check for structured data in response
    if (result.structuredData) {
        emit('update', result.structuredData)
    }

  } catch (err: any) {
    chatError.value = err.message
  } finally {
    isChatLoading.value = false
    nextTick(() => {
        if (chatHistoryRef.value) {
            chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
        }
    })
  }
}
</script>

<template>
  <div class="chat-interface">
    <div class="chat-history" ref="chatHistoryRef">
      <div v-if="chatHistory.length === 0" class="empty-state">
        <p v-if="mode === 'chat'">Start a conversation with Gemini!</p>
        <p v-else-if="mode === 'config'">Describe the app you want to build (e.g. "Python web app with DB")</p>
         <p v-else>Describe the architecture you need (e.g. "3 Kubernetes clusters")</p>
      </div>
      <div 
        v-for="(msg, idx) in chatHistory" 
        :key="idx" 
        class="chat-message"
        :class="msg.role"
      >
        <div class="message-role">{{ msg.role === 'user' ? 'You' : 'AI' }}</div>
        <div class="message-content" style="white-space: pre-wrap;">{{ msg.text }}</div>
      </div>
      <div v-if="isChatLoading" class="chat-message model loading">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    </div>
    <div class="chat-input-area">
      <input 
        v-model="chatInput" 
        @keyup.enter="sendMessage"
        placeholder="Type your instruction..."
        :disabled="isChatLoading"
        class="chat-input"
      />
      <button class="primary" @click="sendMessage" :disabled="!chatInput || isChatLoading">Send</button>
    </div>
    <p v-if="chatError" class="error-text">{{ chatError }}</p>
  </div>
</template>

<style scoped>
.chat-interface {
  border: 1px solid var(--cds-border-subtle);
  border-radius: 0; /* Carbon style */
  background: var(--cds-layer);
  height: 100%; /* Fill parent */
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.chat-history {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
    color: var(--cds-text-secondary);
    text-align: center;
    margin-top: 40px;
    font-size: 14px;
}

.chat-message {
  padding: 12px 16px;
  max-width: 90%;
  font-size: 14px;
  line-height: 1.5;
  color: var(--cds-text-primary);
}

/* User Message - Blue 60 */
.chat-message.user {
  align-self: flex-end;
  background: var(--ibm-blue-60);
  color: white;
  border-radius: 16px 16px 0 16px;
}

/* Model Message - Gray 80 */
.chat-message.model {
  align-self: flex-start;
  background: var(--ibm-gray-80);
  color: var(--cds-text-primary);
  border-radius: 16px 16px 16px 0;
}

.chat-input-area {
  padding: 16px;
  border-top: 1px solid var(--cds-border-subtle);
  display: flex;
  gap: 12px;
  background: var(--cds-layer);
}

/* Carbon Input Style */
.chat-input {
  flex: 1;
  padding: 0 16px;
  height: 48px;
  border: none;
  border-bottom: 1px solid var(--cds-border-strong);
  background: var(--ibm-gray-80);
  color: var(--cds-text-primary);
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: all 0.1s;
}

.chat-input:focus {
  outline: 2px solid var(--cds-focus);
  outline-offset: -2px;
}

/* Button override to match input height if needed, but keeping primary class logic */
.primary {
  height: 48px;
  border-radius: 0;
}

.error-text {
  color: var(--cds-danger);
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
}

.typing-indicator {
    display: flex;
    gap: 4px;
}

.typing-indicator span {
    width: 6px;
    height: 6px;
    background: var(--cds-text-secondary);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.primary {
  background: var(--cds-primary);
  color: #ffffff;
  border: none;
  padding: 0 24px;
  cursor: pointer;
  font-weight: 400;
  font-size: 14px;
  transition: background 70ms;
}

.primary:hover {
    background: var(--cds-primary-hover);
}

.primary:disabled {
    background: var(--ibm-gray-80);
    color: var(--ibm-gray-50);
    cursor: not-allowed;
}
</style>
