import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/widgets/profile/styles/profile.styles';
import { useProfileLogic } from '@/src/screens/widgets/profile/hooks/useProfileLogic';
import { ProgressiveImage } from '@/src/components/ui/ProgressiveImage';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { 
    user, 
    organization, 
    isLoading, 
    showAccountSwitcher, 
    setShowAccountSwitcher, 
    myOrganizations, 
    openOrgSwitcher, 
    handleSwitchOrg, 
    handleLogout, 
    email, 
    role 
    } = useProfileLogic();

  if (isLoading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : (email ? email.split('@')[0] : 'User');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ... Header and Content (Keep as is) ... */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <MaterialIcons name="settings" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.profilePictureUrl ? (
                <ProgressiveImage source={{ uri: user.profilePictureUrl }} style={styles.avatarImage} />
            ) : (
                <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Digital ID */}
        <TouchableOpacity style={styles.idCard} onPress={() => router.push('/digital-id' as any)}>
            <View style={styles.idIcon}>
                <MaterialIcons name="badge" size={24} color={colors.info} />
            </View>
            <View style={styles.idContent}>
                <Text style={styles.idTitle}>Digital ID Card</Text>
                <Text style={styles.idSubtitle}>Tap to view your ID</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.subtle} />
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={openOrgSwitcher}>
                <MaterialIcons name="business" size={24} color={colors.primary} style={styles.menuIcon} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.menuText}>Organization</Text>
                    {organization?.name && (
                        <Text style={styles.menuValue} numberOfLines={1}>{organization.name}</Text>
                    )}
                </View>
                <MaterialIcons name="swap-horiz" size={24} color={colors.subtle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/manage-favorites' as any)}>
                <MaterialIcons name="star" size={24} color={colors.tertiary} style={styles.menuIcon} />
                <Text style={styles.menuText}>Favorites</Text>
                <MaterialIcons name="chevron-right" size={24} color={colors.subtle} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                <MaterialIcons name="logout" size={24} color={colors.notification} style={styles.menuIcon} />
                <Text style={[styles.menuText, { color: colors.notification }]}>Log Out</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- FIXED MODAL --- */}
      <Modal 
        visible={showAccountSwitcher} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setShowAccountSwitcher(false)}
      >
        <TouchableOpacity 
            style={styles.modalContainer} 
            activeOpacity={1} 
            onPress={() => setShowAccountSwitcher(false)}
        >
            <View 
                style={styles.modalContent} 
                onStartShouldSetResponder={() => true} // <-- STOPS CLICK PROPAGATION
            >
                <Text style={styles.modalTitle}>Switch Organization</Text>
                <FlatList
                    data={myOrganizations}
                    keyExtractor={(item) => item.organizationId}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.accountItem} 
                            onPress={() => {
                                if (!item.isCurrent) {
                                    handleSwitchOrg(item.organizationId);
                                }
                            }}
                        >
                            <View style={styles.accountInfo}>
                                <Text style={[styles.accountEmail, item.isCurrent && { color: colors.primary }]}>{item.organizationName}</Text>
                                <Text style={styles.accountOrg}>{item.role}</Text>
                            </View>
                            {item.isCurrent && <View style={styles.activeBadge} />}
                        </TouchableOpacity>
                    )}
                />
                <TouchableOpacity 
                    style={{ marginTop: 20, padding: 12, backgroundColor: colors.background, borderRadius: 12, alignItems: 'center' }} 
                    onPress={() => { setShowAccountSwitcher(false); router.push('/login-flow'); }}
                >
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Add Another Account</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}