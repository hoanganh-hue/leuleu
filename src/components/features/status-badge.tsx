import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'success':
        return 'success'
      case 'running':
      case 'pending':
      case 'processing':
        return 'default'
      case 'failed':
      case 'error':
      case 'blocked':
        return 'error'
      case 'paused':
      case 'inactive':
      case 'warning':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const getLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Đang chờ',
      'running': 'Đang chạy',
      'completed': 'Hoàn thành',
      'failed': 'Thất bại',
      'paused': 'Tạm dừng',
      'active': 'Hoạt động',
      'inactive': 'Ngừng hoạt động',
      'blocked': 'Bị chặn',
      'testing': 'Đang test',
      'success': 'Thành công',
      'error': 'Lỗi'
    }
    return statusMap[status.toLowerCase()] || status
  }

  return (
    <Badge 
      variant={getVariant(status)} 
      className={cn("text-xs font-medium", className)}
    >
      {getLabel(status)}
    </Badge>
  )
}