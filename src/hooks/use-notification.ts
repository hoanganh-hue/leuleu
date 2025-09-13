import { useAppStore } from '@/stores/app-store'

export function useNotification() {
  const { addNotification } = useAppStore()

  const showSuccess = (title: string, message?: string) => {
    addNotification({
      type: 'success',
      title,
      message,
    })
  }

  const showError = (title: string, message?: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      autoHide: false, // Errors should be manually dismissed
    })
  }

  const showWarning = (title: string, message?: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
    })
  }

  const showInfo = (title: string, message?: string) => {
    addNotification({
      type: 'info',
      title,
      message,
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}

export default useNotification