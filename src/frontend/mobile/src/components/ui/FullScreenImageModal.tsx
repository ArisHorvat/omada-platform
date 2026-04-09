import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import { ProgressiveImage } from './ProgressiveImage';

interface FullScreenImageModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export function FullScreenImageModal({ visible, imageUri, onClose }: FullScreenImageModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Icon name="close" size={28} color="#FFF" />
        </Pressable>
        {imageUri ? (
          <ProgressiveImage source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    padding: 16,
    paddingTop: 48,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 12,
  },
  image: {
    flex: 1,
    width: '100%',
    minHeight: 360,
  },
});
