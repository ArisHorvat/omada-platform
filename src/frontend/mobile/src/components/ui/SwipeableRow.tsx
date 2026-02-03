import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Icon, IconName } from './Icon';

interface Action {
  icon: IconName;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  actions?: Action[];
  borderRadius?: number;
  style?: StyleProp<ViewStyle>; // <--- Added style prop
}

export const SwipeableRow = ({ 
  children, 
  actions, 
  borderRadius = 16, // Matches your styles.card radius
  style 
}: SwipeableRowProps) => {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const renderRightActions = (progress: any, drag: any) => {
    if (!actions) return null;
    const actionWidth = 64;

    return (
      <View style={{ width: actionWidth * actions.length, flexDirection: 'row' }}>
        {actions.map((action, index) => (
          <ActionItem 
            key={index}
            action={action}
            index={index}
            total={actions.length}
            drag={drag}
            width={actionWidth}
            onClose={() => swipeableRef.current?.close()}
          />
        ))}
      </View>
    );
  };

  return (
    // Style prop handles the external margin (marginBottom: 24)
    // borderRadius + overflow handles the clipping of the delete button
    <View style={[styles.wrapper, { borderRadius }, style]}>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        renderRightActions={actions ? renderRightActions : undefined}
        containerStyle={{ borderRadius, overflow: 'hidden' }}
      >
        {children}
      </Swipeable>
    </View>
  );
};

// --- Helper Component ---
const ActionItem = ({ action, index, total, drag, width, onClose }: any) => {
  const style = useAnimatedStyle(() => {
    const translateX = interpolate(
      drag.value,
      [-width * total, 0],
      [0, width * (total - index)],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateX }] };
  });

  return (
    <Animated.View style={[styles.actionBtn, { backgroundColor: action.color, width }, style]}>
      <TouchableOpacity onPress={() => { action.onPress(); onClose(); }} style={styles.touchable}>
        <Icon name={action.icon} size={24} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    width: '100%',
  },
  actionBtn: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});