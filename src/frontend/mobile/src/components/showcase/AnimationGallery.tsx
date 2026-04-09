import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText, ClayView, AppButton } from '@/src/components/ui';
import { 
  PressScale, FadeInView, ShakeView, SlideInView, BreathingView, 
  ConfettiExplosion, NumberTicker, FlipCard, 
  ShakeViewRef
} from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';

export const AnimationGallery = () => {
  const colors = useThemeColors();
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const shakeRef = useRef<ShakeViewRef>(null);

  const triggerConfetti = () => {
    setConfettiTrigger(prev => prev + 1);
  };

  return (
    <View style={{ paddingHorizontal: 20 }}>
      
      {/* 1. Scale Interactions */}
      <View style={styles.section}>
        <AppText variant="h3">Press Scale</AppText>
        <PressScale>
          <ClayView depth={6} puffy={12} color={colors.card} style={styles.box}>
            <AppText>Tap Me</AppText>
          </ClayView>
        </PressScale>
      </View>

      {/* 2. Entrance Animations */}
      <View style={styles.section}>
        <AppText variant="h3">Entrances</AppText>
        <View style={{ flexDirection: 'row', gap: 10 }}>
            <FadeInView delay={200}>
                <View style={[styles.smallBox, { backgroundColor: colors.primary }]}>
                    <AppText style={{color: '#fff'}}>Fade</AppText>
                </View>
            </FadeInView>
            <SlideInView direction="right" delay={0}>
                <View style={[styles.smallBox, { backgroundColor: colors.tertiary }]}>
                    <AppText>Slide</AppText>
                </View>
            </SlideInView>
        </View>
      </View>

      {/* 3. Feedback Animations */}
      <View style={styles.section}>
        <AppText variant="h3">Feedback</AppText>
        <ShakeView ref={shakeRef}>
             <View style={[styles.box, { borderColor: colors.error, borderWidth: 1 }]}>
                <AppText style={{ color: colors.error }}>Shake on Error</AppText>
             </View>
        </ShakeView>
        <AppButton title="Trigger Shake" size="sm" onPress={() => shakeRef.current?.shake()} style={{ marginTop: 8 }} />
      </View>

      {/* 4. Ambient */}
      <View style={styles.section}>
        <AppText variant="h3">Ambient</AppText>
        <BreathingView>
             <View style={[styles.circle, { backgroundColor: colors.primary }]} />
        </BreathingView>
      </View>

      {/* 5. Data & Fun */}
      <View style={styles.section}>
        <AppText variant="h3">Data & Fun</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <AppText variant="h1">
              $<NumberTicker value={1234} />
            </AppText>
            <View style={{ position: 'absolute', left: '50%', top: 0 }}>
              <ConfettiExplosion trigger={confettiTrigger} />
            </View>
            <AppButton title="Celebrate" size="sm" onPress={triggerConfetti} />
        </View>
        
        <View style={{ height: 150 }}>
            <FlipCard 
                front={
                    <ClayView depth={6} puffy={12} color={colors.card} style={styles.card}>
                        <AppText>Front (Tap to Flip)</AppText>
                    </ClayView>
                }
                back={
                    <ClayView depth={6} puffy={12} color={colors.primary} style={styles.card}>
                        <AppText style={{ color: '#fff' }}>Back Side!</AppText>
                    </ClayView>
                }
            />
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 30 },
  box: { padding: 20, alignItems: 'center', borderRadius: 12 },
  smallBox: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  circle: { width: 60, height: 60, borderRadius: 30 },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }
});