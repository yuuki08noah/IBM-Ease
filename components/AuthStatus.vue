<script setup lang="ts">
const user = ref<{ id: string; name: string; email?: string; role: string } | null>(null)

onMounted(async () => {
  const { data } = await useFetch('/api/auth/me')
  if (data.value) {
    user.value = data.value as any
  }
})

const logout = async () => {
  await navigateTo('/api/auth/logout')
}
</script>

<template>
  <div>
    <template v-if="user">
      <div class="flex-row" style="gap: 12px;">
        <div class="status-pill success">
          <span>{{ user.name }}</span>
          <span v-if="user.role === 'ibm'" class="badge" style="background: var(--ibm-blue-60); color: white; font-size: 10px; padding: 2px 6px;">IBM</span>
        </div>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </template>
    <template v-else>
      <NuxtLink class="status-pill" to="/login">
        <span>Sign in with IBM OAuth</span>
      </NuxtLink>
    </template>
  </div>
</template>

<style scoped>
.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}
</style>
