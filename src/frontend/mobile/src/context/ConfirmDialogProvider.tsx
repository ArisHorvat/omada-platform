import React, { useCallback, useRef, useState } from 'react';

import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import {
  registerDialogHandlers,
  type AlertActionOptions,
  type ConfirmActionOptions,
} from '@/src/utils/confirmAction';

type DialogState =
  | ({ kind: 'confirm' } & ConfirmActionOptions)
  | ({ kind: 'alert' } & AlertActionOptions)
  | null;

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const busyRef = useRef(false);

  const close = useCallback(() => {
    busyRef.current = false;
    setDialog(null);
  }, []);

  const openConfirm = useCallback((options: ConfirmActionOptions) => {
    busyRef.current = false;
    setDialog({ kind: 'confirm', ...options });
  }, []);

  const openAlert = useCallback((options: AlertActionOptions) => {
    busyRef.current = false;
    setDialog({ kind: 'alert', ...options });
  }, []);

  React.useEffect(() => {
    registerDialogHandlers({ confirm: openConfirm, alert: openAlert });
    return () => registerDialogHandlers(null);
  }, [openConfirm, openAlert]);

  const runConfirm = useCallback(() => {
    if (!dialog || busyRef.current) return;
    busyRef.current = true;

    const current = dialog;
    setDialog(null);

    setTimeout(() => {
      busyRef.current = false;
      if (current.kind === 'confirm') {
        current.onConfirm();
      } else {
        current.onDismiss?.();
      }
    }, 0);
  }, [dialog]);

  const runCancel = useCallback(() => {
    if (busyRef.current) return;
    close();
  }, [close]);

  return (
    <>
      {children}
      {dialog ? (
        <ConfirmDialog
          visible
          title={dialog.title}
          message={dialog.message}
          confirmText={
            dialog.kind === 'alert'
              ? dialog.buttonText ?? 'OK'
              : dialog.confirmText ?? 'OK'
          }
          cancelText={dialog.kind === 'confirm' ? dialog.cancelText ?? 'Cancel' : 'Cancel'}
          destructive={dialog.kind === 'confirm' ? dialog.destructive : false}
          alertOnly={dialog.kind === 'alert'}
          onConfirm={runConfirm}
          onCancel={runCancel}
        />
      ) : null}
    </>
  );
}
