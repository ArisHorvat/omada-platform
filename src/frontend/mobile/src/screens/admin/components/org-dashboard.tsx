import React from 'react';

import { ScrollView, View, ActivityIndicator } from 'react-native';

import { useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';

import { WidgetPageShell } from '@/src/components/layout';

import { useThemeColors } from '@/src/hooks';

import { AppButton, AppText, ClayView, Icon, type IconName } from '@/src/components/ui';

import { useOrgAdminDashboardLogic } from '../hooks/useOrgAdminDashboardLogic';

import { OnboardingChecklist } from './OnboardingChecklist';



function AdminFeatureBlock({

  icon,

  title,

  subtitle,

  body,

  actionTitle,

  onPress,

  colors,

}: {

  icon: IconName;

  title: string;

  subtitle: string;

  body: string;

  actionTitle: string;

  onPress: () => void;

  colors: ReturnType<typeof useThemeColors>;

}) {

  return (

    <ClayView

      depth={3}

      color={colors.card}

      style={{

        borderRadius: 16,

        padding: 18,

        marginBottom: 14,

      }}

    >

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>

        <ClayView

          depth={2}

          color={colors.primary + '22'}

          style={{

            width: 48,

            height: 48,

            borderRadius: 14,

            alignItems: 'center',

            justifyContent: 'center',

          }}

        >

          <Icon name={icon} size={26} color={colors.primary} />

        </ClayView>

        <View style={{ flex: 1 }}>

          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 2 }}>

            {subtitle}

          </AppText>

          <AppText variant="h3" weight="bold" style={{ color: colors.text }}>

            {title}

          </AppText>

        </View>

      </View>

      <AppText variant="body" style={{ color: colors.text, marginBottom: 14, lineHeight: 22 }}>

        {body}

      </AppText>

      <AppButton title={actionTitle} onPress={onPress} style={{ alignSelf: 'flex-start', minWidth: 168 }} />

    </ClayView>

  );

}



export default function OrgAdminDashboard() {

  const colors = useThemeColors();

  const insets = useSafeAreaInsets();

  const router = useRouter();

  const { activeSession } = useAuth();

  const { org, memberCount, loading, handleLogout } = useOrgAdminDashboardLogic();



  const isSuperAdmin = activeSession?.role === 'SuperAdmin';



  return (

    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>

      <WidgetPageShell>

      <ClayView

        depth={3}

        color={colors.card}

        style={{

          marginHorizontal: 16,

          marginBottom: 12,

          paddingHorizontal: 16,

          paddingVertical: 14,

          borderRadius: 14,

        }}

      >

        <AppText variant="h3" weight="bold">

          Organization admin

        </AppText>

        {loading ? (

          <ActivityIndicator style={{ marginTop: 8 }} color={colors.primary} />

        ) : (

          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>

            {org?.name ?? 'Your organization'} · {memberCount} member{memberCount === 1 ? '' : 's'}

          </AppText>

        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>

          {isSuperAdmin ? (

            <AppButton

              title="Platform admin"

              variant="outline"

              onPress={() => router.push('/admin-dashboard')}

              style={{ minWidth: 140 }}

            />

          ) : null}

          <AppButton title="Sign out" variant="outline" onPress={handleLogout} style={{ minWidth: 120 }} />

        </View>

      </ClayView>



      <ScrollView

        contentContainerStyle={{

          paddingHorizontal: 16,

          paddingBottom: insets.bottom + 24,

        }}

        showsVerticalScrollIndicator={false}

      >

        <OnboardingChecklist onboardingStep={org?.onboardingStep ?? 0} memberCount={memberCount} />



        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10 }}>

          People & governance

        </AppText>



        <AdminFeatureBlock

          icon="people"

          title="People & invites"

          subtitle="Members · roles · join link"

          body="Invite colleagues, share your organization code, assign roles, and deactivate members when they leave."

          actionTitle="Manage people"

          onPress={() => router.push('/members-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="admin-panel-settings"

          title="Roles & permissions"

          subtitle="Widget access control"

          body="Define roles and set View, Edit, or Admin access per widget — the same matrix configured during registration, now editable."

          actionTitle="Edit permissions"

          onPress={() => router.push('/roles-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="palette"

          title="Branding & appearance"

          subtitle="Logo · colors · identity"

          body="Update your organization name, logo, and theme colors. Changes apply across the app for all members."

          actionTitle="Edit branding"

          onPress={() => router.push('/branding-workspace' as never)}

          colors={colors}

        />



        <AppText variant="label" style={{ color: colors.subtle, marginBottom: 10, marginTop: 8 }}>

          Structure & operations

        </AppText>



        <AdminFeatureBlock

          icon="group"

          title="Groups & structure"

          subtitle="Teams · classes · departments"

          body="Create nested groups for your organization — departments, teams, subjects, series, and classes. Link members from the directory."

          actionTitle="Open groups workspace"

          onPress={() => router.push('/groups-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="map"

          title="Floorplan extraction"

          subtitle="Maps & rooms"

          body="Create buildings, upload floor images, run AI room detection, refine polygons, and publish bookable rooms."

          actionTitle="Open floorplan workspace"

          onPress={() => router.push('/floorplan-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="event"

          title="Event types"

          subtitle="Schedule categories"

          body="Manage calendar event types and colors used when creating events, booking rooms, and viewing the schedule."

          actionTitle="Manage event types"

          onPress={() => router.push('/event-types-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="article"

          title="News management"

          subtitle="Announcements & articles"

          body="Create, edit, and publish organization news. Spider-imported articles also land here after a news sync."

          actionTitle="Open news"

          onPress={() => router.push('/news' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="calendar-today"

          title="Schedule"

          subtitle="Events & timetable"

          body="Review and manage calendar events for your organization. Scraped timetable data feeds into schedule views after sync."

          actionTitle="Open schedule"

          onPress={() => router.push('/schedule' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="date-range"

          title="Academic periods"

          subtitle="Semesters · terms · sprints"

          body="Define organization periods so grades, reports, and filters use consistent semester labels."

          actionTitle="Manage periods"

          onPress={() => router.push('/periods-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="school"

          title="Grades management"

          subtitle="Student results"

          body="Record and review grades for organization members. University organizations can track GPA-related course results."

          actionTitle="Open grades workspace"

          onPress={() => router.push('/grades-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="fact-check"

          title="Attendance records"

          subtitle="Org-wide visibility"

          body="Review attendance marked across schedule sessions — useful for teachers and admins monitoring participation."

          actionTitle="View attendance"

          onPress={() => router.push('/attendance-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="widgets"

          title="Widget catalog"

          subtitle="Organization features"

          body="Enable or disable widgets organization-wide. Role permissions still control who can access each enabled feature."

          actionTitle="Manage widgets"

          onPress={() => router.push('/widgets-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="meeting-room"

          title="Rooms management"

          subtitle="Bookable spaces"

          body="Create, search, and remove rooms available for booking across your organization."

          actionTitle="Open rooms workspace"

          onPress={() => router.push('/rooms-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="history"

          title="Audit log"

          subtitle="Admin activity"

          body="Review recent organization admin actions such as member updates, role changes, and settings edits."

          actionTitle="View audit log"

          onPress={() => router.push('/audit-workspace' as never)}

          colors={colors}

        />



        <AdminFeatureBlock

          icon="language"

          title="Web crawling"

          subtitle="Timetable & news"

          body="Preview scraped timetable rows and news articles, sync schedule and news into Omada, and review unresolved professor or room matches."

          actionTitle="Open web crawler"

          onPress={() => router.push('/web-spider-workspace' as never)}

          colors={colors}

        />

      </ScrollView>

      </WidgetPageShell>

    </View>

  );

}

