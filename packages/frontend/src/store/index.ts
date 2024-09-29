import { reactive } from 'vue'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface Store {
  isLoggedIn: boolean
  isDarkmode: boolean
}

const store = reactive<Store>({
  isLoggedIn: false,
  isDarkmode: false,
})

export const useTheme = () => {
  const enableDarkmode = () => {
    store.isDarkmode = true
    document.documentElement.classList.add('dark')
  }

  const disableDarkmode = () => {
    store.isDarkmode = false
    document.documentElement.classList.remove('dark')
  }

  const toggleDarkmode = () => {
    if (store.isDarkmode) {
      disableDarkmode()
    } else {
      enableDarkmode()
    }
  }

  const isDarkmode = () => store.isDarkmode

  return {
    enableDarkmode,
    disableDarkmode,
    toggleDarkmode,
    isDarkmode,
  }
}

export const useAuth = () => {
  const saveTokens = (tokens: AuthTokens): void => {
    sessionStorage.setItem('accessToken', tokens.accessToken)
    sessionStorage.setItem('refreshToken', tokens.refreshToken)
    store.isLoggedIn = true
  }

  const clearTokens = (): void => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    store.isLoggedIn = false
  }

  const getTokens = (): AuthTokens | null => {
    const accessToken = sessionStorage.getItem('accessToken')
    const refreshToken = sessionStorage.getItem('refreshToken')
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken }
    }
    return null
  }

  const isLoggedIn = (): boolean => {
    return store.isLoggedIn
  }

  // Initialize isLoggedIn state
  if (getTokens()) {
    store.isLoggedIn = true
  }

  return {
    saveTokens,
    clearTokens,
    getTokens,
    isLoggedIn,
  }
}
