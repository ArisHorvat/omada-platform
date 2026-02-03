import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { useThemeColors } from '@/src/hooks';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

export const Accordion = ({ title, children }: AccordionProps) => {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const height = useSharedValue(0);

  const toggle = () => {
    setOpen(!open);
    // Rough estimate for max height or use `onLayout` measure for perfect height
    // For simple text, 200 is often enough, or animate purely on `maxHeight`
    height.value = withTiming(open ? 0 : 200); 
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: height.value === 0 ? 0 : 1,
  }));

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={toggle} style={styles.header}>
        <AppText weight="medium">{title}</AppText>
        <Icon name={open ? 'expand-less' : 'expand-more'} size={24} color={colors.subtle} />
      </TouchableOpacity>
      
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={{ paddingBottom: 16 }}>
           {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, alignItems: 'center' },
  content: { overflow: 'hidden' },
});