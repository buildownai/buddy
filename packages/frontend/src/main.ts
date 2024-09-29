import '@fontsource/inter'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { setupRouterGuards } from './router/routerGuards'
import '@material-design-icons/font/sharp.css'
import '@material-design-icons/font/outlined.css'
import './assets/tree.css'

import './assets/main.css'
import 'splitpanes/dist/splitpanes.css'

setupRouterGuards(router)

const app = createApp(App)
app.use(router)

app.mount('#app')
