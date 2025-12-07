export default defineNuxtPlugin(async () => {
  const userState = useState('user', () => null as null | { name: string })
  if (userState.value) return
  const { data } = await useFetch('/api/auth/me')
  if (data.value) {
    userState.value = data.value as any
  }
})
