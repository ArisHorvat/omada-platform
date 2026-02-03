import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip = ({ content, children }: TooltipProps) => {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  
  // In a complex app, we would calculate exact coordinates here.
  // For simplicity, we stick to a simple toggle or centered modal approach,
  // OR we render it conditionally right above the element.

  return (
    <View style={{ position: 'relative', zIndex: 10 }}>
      {visible && (
        <View style={[styles.bubble, { backgroundColor: colors.text }]}>
          <AppText style={{ color: colors.background, fontSize: 12 }}>
            {content}
          </AppText>
          <View style={[styles.arrow, { borderTopColor: colors.text }]} />
        </View>
      )}
      
      <Pressable
        onLongPress={() => setVisible(true)}
        onPressOut={() => setVisible(false)} // Hide when finger lifts
        delayLongPress={300}
      >
        {children}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: '100%', // Above the element
    left: -50, // Roughly centered (adjust based on width)
    width: 140,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    zIndex: 20,
  },
  arrow: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});