import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ToastProps {
  title: string
  message?: string
  type: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
  autoHide?: boolean
}

const Toast: React.FC<ToastProps> = ({ title, message, type, onClose, autoHide = true }) => {
  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [autoHide, onClose])

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-100',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100'
  }

  return (
    <div className={cn(
      "relative rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out",
      typeStyles[type]
    )}>
      <div className="flex items-start">
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-current hover:bg-current hover:bg-opacity-20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export { Toast }