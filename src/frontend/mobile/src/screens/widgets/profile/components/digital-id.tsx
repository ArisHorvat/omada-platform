import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { useThemeColors } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { UserService } from '@/src/services/UserService';
import { OrganizationService } from '@/src/services/OrganizationService';
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';
import { AppText } from '@/src/components/ui';

const { width } = Dimensions.get('window');

export default function DigitalIDScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { activeSession } = useAuth();
  
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!activeSession?.orgId) return;
      
      try {
        setLoading(true);
        // Fetch both in parallel for speed
        const [userData, orgData] = await Promise.all([
            UserService.getMe(),
            OrganizationService.getById(activeSession.orgId)
        ]);
        
        setUser(userData);
        setOrg(orgData);
      } catch (e) {
        console.error("Failed to load Digital ID data", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeSession?.orgId]);

  if (loading) {
      return (
          <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
          </View>
      );
  }

  if (!user || !org) {
      return (
          <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
              <AppText>Could not load ID Card.</AppText>
          </View>
      );
  }

  // Choose ID Card Color (Primary or a default dark/brand color)
  const cardColor = org.primaryColor || colors.primary;
  // Simple contrast check (white text on dark card)
  const onPrimary = '#FFFFFF'; 

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
            <MaterialIcons name="close" size={28} color={colors.text} onPress={() => router.back()} />
            <Text style={[styles.title, { color: colors.text }]}>Digital ID</Text>
            <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            {/* ID CARD */}
            <View style={[styles.idCard, { backgroundColor: cardColor }]}>
                {/* Header: Org Name & Logo */}
                <View style={styles.idHeader}>
                    <Text style={[styles.idOrgName, { color: onPrimary }]}>{org.name}</Text>
                    {org.logoUrl && (
                        <ProgressiveImage 
                            source={{ uri: org.logoUrl }} 
                            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)' }} 
                        />
                    )}
                </View>
                
                {/* Body: Avatar & User Info */}
                <View style={styles.idContent}>
                    <View style={styles.idAvatar}>
                        {user.profilePictureUrl ? (
                            <ProgressiveImage source={{ uri: user.profilePictureUrl }} style={styles.idAvatarImage} />
                        ) : (
                            <MaterialIcons name="person" size={40} color={cardColor} />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.idName, { color: onPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                            {user.firstName} {user.lastName}
                        </Text>
                        <Text style={[styles.idRole, { color: onPrimary, opacity: 0.9 }]}>
                             {activeSession?.role || 'Member'}
                        </Text>
                        {user.email && (
                             <Text style={{ color: onPrimary, opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                                 {user.email}
                             </Text>
                        )}
                    </View>
                </View>
                
                {/* Footer: QR Code & ID Number */}
                <View style={styles.idFooter}>
                    <View>
                        <Text style={{ color: onPrimary, fontSize: 10, opacity: 0.7, marginBottom: 4 }}>STUDENT / EMP ID</Text>
                        <Text style={{ color: onPrimary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>
                            {user.id ? user.id.substring(0, 8).toUpperCase() : 'UNKNOWN'}
                        </Text>
                    </View>
                    <View style={styles.idQr}>
                        <QRCode 
                            value={`omada:${user.id}`} 
                            size={50} 
                            color="#000" 
                            backgroundColor="#FFF" 
                        />
                    </View>
                </View>
            </View>

            <Text style={[styles.footerText, { color: colors.subtle }]}>
                This digital ID is official proof of membership for {org.name}. 
                Scan the QR code at terminals for access.
            </Text>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 10 
  },
  title: { fontSize: 18, fontWeight: '600' },
  content: { alignItems: 'center', padding: 20 },
  
  // Card Styles
  idCard: {
      width: width - 40,
      height: 220, // Fixed height for standard ID look
      borderRadius: 24,
      padding: 24,
      justifyContent: 'space-between',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
  },
  idHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start' 
  },
  idOrgName: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },
  
  idContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  idAvatar: { 
      width: 64, 
      height: 64, 
      borderRadius: 32, 
      backgroundColor: '#fff', 
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden'
  },
  idAvatarImage: { width: '100%', height: '100%' },
  idName: { fontSize: 20, fontWeight: 'bold' },
  idRole: { fontSize: 14, marginTop: 2 },
  
  idFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  idQr: { 
      padding: 4, 
      backgroundColor: 'white', 
      borderRadius: 8 
  },
  
  footerText: { 
      textAlign: 'center', 
      marginTop: 24, 
      fontSize: 13, 
      paddingHorizontal: 30,
      lineHeight: 20
  }
});