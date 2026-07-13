import React, { useCallback, useRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AUTH_CONTENT_MAX_WIDTH } from '@/src/constants/layout';
import { useWebMainPaneAnchor } from '@/src/context/WebMainPaneContext';
import { useEscapeKey } from '@/src/hooks/useEscapeKey';
import { useThemeColors } from '@/src/hooks';
import { webFixedOverlayHostStyle } from '@/src/utils/webOverlayAnchorStyle';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { ClayView } from './ClayView';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  alertOnly?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const BACKDROP_PRESS_GRACE_MS = 400;

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  destructive = false,
  alertOnly = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = useThemeColors();
  const webAnchor = useWebMainPaneAnchor();
  const openedAtRef = useRef(0);

  React.useEffect(() => {
    if (visible) {
      openedAtRef.current = Date.now();
    }
  }, [visible]);

  const handleBackdropPress = useCallback(() => {
    if (Date.now() - openedAtRef.current < BACKDROP_PRESS_GRACE_MS) return;
    onCancel();
  }, [onCancel]);

  const overlayHostStyle = webFixedOverlayHostStyle(webAnchor, styles.overlay);
  const dialogHostStyle = webFixedOverlayHostStyle(webAnchor, styles.dialogSlot);

  useEscapeKey(visible, onCancel);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={overlayHostStyle}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
          accessibilityLabel="Dismiss"
        />
        <View style={dialogHostStyle} pointerEvents="box-none">
          <ClayView
            depth={18}
            contentOverflow="visible"
            color={colors.card}
            style={styles.card}
          >
            <AppText variant="h3" weight="bold" style={{ color: colors.text, textAlign: 'center' }}>
              {title}
            </AppText>
            <AppText
              variant="body"
              style={{ color: colors.subtle, textAlign: 'center', marginTop: 10, lineHeight: 22 }}
            >
              {message}
            </AppText>

            <View style={[styles.actions, alertOnly ? styles.actionsSingle : styles.actionsRow]}>
              {!alertOnly ? (
                <AppButton
                  title={cancelText}
                  variant="outline"
                  size="md"
                  onPress={onCancel}
                  style={styles.actionBtnHalf}
                />
              ) : null}
              <AppButton
                title={confirmText}
                variant={destructive ? 'danger' : 'primary'}
                size="md"
                onPress={onConfirm}
                style={alertOnly ? styles.actionBtnSingle : styles.actionBtnHalf}
              />
            </View>
          </ClayView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      },
      default: {},
    }),
  },
  dialogSlot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    ...Platform.select({
      web: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      default: {},
    }),
  },
  card: {
    width: '100%',
    maxWidth: AUTH_CONTENT_MAX_WIDTH,
    paddingHorizontal: 22,
    paddingVertical: 24,
    borderRadius: 28,
    ...Platform.select({
      web: {
        marginHorizontal: 'auto' as const,
      },
      default: {},
    }),
  },
  actions: {
    marginTop: 22,
    width: '100%',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  actionsSingle: {
    width: '100%',
    alignItems: 'center',
  },
  actionBtnHalf: {
    flex: 1,
    minWidth: 120,
    maxWidth: 200,
  },
  actionBtnSingle: {
    alignSelf: 'center',
    minWidth: 140,
    maxWidth: 240,
    width: '100%',
  },
});
