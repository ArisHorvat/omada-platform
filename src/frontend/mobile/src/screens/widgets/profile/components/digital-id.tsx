import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import { UserService } from '@/src/services/UserService';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';

const { width } = Dimensions.get('window');

export default function DigitalIDScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { token } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (token) {
        try {
          const userData = await UserService.getMe();
          setUser(userData);
        } catch (e) { console.error(e); }
      }
    };
    loadData();

    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) setOrg(data);
    });
    return () => unsubscribe();
  }, [token]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 16 },
    cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    
    // ID Card Styles matching Branding Preview
    idCard: { width: '100%', aspectRatio: 1.58, borderRadius: 20, padding: 24, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8, overflow: 'hidden' },
    idHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    idOrgName: { fontSize: 18, fontWeight: 'bold', opacity: 0.9 },
    idContent: { flexDirection: 'row', alignItems: 'center' },
    idAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 16, alignItems: 'center', justifyContent: 'center' },
    idAvatarImage: { width: 64, height: 64, borderRadius: 32 },
    idName: { fontSize: 22, fontWeight: 'bold' },
    idRole: { fontSize: 14, fontWeight: '600', opacity: 0.8, marginTop: 4, textTransform: 'uppercase' },
    idFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    idQr: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 8, padding: 4 },
    
    footerText: { fontSize: 12, color: colors.subtle, textAlign: 'center', marginTop: 24 },
  }), [colors]);

  if (!user || !org) return <View style={styles.container} />;

  // Calculate contrast color for text on primary background
  // Assuming org.primaryColor is available, otherwise fallback to white
  const onPrimary = colors.onPrimary; 

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital ID</Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={[styles.idCard, { backgroundColor: org.primaryColor || colors.primary }]}>
            {/* Decorative Circles */}
            <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: org.secondaryColor || colors.secondary, opacity: 0.5 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: org.tertiaryColor || colors.tertiary, opacity: 0.3 }} />
            
            <View style={styles.idHeader}>
                <Text style={[styles.idOrgName, { color: onPrimary }]}>{org.name}</Text>
                {org.logoUrl && <ProgressiveImage source={{ uri: org.logoUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />}
            </View>
            
            <View style={styles.idContent}>
                <View style={styles.idAvatar}>
                    {user.profilePictureUrl ? (
                        <ProgressiveImage source={{ uri: user.profilePictureUrl }} style={styles.idAvatarImage} />
                    ) : (
                        <MaterialIcons name="person" size={40} color={onPrimary} />
                    )}
                </View>
                <View>
                    <Text style={[styles.idName, { color: onPrimary }]}>{user.firstName} {user.lastName}</Text>
                    <Text style={[styles.idRole, { color: onPrimary }]}>{user.role}</Text>
                </View>
            </View>
            
            <View style={styles.idFooter}>
                <Text style={{ color: onPrimary, fontSize: 10, opacity: 0.7 }}>ID: {user.id.substring(0, 8).toUpperCase()}</Text>
                <View style={styles.idQr}>
                    <QRCode value={`omada:${user.id}`} size={40} />
                </View>
            </View>
        </View>
        <Text style={styles.footerText}>This digital ID is official proof of affiliation.</Text>
      </View>
    </SafeAreaView>
  );
}