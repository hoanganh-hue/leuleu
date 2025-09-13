import React from 'react'
import { Toast } from '@/components/ui/toast'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

export function ToastContainer() {
  const { notifications, removeNotification } = useAppStore()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.slice(0, 3).map((notification) => (
        <Toast
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
          autoHide={notification.autoHide}
        />
      ))}
      {notifications.length > 3 && (
        <div className={cn(
          "rounded-lg border bg-background p-3 shadow-lg text-center text-sm text-muted-foreground"
        )}>
          +{notifications.length - 3} thông báo khác
        </div>
      )}
    </div>
  )
}