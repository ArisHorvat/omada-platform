import { Alert } from 'react-native';

export interface ConfirmActionOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export interface AlertActionOptions {
  title: string;
  message: string;
  buttonText?: string;
  onDismiss?: () => void;
}

type DialogHandlers = {
  confirm: (options: ConfirmActionOptions) => void;
  alert: (options: AlertActionOptions) => void;
};

const handlersRef: { current: DialogHandlers | null } = { current: null };

export function registerDialogHandlers(next: DialogHandlers | null): void {
  handlersRef.current = next;
}

/** Clay confirm modal (web + native). Falls back to system alert only if provider is not mounted. */
export function confirmAction(options: ConfirmActionOptions): void {
  if (handlersRef.current) {
    handlersRef.current.confirm(options);
    return;
  }

  Alert.alert(options.title, options.message, [
    { text: options.cancelText ?? 'Cancel', style: 'cancel' },
    {
      text: options.confirmText ?? 'OK',
      style: options.destructive ? 'destructive' : 'default',
      onPress: options.onConfirm,
    },
  ]);
}

/** Single-button info dialog. */
export function alertAction(options: AlertActionOptions): void {
  if (handlersRef.current) {
    handlersRef.current.alert(options);
    return;
  }

  Alert.alert(options.title, options.message, [
    { text: options.buttonText ?? 'OK', onPress: options.onDismiss },
  ]);
}
