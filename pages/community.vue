<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// --- Interfaces ---
interface UserProfile {
  id: string
  name: string
  role: 'user' | 'expert' | 'ibm'
  reputation: number
  badges: string[]
  certified: boolean
  avatarUrl?: string
}

interface Post {
  id: string
  title: string
  body: string
  author: UserProfile
  tags: string[]
  votes: number
  answersCount: number
  views: number
  solved: boolean
  createdAt: string
}

interface Comment {
  id: string
  postId: string
  body: string
  author: UserProfile
  votes: number
  accepted: boolean
  ibmVerified: boolean
  createdAt: string
}

// --- Auth State ---
const currentUser = ref<UserProfile | null>(null)
const { data: userData } = await useFetch('/api/auth/me')

if (userData.value?.user) {
    currentUser.value = userData.value.user as any
}

// --- State ---
const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const filterSolved = ref(false)
const showQuestionForm = ref(false)
const showReplyForm = ref(false)
const selectedQuestion = ref<Post & { answers?: Comment[] } | null>(null)

const newQuestion = ref({
  title: '',
  body: '',
  tags: ''
})

const newReply = ref('')

// --- Data Fetching ---
const { data: posts, refresh: refreshPosts } = await useFetch<Post[]>('/api/community/posts', {
  query: computed(() => ({
    search: searchQuery.value,
    solved: filterSolved.value,
  }))
})

const { data: tagsData } = await useFetch<string[]>('/api/community/tags')

const allTags = computed(() => tagsData.value || [])
// const topContributors = computed(() => contributorsData.value || [])

const filteredQuestions = computed(() => {
  if (!posts.value) return []
  let res = posts.value
  
  if (selectedTags.value.length > 0) {
    res = res.filter(q => selectedTags.value.some(t => q.tags.includes(t)))
  }
  
  return res
})

const currentAnswers = computed(() => {
  return selectedQuestion.value?.answers || []
})

// --- Actions ---
const toggleTag = (tag: string) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const viewQuestion = async (question: Post) => {
  const { data } = await useFetch<Post & { answers: Comment[] }>(`/api/community/posts/${question.id}`)
  selectedQuestion.value = data.value
}

const login = () => {
    // Redirect to login page or IBM auth flow
    window.location.href = '/api/auth/login'
}

const submitQuestion = async () => {
  if (!currentUser.value) return login()
  if (!newQuestion.value.title || !newQuestion.value.body) return

  try {
    await $fetch('/api/community/posts', {
      method: 'POST',
      body: {
        title: newQuestion.value.title,
        body: newQuestion.value.body,
        tags: newQuestion.value.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    })
    
    showQuestionForm.value = false
    newQuestion.value = { title: '', body: '', tags: '' }
    refreshPosts()
  } catch (e) {
    alert('Failed to post question: ' + e)
  }
}

const submitReply = async () => {
  if (!currentUser.value) return login()
  if (!selectedQuestion.value || !newReply.value) return

  try {
    await $fetch(`/api/community/posts/${selectedQuestion.value.id}/comments`, {
      method: 'POST',
      body: {
        body: newReply.value
      }
    })
    
    const { data } = await useFetch<Post & { answers: Comment[] }>(`/api/community/posts/${selectedQuestion.value.id}`)
    selectedQuestion.value = data.value
    newReply.value = ''
    refreshPosts() 
  } catch (e) {
    alert('Failed to post reply')
  }
}

const vote = async (type: 'post' | 'comment', id: string, increment: boolean) => {
  if (!currentUser.value) return login()
  
  try {
     const res = await $fetch<{votes: number}>('/api/community/vote', {
      method: 'POST',
      body: { type, id, increment }
    })
    
    if (type === 'post' && selectedQuestion.value?.id === id) {
      selectedQuestion.value.votes = res.votes
    } else if (type === 'comment' && selectedQuestion.value?.answers) {
      const c = selectedQuestion.value.answers.find(a => a.id === id)
      if (c) c.votes = res.votes
    }
  } catch (e) {
    console.error(e)
  }
}

const shareQuestion = () => {
    if (!selectedQuestion.value) return
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!')
    })
}

// Helpers
const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'ibm': return 'var(--ibm-blue-60)'
    case 'expert': return 'var(--ibm-purple-60)'
    default: return 'var(--ibm-gray-50)'
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ibm': return 'IBM Staff'
    case 'expert': return 'Expert'
    default: return 'Member'
  }
}
</script>

<template>
  <div class="community-page">
    <!-- Header Section -->
    <header class="community-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">Community Knowledge Hub</h1>
          <p class="page-subtitle">Connect, learn, and build with IBM Cloud experts.</p>
        </div>
        <div class="user-stats-card">
          <div v-if="currentUser" class="user-info-block">
            <div class="user-info">
              <span class="user-name">{{ currentUser.name }}</span>
              <span class="user-rep">⭐ {{ currentUser.reputation }}</span>
            </div>
            <div class="user-badges">
              <span v-for="badge in currentUser.badges" :key="badge" class="mini-badge">{{ badge }}</span>
            </div>
          </div>
          <div v-else class="login-prompt">
            <p>Join the community</p>
            <button class="primary-btn small-btn" @click="login">Connect IBM ID</button>
          </div>
        </div>
      </div>
    </header>

    <div class="main-layout">
      <!-- Left Sidebar: Filters & Navigation -->
      <aside class="sidebar-left">
        <div class="card filter-card">
          <h3>Filters</h3>
          
          <div class="filter-group">
            <label class="search-label">Search Questions</label>
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input v-model="searchQuery" class="search-input" placeholder="e.g. Watson API..." />
            </div>
          </div>

          <div class="filter-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="filterSolved" />
              <span>Solved Only</span>
            </label>
          </div>

          <div class="filter-group">
            <label class="filter-label">Popular Tags</label>
            <div class="tags-cloud">
              <button
                v-for="tag in allTags"
                :key="tag"
                class="tag-chip"
                :class="{ active: selectedTags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          
          <button class="primary-btn full-width" @click="showQuestionForm = !showQuestionForm">
            {{ showQuestionForm ? 'Cancel' : '+ Ask Question' }}
          </button>
        </div>
      </aside>

      <!-- Center: Content Feed -->
      <main class="content-feed">
        <!-- New Question Form -->
        <section v-if="showQuestionForm" class="card form-card">
          <h3>Ask the Community</h3>
          <div v-if="!currentUser" class="auth-warning">
            <p>You must be logged in to ask a question.</p>
            <button class="primary-btn" @click="login">Log In</button>
          </div>
          <template v-else>
          <div class="form-group">
            <label>Title</label>
            <input v-model="newQuestion.title" class="text-input" placeholder="Be specific and concise" />
          </div>
          <div class="form-group">
            <label>Details</label>
            <textarea v-model="newQuestion.body" class="text-area" rows="6" placeholder="Describe your issue, expected outcome, and steps to reproduce..."></textarea>
          </div>
          <div class="form-group">
            <label>Tags</label>
            <input v-model="newQuestion.tags" class="text-input" placeholder="e.g. kubernetes, python, error-500" />
          </div>
          <div class="form-actions">
            <button class="secondary-btn" @click="showQuestionForm = false">Cancel</button>
            <button class="primary-btn" @click="submitQuestion">Post Question</button>
          </div>
          </template>
        </section>

        <!-- Question Detail View -->
        <article v-if="selectedQuestion" class="question-detail">
          <button class="back-link" @click="selectedQuestion = null">← Back to Feed</button>
          
          <div class="card detail-card">
            <div class="detail-header">
              <h2>{{ selectedQuestion.title }}</h2>
              <span v-if="selectedQuestion.solved" class="status-pill success">✓ Solved</span>
            </div>
            
            <div class="meta-row">
              <span class="author">
                <span class="role-dot" :style="{ background: getRoleBadgeColor(selectedQuestion.author.role) }"></span>
                {{ selectedQuestion.author.name }}
              </span>
              <span class="separator">•</span>
              <span class="timestamp">{{ selectedQuestion.createdAt }}</span>
            </div>

            <div class="tags-row">
              <span v-for="tag in selectedQuestion.tags" :key="tag" class="tag-badge">{{ tag }}</span>
            </div>

            <div class="question-body">
              {{ selectedQuestion.body }}
            </div>

            <div class="action-bar">
              <button class="action-btn" @click="vote('post', selectedQuestion.id, true)">👍 {{ selectedQuestion.votes }}</button>
              <button class="action-btn" @click="showReplyForm = !showReplyForm">💬 Reply</button>
              <button class="action-btn" @click="shareQuestion">🔗 Share</button>
            </div>
            
            <div v-if="showReplyForm" class="reply-form">
               <div v-if="!currentUser" class="auth-warning">
                <p>Please log in to reply.</p>
                <button class="primary-btn small-btn" @click="login">Log In</button>
              </div>
              <template v-else>
                <textarea v-model="newReply" class="text-area" rows="3" placeholder="Write your answer..."></textarea>
                <button class="primary-btn small-btn" @click="submitReply">Post Answer</button>
              </template>
            </div>
          </div>

          <div class="answers-section">
            <h3>{{ selectedQuestion.answersCount }} Answers</h3>
            
            <div v-for="answer in currentAnswers" :key="answer.id" class="card answer-card" :class="{ accepted: answer.accepted }">
              <div class="answer-header">
                <div class="author-info">
                  <span class="author-name">{{ answer.author.name }}</span>
                  <span 
                    v-if="answer.author.role !== 'user'" 
                    class="role-badge"
                    :style="{ background: getRoleBadgeColor(answer.author.role) }"
                  >
                    {{ getRoleLabel(answer.author.role) }}
                  </span>
                  <span v-if="answer.ibmVerified" class="verified-badge">✓ IBM Verified</span>
                </div>
                <span class="timestamp">{{ answer.createdAt }}</span>
              </div>
              
              <div class="answer-body">
                {{ answer.body }}
              </div>

              <div class="answer-footer">
                <button class="action-btn" @click="vote('comment', answer.id, true)">👍 {{ answer.votes }}</button>
                <div v-if="answer.accepted" class="accepted-label">✓ Accepted Solution</div>
              </div>
            </div>
          </div>
        </article>

        <!-- Questions List View -->
        <div v-else class="questions-list">
          <div class="list-header">
            <h3>Latest Discussions</h3>
            <span class="count">{{ filteredQuestions.length }} results</span>
          </div>

          <div 
            v-for="q in filteredQuestions" 
            :key="q.id" 
            class="card question-item"
            @click="viewQuestion(q)"
          >
            <div class="q-stats">
              <div class="stat-box">
                <span class="stat-val">{{ q.votes }}</span>
                <span class="stat-label">votes</span>
              </div>
              <div class="stat-box" :class="{ filled: q.answersCount > 0, solved: q.solved }">
                <span class="stat-val">{{ q.answersCount }}</span>
                <span class="stat-label">answers</span>
              </div>
            </div>
            
            <div class="q-content">
              <h4 class="q-title">{{ q.title }}</h4>
              <p class="q-excerpt">{{ q.body }}</p>
              
              <div class="q-meta">
                <div class="q-tags">
                  <span v-for="tag in q.tags" :key="tag" class="mini-tag">{{ tag }}</span>
                </div>
                <div class="q-author">
                  <span class="name">{{ q.author.name }}</span>
                  <span class="role-marker" :style="{ color: getRoleBadgeColor(q.author.role) }" v-if="q.author.role !== 'user'">
                    ● {{ getRoleLabel(q.author.role) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar: Resources -->
      <aside class="sidebar-right">
        <div class="card resources-card">
          <h3>Helpful Resources</h3>
          <ul class="resource-list">
            <li>
              <a href="https://cloud.ibm.com/docs" target="_blank" class="resource-link">
                 <span class="icon">📚</span> Documentation
              </a>
            </li>
            <li>
              <a href="https://cloud.ibm.com/apidocs" target="_blank" class="resource-link">
                 <span class="icon">⚙️</span> API Reference
              </a>
            </li>
            <li>
              <a href="https://www.ibm.com/design/language/" target="_blank" class="resource-link">
                 <span class="icon">📜</span> Guidelines
              </a>
            </li>
             <li>
              <a href="https://github.com/IBM/ibm-cloud-cli/issues" target="_blank" class="resource-link">
                 <span class="icon">🐛</span> Report Issue
              </a>
            </li>
          </ul>
        </div>
        
        <div class="card info-card">
          <h4>Community Driven</h4>
          <p>Earn badges and reputation by answering questions and contributing to the IBM Cloud ecosystem.</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* --- Design Tokens (Carbon Dark Theme - Gray 100) --- */
.community-page {
  background-color: #161616; /* Gray 100 */
  min-height: 100vh;
  font-family: 'IBM Plex Sans', sans-serif;
  color: #f4f4f4; /* Gray 10 */
}

/* --- Header --- */
.community-header {
  background: #161616;
  padding: 3rem 32px 1rem; /* Match app.vue padding */
  border-bottom: 1px solid #393939; /* Gray 80 */
}

.header-content {
  max-width: 1500px; /* Match app.vue max-width */
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 300; /* Light */
  margin: 0;
  color: #f4f4f4;
}

.page-subtitle {
  margin-top: 0.5rem;
  color: #c6c6c6; /* Gray 30 */
  font-size: 1.1rem;
}

.user-stats-card {
  background: #262626; /* Gray 90 */
  padding: 1rem;
  border-left: 4px solid #0f62fe; /* Blue 60 */
  min-width: 220px;
}

.user-info {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #f4f4f4;
}

.mini-badge {
  font-size: 0.75rem;
  background: #393939; /* Gray 80 */
  padding: 2px 8px;
  margin-right: 4px;
  border-radius: 10px;
  color: #a6c8ff; /* Blue 40 */
  border: 1px solid #525252;
}

/* --- Layout --- */
.main-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 24px;
  max-width: 1400px;
  margin: 32px auto;
  padding: 0 5%;
  align-items: start;
}

/* --- Cards & Generic --- */
.card {
  background: #262626; /* Gray 90 */
  padding: 1.5rem;
  border: 1px solid transparent;
  /* No shadow in dark mode usually, or very subtle */
}

.card h3 {
  margin-top: 0;
  font-size: 1.25rem;
  font-weight: 400;
  margin-bottom: 1.5rem;
  color: #f4f4f4;
}

/* --- Inputs & Buttons --- */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: #393939; /* Gray 80 */
  border: none;
  border-bottom: 1px solid #8d8d8d; /* Gray 60 */
  font-family: inherit;
  font-size: 14px;
  color: #f4f4f4;
  transition: background 0.2s;
}

.search-input:focus {
  outline: 2px solid #0f62fe; /* Blue 60 */
  background: #4c4c4c; /* Gray 70 */
}

.search-icon {
  position: absolute;
  left: 12px;
  fill: #c6c6c6;
  color: #c6c6c6;
}

.primary-btn {
  background: #0f62fe; /* Blue 60 */
  color: #ffffff;
  border: none;
  padding: 14px 16px;
  font-weight: 400;
  cursor: pointer;
  width: auto;
  min-width: 120px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  transition: background 70ms;
}

.primary-btn:hover {
  background: #0353e9; /* Blue 70 */
}

.small-btn {
  padding: 8px 16px;
  font-size: 0.9rem;
  min-width: auto;
}

.secondary-btn {
  background: #393939; /* Gray 80 */
  color: #ffffff;
  border: none;
  padding: 14px 16px;
  font-weight: 400;
  cursor: pointer;
  transition: background 70ms;
}

.secondary-btn:hover {
  background: #4c4c4c; /* Gray 70 */
}

.full-width {
  width: 100%;
}

/* --- Sidebar --- */
.filter-group {
  margin-bottom: 24px;
}

.search-label, .filter-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  color: #c6c6c6; /* Gray 30 */
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.32px;
}

.tag-chip {
  background: #393939; /* Gray 80 */
  border: 1px solid transparent;
  padding: 6px 14px;
  margin: 0 8px 8px 0;
  font-size: 0.85rem;
  border-radius: 16px;
  cursor: pointer;
  color: #f4f4f4;
  transition: all 0.2s;
}

.tag-chip:hover {
  background: #4c4c4c; /* Gray 70 */
}

.tag-chip.active {
  background: #0f62fe; /* Blue 60 */
  color: white;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f4f4f4;
  cursor: pointer;
}

.resource-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resource-link {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #c6c6c6;
  text-decoration: none;
  border-bottom: 1px solid #393939;
  transition: all 0.2s;
}

.resource-link:hover {
  background: #353535;
  color: #f4f4f4;
  padding-left: 20px; /* Slide effect */
}

.resource-link .icon {
  margin-right: 12px;
  font-size: 1.1rem;
}

.resource-list li:last-child .resource-link {
  border-bottom: none;
}

.login-prompt {
  text-align: center;
  color: #f4f4f4;
}

.login-prompt p {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.auth-warning {
  text-align: center;
  padding: 2rem;
  background: #262626;
  border: 1px dashed #525252;
  margin-bottom: 1rem;
}

.auth-warning p {
  margin-bottom: 1rem;
  color: #c6c6c6;
}

.c-rep {
  font-weight: 600;
  color: #4589ff; /* Blue 40 */
  font-size: 0.9rem;
}

/* --- Feed Questions --- */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.count {
  color: #8d8d8d;
  font-size: 0.9rem;
}

.question-item {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: background 0.2s;
}

.question-item:hover {
  background: #353535; /* Gray 80 Hover */
  border-left-color: #0f62fe;
}

.q-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 60px;
  text-align: center;
}

.stat-box {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
  color: #c6c6c6;
}

.stat-val {
  font-size: 1.1rem;
  font-weight: 400;
  color: #f4f4f4;
}

.stat-label {
  font-size: 0.7rem;
  color: #8d8d8d;
}

.stat-box.filled {
  border: 1px solid #42be65; /* Green 50 */
  border-radius: 4px;
  color: #42be65;
}

.stat-box.solved {
  background: #24a148; /* Green 60 */
  border-color: #24a148;
  color: white;
}

.stat-box.solved .stat-val, 
.stat-box.solved .stat-label {
  color: white;
}

.q-title {
  margin: 0 0 8px 0;
  color: #a6c8ff; /* Blue 40 */
  font-size: 1.15rem;
  font-weight: 400;
}

.q-excerpt {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #c6c6c6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.q-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #8d8d8d;
}

.mini-tag {
  background: #393939;
  color: #c6c6c6;
  padding: 2px 8px;
  margin-right: 6px;
  border-radius: 10px;
}

.role-marker {
  margin-left: 8px;
  font-weight: 500;
}

/* --- Detail View --- */
.back-link {
  background: none;
  border: none;
  color: #78a9ff; /* Blue 30 */
  cursor: pointer;
  margin-bottom: 24px;
  font-size: 0.9rem;
  padding: 0;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.back-link:hover {
  text-decoration: underline;
}

.detail-card {
  margin-bottom: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  border-bottom: 1px solid #393939;
  padding-bottom: 16px;
}

.detail-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.25;
  color: #f4f4f4;
}

.reply-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #393939;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.status-pill.success {
  background: #24a148; /* Green 60 */
  color: white;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  margin-left: 16px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c6c6c6;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}

.separator {
  color: #525252;
}

.tags-row {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tag-badge {
  background: #393939;
  color: #a6c8ff; /* Blue 40 */
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.question-body {
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 24px 0;
  color: #f4f4f4;
}

.action-bar {
  display: flex;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid #393939;
}

.action-btn {
  background: none;
  border: none;
  color: #c6c6c6;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover {
  color: #4589ff;
}

/* --- Answer Cards --- */
.answer-card {
  margin-bottom: 24px;
  border-left: 4px solid transparent;
}

.answer-card.accepted {
  border-left-color: #42be65; /* Green 50 */
  background: #191919; /* Slightly darker than card for contrast */
  border-top: 1px solid #24a148;
  border-bottom: 1px solid #24a148;
  border-right: 1px solid #24a148;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  border-bottom: 1px solid #393939;
  padding-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-name {
  font-weight: 600;
  color: #f4f4f4;
}

.timestamp {
  color: #8d8d8d;
  font-size: 0.85rem;
}

.role-badge {
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.verified-badge {
  color: #42be65; /* Green 50 */
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.answer-body {
  line-height: 1.6;
  margin-bottom: 24px;
  color: #c6c6c6;
}

.answer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.accepted-label {
  color: #42be65;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* --- Form Styles --- */
.form-card {
  border-top: 4px solid #0f62fe;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: #c6c6c6;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.text-input, .text-area {
  width: 100%;
  padding: 12px;
  background: #393939; /* Gray 80 */
  border: none;
  border-bottom: 1px solid #8d8d8d;
  font-family: inherit;
  font-size: 1rem;
  color: #f4f4f4;
  margin-bottom: 0;
}

.text-input:focus, .text-area:focus {
  outline: 2px solid #0f62fe;
}

.text-area {
  resize: vertical;
  min-height: 150px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
}

/* Responsive */
@media (max-width: 1056px) {
  .main-layout {
    grid-template-columns: 250px 1fr;
  }
  .sidebar-right {
    display: none; /* Hide leaderboard on tablet for simplicity */
  }
}

@media (max-width: 672px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  .sidebar-left {
    display: none; /* Hide filters on mobile for simplicity */
  }
  .community-header {
    padding: 2rem 1rem;
  }
}
</style>
