import type { Directive, DirectiveBinding } from 'vue'

interface ClickAwayElement extends HTMLElement {
  clickAwayHandler?: (event: MouseEvent) => void
}

export const clickAway: Directive = {
  mounted(el: ClickAwayElement, binding: DirectiveBinding) {
    el.clickAwayHandler = (event: MouseEvent) => {
      // Check if the click was outside the element
      if (!(el === event.target || el.contains(event.target as Node))) {
        // Call the provided callback
        binding.value(event)
      }
    }

    // Add event listener with a slight delay to avoid immediate triggering
    setTimeout(() => {
      document.addEventListener('click', el.clickAwayHandler!)
    }, 0)
  },

  unmounted(el: ClickAwayElement) {
    // Clean up the event listener
    if (el.clickAwayHandler) {
      document.removeEventListener('click', el.clickAwayHandler)
      delete el.clickAwayHandler
    }
  }
}
