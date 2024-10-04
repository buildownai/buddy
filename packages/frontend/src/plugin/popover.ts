import { type App, createApp, reactive } from 'vue'
import Popover from './Popover.vue'

interface PopoverOptions {
  title?: string
  message: string
  yesText?: string
  noText?: string
  yesIcon?: string
  noIcon?: string
  icon?: string
}

export default {
  install(app: App) {
    const popoverState = reactive({
      title: '',
      message: '',
      yesText: 'Yes',
      noText: 'No',
      yesIcon: 'check',
      noIcon: 'not_interested',
      icon: '',
      isVisible: false,
      callback: (response: boolean) => {},
    })

    const showPopover = (options: PopoverOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        popoverState.title = options.title || 'Question'
        popoverState.message = options.message || 'Are you sure?'
        popoverState.yesText = options.yesText || 'Yes'
        popoverState.noText = options.noText || 'No'
        popoverState.yesIcon = options.yesIcon || 'check'
        popoverState.noIcon = options.noIcon || 'not_interested'
        popoverState.icon = options.icon || ''
        popoverState.isVisible = true

        popoverState.callback = (response: boolean) => {
          resolve(response) // Resolve the promise when user clicks "true" or "false"
          popoverState.isVisible = false // Hide the popover
        }
      })
    }

    app.config.globalProperties.$showPopover = showPopover

    // Dynamically mount the Popover component
    const popoverInstance = createApp(Popover, { popoverState }).mount(
      document.createElement('div')
    )
    document.body.appendChild(popoverInstance.$el)
  },
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $showPopover: (options: PopoverOptions) => Promise<boolean>
  }
}
