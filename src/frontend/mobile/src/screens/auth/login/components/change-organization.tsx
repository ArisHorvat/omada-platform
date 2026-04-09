import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing, 
  runOnJS,
  useAnimatedStyle,
  interpolate
} from 'react-native-reanimated';

// UI Imports
import { AppText, Icon, ProgressiveImage } from '@/src/components/ui';
import { ClayView } from '@/src/components/ui/ClayView'; 
import { ClayAnimations } from '@/src/constants/animations'; 
import { useThemeColors } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@react-navigation/native';
import { authApi, orgApi, unwrap } from '@/src/api';
import { resolveMediaUrl } from '@/src/utils/resolveMediaUrl';
import { OrganizationType } from '@/src/api/generatedClient';
import { SwitchOrgRequest } from '@/src/api/generatedClient';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- CONFIG ---
const RADIUS = 65; 
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VIEW_SIZE = (RADIUS + STROKE_WIDTH) * 2;

// FIXED DIMENSIONS
const CARD_WIDTH = Math.min(width * 0.85, 360); // Max width 360px
const CARD_HEIGHT = 420; // Fixed height to prevent vertical jumping

export default function ChangeOrganizationScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const colorScheme = useTheme();
  const queryClient = useQueryClient();
  
  const {
    targetOrgId,
    targetOrgName,
    targetLogoUrl,
    currentOrgColor,
    currentOrgLogo,
    targetOrgType,
    targetRole,
  } = useLocalSearchParams<{
    targetOrgId: string;
    targetOrgName: string;
    targetLogoUrl?: string;
    currentOrgColor?: string;
    currentOrgLogo?: string;
    targetOrgType?: string;
    targetRole?: string;
  }>();

  const { switchSession, addSession, availableSessions } = useAuth();

  const [statusText, setStatusText] = useState("Syncing...");
  const [finalTargetColor, setFinalTargetColor] = useState<string>(colors.primary);
  
  const [finalTargetLogo, setFinalTargetLogo] = useState<string | null>(() => {
    if (targetLogoUrl && targetLogoUrl !== 'null' && targetLogoUrl !== 'undefined' && targetLogoUrl !== '') {
        return resolveMediaUrl(targetLogoUrl) ?? null;
    }
    return null;
  });

  const orgTypeParam = Array.isArray(targetOrgType) ? targetOrgType[0] : targetOrgType;
  const roleParam = Array.isArray(targetRole) ? targetRole[0] : targetRole;

  const targetTypeLabel =
    orgTypeParam === '0' || orgTypeParam === String(OrganizationType.University)
      ? 'University'
      : orgTypeParam === '1' || orgTypeParam === String(OrganizationType.Corporate)
        ? 'Workspace'
        : null;
  const targetRoleLabel =
    roleParam && roleParam !== 'null' && roleParam !== 'undefined' && roleParam.trim() !== ''
      ? roleParam === 'Unknown'
        ? 'Member'
        : roleParam
      : null;

  // Animations
  const disconnectProgress = useSharedValue(0); 
  const connectProgress = useSharedValue(0); 
  const currentLogoOpacity = useSharedValue(1);
  const targetLogoOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    runAnimationSequence();
  }, []);

  const runAnimationSequence = async () => {
    setStatusText("Disconnecting...");
    
    // 1. UNDRAW OLD RING (0 -> Full Erase) & FADE OUT OLD LOGO
    disconnectProgress.value = withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) });
    currentLogoOpacity.value = withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) });

    // 2. Perform Switch Logic
    try {
        await performSwitchAndFetch();
    } catch (e) {
        console.error("Switch failed", e);
        router.back();
        return;
    }

    await new Promise(r => setTimeout(r, 2000));

    // 3. Connect Phase
    setStatusText(`Joining ${targetOrgName}...`);

    // 4. DRAW NEW RING (Empty -> Full Draw) & FADE IN NEW LOGO
    targetLogoOpacity.value = withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) });
    
    connectProgress.value = withTiming(1, { 
        duration: 2000, 
        easing: Easing.inOut(Easing.ease) 
    }, (finished) => {
        if (finished) runOnJS(handleSuccess)();
    });
  };

  const performSwitchAndFetch = async () => {
      if (!targetOrgId) return;

      const existing = availableSessions.find(s => s.orgId && s.orgId.toLowerCase() === targetOrgId.toLowerCase());
      
      if (existing) {
        await switchSession(existing.orgId);
      } 
      else {
        // FIX: Explicitly assign the property!
        const request = new SwitchOrgRequest();
        request.organizationId = targetOrgId;

        const response = await unwrap(authApi.switchOrganization(request));
        await addSession(response.accessToken);
      }

      try {
          const orgDetails = await unwrap(orgApi.getById(targetOrgId));
          if (orgDetails?.primaryColor) setFinalTargetColor(orgDetails.primaryColor);
          if (orgDetails?.logoUrl) setFinalTargetLogo(resolveMediaUrl(orgDetails.logoUrl) ?? null);
      } catch (e) { 
          console.log("Failed to fetch details", e);
      }
  };

  const handleSuccess = () => {
    queryClient.clear();
    setStatusText("Successfully Connected");
    scale.value = ClayAnimations.Pulse();
    setTimeout(() => { router.replace('/dashboard'); }, 1000);
  };

  // --- ANIMATED PROPS ---
  const disconnectRingProps = useAnimatedProps(() => ({
      strokeDashoffset: interpolate(disconnectProgress.value, [0, 1], [0, CIRCUMFERENCE]), 
  }));

  const connectRingProps = useAnimatedProps(() => ({
      strokeDashoffset: interpolate(connectProgress.value, [0, 1], [CIRCUMFERENCE, 0]),
  }));

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const oldLogoStyle = useAnimatedStyle(() => ({ opacity: currentLogoOpacity.value }));
  const newLogoStyle = useAnimatedStyle(() => ({ opacity: targetLogoOpacity.value }));

  const startColor = currentOrgColor || colors.text; 

  return (
    <View style={styles.container}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colorScheme.dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)' },
        ]}
      />
      
      {/* FIXED SIZE CONTAINER */}
      <View style={styles.cardWrapper}>
        <Animated.View entering={ClayAnimations.Hero}>
            <ClayView 
                depth={20} 
                puffy={30} 
                color={colors.card}
                style={styles.card}
            >
                <Animated.View style={[styles.animationWrapper, containerStyle]}>
                    
                    {/* AVATAR CONTAINER */}
                    <View style={[styles.avatarContainer, { backgroundColor: '#fff' }]}>
                        
                        {/* OLD LOGO */}
                        <Animated.View style={[StyleSheet.absoluteFill, oldLogoStyle, styles.centered]}>
                            {currentOrgLogo ? (
                                <ProgressiveImage 
                                    source={{ uri: currentOrgLogo }} 
                                    style={styles.avatarImage} 
                                    resizeMode="cover"
                                />
                            ) : (
                                <Icon name="business" size={40} color={colors.subtle} />
                            )}
                        </Animated.View>

                        {/* NEW LOGO */}
                        <Animated.View style={[StyleSheet.absoluteFill, newLogoStyle, styles.centered]}>
                            {finalTargetLogo ? (
                                <ProgressiveImage 
                                    source={{ uri: finalTargetLogo }} 
                                    style={styles.avatarImage} 
                                    resizeMode="cover"
                                />
                            ) : (
                                <AppText weight="bold" style={{ fontSize: 32, color: finalTargetColor }}>
                                    {targetOrgName.charAt(0).toUpperCase()}
                                </AppText>
                            )}
                        </Animated.View>
                    </View>

                    {/* SVG RINGS */}
                    <Svg width={VIEW_SIZE} height={VIEW_SIZE} style={styles.svgContainer}>
                        {/* 1. OLD RING (Disconnecting) */}
                        <AnimatedCircle
                            cx={VIEW_SIZE/2} cy={VIEW_SIZE/2} r={RADIUS}
                            stroke={startColor} strokeWidth={STROKE_WIDTH}
                            strokeDasharray={CIRCUMFERENCE} strokeLinecap="round"
                            rotation="-90" origin={`${VIEW_SIZE/2}, ${VIEW_SIZE/2}`}
                            fill="none"
                            animatedProps={disconnectRingProps}
                        />

                        {/* 2. NEW RING (Connecting) */}
                        <AnimatedCircle
                            cx={VIEW_SIZE/2} cy={VIEW_SIZE/2} r={RADIUS}
                            stroke={finalTargetColor} strokeWidth={STROKE_WIDTH}
                            strokeDasharray={CIRCUMFERENCE} strokeLinecap="round"
                            rotation="-90" origin={`${VIEW_SIZE/2}, ${VIEW_SIZE/2}`}
                            fill="none"
                            animatedProps={connectRingProps}
                        />
                    </Svg>
                </Animated.View>

                {/* TEXT CONTAINER */}
                <View style={styles.textContainer}>
                    <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center' }}>
                        {statusText}
                    </AppText>
                    <AppText style={{ color: colors.subtle, textAlign: 'center' }} numberOfLines={1}>
                        {targetOrgName}
                    </AppText>
                    {(targetRoleLabel || targetTypeLabel) ? (
                      <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 6 }} numberOfLines={2}>
                        {[targetRoleLabel, targetTypeLabel].filter(Boolean).join(' · ')}
                      </AppText>
                    ) : null}
                </View>

            </ClayView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'transparent' 
  },
  cardWrapper: {
    // Explicit fixed dimensions wrapper
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { 
    width: CARD_WIDTH, // FORCE FIXED WIDTH
    height: CARD_HEIGHT, // FORCE FIXED HEIGHT
    paddingVertical: 50, // Adjusted padding
    alignItems: 'center', 
    borderRadius: 32,
    justifyContent: 'center' // Center content vertically
  },
  animationWrapper: { 
    width: VIEW_SIZE, 
    height: VIEW_SIZE, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 30, 
    position: 'relative' 
  },
  avatarContainer: {
    width: (RADIUS * 2) - 4, 
    height: (RADIUS * 2) - 4,
    borderRadius: RADIUS,
    overflow: 'hidden', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarImage: { width: '100%', height: '100%' },
  centered: { justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' },
  svgContainer: { position: 'absolute', top: 0, left: 0, zIndex: 2 },
  textContainer: { 
    height: 80, // Fixed text height
    width: '100%',
    paddingHorizontal: 20, // Prevent text touching edges
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});