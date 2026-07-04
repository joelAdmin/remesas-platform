import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog'
import { Button } from './button'

interface ConfirmState {
  message: string
  confirmText: string
  resolve: (value: boolean) => void
}

export function useConfirm() {
  const { t } = useTranslation()
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((message: string, confirmText?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ message, confirmText: confirmText || t('common.delete'), resolve })
    })
  }, [t])

  const handleConfirm = useCallback(() => {
    state?.resolve(true)
    setState(null)
  }, [state])

  const handleCancel = useCallback(() => {
    state?.resolve(false)
    setState(null)
  }, [state])

  const ConfirmDialog = () =>
    state ? (
      <Dialog open={true} onOpenChange={(v) => { if (!v) handleCancel() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.confirm_title')}</DialogTitle>
            <DialogDescription>{state.message}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm}>
              {state.confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    ) : null

  return { confirm, ConfirmDialog }
}
