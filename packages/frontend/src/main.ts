import '@fontsource/inter'
import '@fontsource/inter/100.css'
import '@fontsource/inter/200.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { setupRouterGuards } from './router/routerGuards'
import '@material-design-icons/font/sharp.css'
import '@material-design-icons/font/outlined.css'
import './assets/tree.css'
import './assets/main.css'
import 'splitpanes/dist/splitpanes.css'
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import popoverPlugin from './plugin/popover.js'

setupRouterGuards(router)

// Type-define 'en-US' as the master schema for the resource
type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], 'en'>({
  locale: 'en',
  messages: { en },
})

const app = createApp(App)
app.use(i18n)
app.use(router)
app.use(popoverPlugin)
app.mount('#app')
