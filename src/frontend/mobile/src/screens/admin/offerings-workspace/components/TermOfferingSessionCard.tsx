import React, { useEffect, useMemo, useState } from 'react';

import { View } from 'react-native';

import { useMutation, useQueryClient } from '@tanstack/react-query';



import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';

import { PressClay } from '@/src/components/animations';

import { useThemeColors } from '@/src/hooks';

import { offeringsApi, unwrapOfferingsAxios, type CourseOfferingDto, type TimetableOfferingPublishStatusDto } from '@/src/api/offeringsApi';

import { confirmAction, alertAction } from '@/src/utils/confirmAction';

import { QUERY_KEYS } from '@/src/api/queryKeys';

import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';



import { WeeklySessionPlanEditor } from './WeeklySessionPlanEditor';

import {

  summarizeWeeklyPlan,

  normalizeWeeklySessions,

  buildTimetableInstructorOptions,

  deriveInstructorsFromSessions,

  validateWeeklySessionsForSave,

  type OfferingWeeklySession,

} from '../utils/offeringSessionPlan';

import { useOfferingCohortOptions } from '../hooks/useOfferingCohortOptions';
import { useGroupStaffPicker } from '../hooks/useGroupStaffPicker';

import { createOfferingsWorkspaceStyles } from '../styles/offerings-workspace.styles';



type Props = {

  periodId: string;

  offering: CourseOfferingDto;

  /** embedded = inside periods card; course-card = collapsible row like offerings package */

  variant?: 'embedded' | 'standalone' | 'course-card';

  publishStatus?: TimetableOfferingPublishStatusDto;

  onPublishComplete?: () => void;

};



function mapSessionsFromOffering(offering: CourseOfferingDto): OfferingWeeklySession[] {

  return (offering.weeklySessions ?? []).map((s, i) => ({

    eventTypeId: s.eventTypeId,

    eventTypeName: s.eventTypeName,

    hoursPerSession: s.hoursPerSession,

    frequency: s.frequency ?? 'weekly',
    biweeklyPhase:
      s.frequency === 'biweekly'
        ? ((s as { biweeklyPhase?: number }).biweeklyPhase === 2 ? 2 : 1)
        : undefined,

    isOptional: s.isOptional ?? false,

    sortOrder: s.sortOrder ?? i,

    dayOfWeek: s.dayOfWeek ?? 1,

    startTimeLocal: s.startTimeLocal ?? '09:00',

    hostId: s.hostId,

    hostName: s.hostName,

    roomId: s.roomId,

    roomName: s.roomName,

    audienceScope: s.audienceScope ?? 'all',

    cohortGroupIds: s.cohortGroupIds ?? [],

    cohortDelivery: s.cohortDelivery ?? 'split',

    cohortAssignments: s.cohortAssignments?.map((a) => ({

      hostId: a.hostId,

      hostName: a.hostName,

      cohortGroupIds: a.cohortGroupIds ?? [],

      dayOfWeek: a.dayOfWeek ?? s.dayOfWeek ?? 1,

      startTimeLocal: a.startTimeLocal ?? s.startTimeLocal ?? '09:00',

      roomId: a.roomId,

      roomName: a.roomName,

      frequency: (a as { frequency?: string }).frequency ?? s.frequency,

      biweeklyPhase:
        ((a as { frequency?: string }).frequency ?? s.frequency) === 'biweekly'
          ? (a as { biweeklyPhase?: number }).biweeklyPhase === 2 ||
            ((a as { biweeklyPhase?: number }).biweeklyPhase == null && s.biweeklyPhase === 2)
            ? 2
            : 1
          : undefined,

    })),

  }));

}



export function TermOfferingSessionCard({ periodId, offering, variant = 'standalone', publishStatus, onPublishComplete }: Props) {

  const colors = useThemeColors();

  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);

  const { organization } = useCurrentOrganization();

  const orgId = organization?.id ?? '';

  const queryClient = useQueryClient();

  const embedded = variant === 'embedded';

  const courseCard = variant === 'course-card';

  const [expanded, setExpanded] = useState(false);



  const programIds =

    offering.programGroupIds?.length

      ? offering.programGroupIds

      : offering.programGroupId

        ? [offering.programGroupId]

        : [];



  const { options: cohortOptions, hasEnrollments } = useOfferingCohortOptions(

    periodId,

    offering.id,

    programIds,

  );

  const { allStaffOptions } = useGroupStaffPicker(null);



  const [sessions, setSessions] = useState<OfferingWeeklySession[]>(() => mapSessionsFromOffering(offering));



  useEffect(() => {

    setSessions(mapSessionsFromOffering(offering));

  }, [offering.id, JSON.stringify(offering.weeklySessions), offering.timetablePublishedAt]);



  const planContext = useMemo(

    () => ({

      instructorOptions: buildTimetableInstructorOptions(offering, allStaffOptions, sessions),

      cohortOptions,

    }),

    [offering, cohortOptions, allStaffOptions, sessions],

  );



  const handleSavePattern = () => {

    const validationError = validateWeeklySessionsForSave(sessions);

    if (validationError) {

      alertAction({ title: 'Complete instructor blocks', message: validationError });

      return;

    }

    saveMutation.mutate();

  };



  const summary = summarizeWeeklyPlan(sessions);

  const canPublish = sessions.some((s) => s.eventTypeId);

  const displayName = offering.name.trim() || 'Course';



  const saveMutation = useMutation({

    mutationFn: () =>

      unwrapOfferingsAxios(

        offeringsApi.update(periodId, offering.id, {

          name: offering.name,

          code: offering.code,

          description: offering.description,

          programGroupIds: programIds,

          hostId: offering.hostId,

          instructors: deriveInstructorsFromSessions(sessions, offering.hostId),

          credits: offering.credits,

          requiredAttendancePercent: offering.requiredAttendancePercent ?? undefined,

          weeklySessions: normalizeWeeklySessions(sessions),

        }),

      ),

    onSuccess: async (updated) => {

      if (updated?.weeklySessions) {

        setSessions(mapSessionsFromOffering(updated));

      }

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offeringPackages(orgId) });
      await queryClient.invalidateQueries({ queryKey: ['timetables-preview', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['timetables-publish-status', orgId] });

      alertAction({ title: 'Saved', message: 'Weekly timetable pattern updated.' });

    },

    onError: (e: Error) => alertAction({ title: 'Could not save pattern', message: e.message }),

  });



  const publishMutation = useMutation({

    mutationFn: (opts: { replaceExisting: boolean; forceDespiteConflicts?: boolean }) =>

      unwrapOfferingsAxios(
        offeringsApi.publishTimetable(periodId, offering.id, {
          replaceExisting: opts.replaceExisting,
          forceDespiteConflicts: opts.forceDespiteConflicts,
        }),
      ),

    onSuccess: async (result) => {

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule.all(orgId) });
      await queryClient.invalidateQueries({ queryKey: ['timetables-preview', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['timetables-publish-status', orgId] });
      onPublishComplete?.();

      alertAction({

        title: 'Published to schedule',

        message: `Created ${result.eventsCreated} recurring session(s) and seeded ${result.expectedAttendanceRowsSeeded} expected attendance row(s).`,

      });

    },

    onError: (e: Error) => alertAction({ title: 'Publish failed', message: e.message }),

  });



  const handlePublish = async () => {

    if (!canPublish) {

      alertAction({

        title: 'Add activities first',

        message: 'Expand the course, add at least one activity with a type, save, then publish.',

      });

      setExpanded(true);

      return;

    }



    const replace = !!offering.timetablePublishedAt;

    const runPublish = async (forceDespiteConflicts = false) => {

      try {

        const validationError = validateWeeklySessionsForSave(sessions);

        if (validationError) {

          alertAction({ title: 'Complete instructor blocks', message: validationError });

          return;

        }

        await saveMutation.mutateAsync();

        await publishMutation.mutateAsync({ replaceExisting: replace, forceDespiteConflicts });

      } catch {

        // Errors surfaced by mutation onError handlers

      }

    };

    const conflictCount = publishStatus?.conflictCount ?? 0;

    if (conflictCount > 0) {

      confirmAction({

        title: `${conflictCount} scheduling conflict${conflictCount === 1 ? '' : 's'}`,

        message:

          (publishStatus?.conflictMessages?.slice(0, 2).join('\n') ?? 'Conflicts detected in timetable preview.') +

          '\n\nPublish anyway? This may double-book instructors, groups, or rooms.',

        confirmText: 'Publish anyway',

        destructive: true,

        onConfirm: () => {

          void runPublish(true);

        },

      });

      return;

    }



    if (replace) {

      confirmAction({

        title: 'Republish timetable?',

        message: 'This saves your latest pattern and replaces previously published schedule events for this offering.',

        confirmText: 'Replace',

        destructive: true,

        onConfirm: () => {

          void runPublish(false);

        },

      });

      return;

    }



    await runPublish(false);

  };



  const busy = saveMutation.isPending || publishMutation.isPending;



  const editorBlock = expanded ? (

    <View style={courseCard ? styles.courseExpanded : undefined}>

      {courseCard ? (

        <View style={[styles.courseDivider, { backgroundColor: colors.border }]} />

      ) : null}

      <ClayView depth={1} color={colors.card} style={{ padding: 10, borderRadius: 12, gap: 8 }}>

        <WeeklySessionPlanEditor sessions={sessions} onChange={setSessions} planContext={planContext} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>

          <AppButton

            title={saveMutation.isPending ? 'Saving…' : 'Save pattern'}

            onPress={handleSavePattern}

            disabled={busy}

            loading={saveMutation.isPending}

            size="sm"

          />

          <AppButton

            title={

              publishMutation.isPending

                ? 'Publishing…'

                : offering.timetablePublishedAt

                  ? 'Republish'

                  : 'Publish to schedule'

            }

            size="sm"

            icon="event"

            onPress={handlePublish}

            disabled={busy}

            loading={publishMutation.isPending}

          />

        </View>

      </ClayView>

    </View>

  ) : null;



  if (courseCard) {

    return (

      <View style={styles.courseShell}>

        <ClayView depth={3} color={colors.background} contentOverflow="visible" style={styles.courseCard}>

          <View style={styles.courseHeader}>

            <ClayView depth={4} color={colors.primary + '22'} style={styles.courseIcon}>

              <Icon name="menu-book" size={22} color={colors.primary} />

            </ClayView>

            <PressClay onPress={() => setExpanded((v) => !v)} style={{ flex: 1, minWidth: 0 }}>

              <View style={{ flex: 1, minWidth: 0 }}>

                <AppText variant="body" weight="bold" numberOfLines={1}>

                  {displayName}

                </AppText>

                <View style={styles.courseMetaRow}>

                  {offering.code?.trim() ? (

                    <View style={[styles.courseMetaPill, { backgroundColor: colors.card }]}>

                      <AppText variant="caption" style={{ color: colors.text }}>

                        {offering.code.trim()}

                      </AppText>

                    </View>

                  ) : null}

                  <View style={[styles.courseMetaPill, { backgroundColor: colors.card }]}>

                    <AppText variant="caption" style={{ color: colors.subtle }}>

                      {offering.enrollmentCount} enrolled

                    </AppText>

                  </View>

                  {offering.hostName ? (

                    <View style={[styles.courseMetaPill, { backgroundColor: colors.primary + '18' }]}>

                      <Icon name="person" size={12} color={colors.primary} />

                      <AppText variant="caption" style={{ color: colors.primary, marginLeft: 4 }} numberOfLines={1}>

                        {offering.hostName}

                      </AppText>

                    </View>

                  ) : null}

                </View>

                <AppText variant="caption" style={{ color: colors.secondary, marginTop: 6 }}>

                  {summary}

                  {offering.timetablePublishedAt

                    ? ` · Published ${new Date(offering.timetablePublishedAt).toLocaleDateString()}`

                    : ' · Not published'}

                </AppText>

              </View>

            </PressClay>

            <PressClay onPress={() => setExpanded((v) => !v)} accessibilityLabel={expanded ? 'Collapse' : 'Expand'}>

              <ClayView depth={4} color={colors.card} style={styles.courseIconBtn}>

                <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.primary} />

              </ClayView>

            </PressClay>

          </View>

          {editorBlock}

        </ClayView>

      </View>

    );

  }



  return (

    <View style={{ marginTop: embedded ? 12 : 0, gap: 8 }}>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>

        <View style={{ flex: 1 }}>

          {!embedded ? (

            <>

              <AppText variant="body" weight="bold" numberOfLines={1} style={{ color: colors.text }}>

                {offering.name}

              </AppText>

              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>

                {offering.enrollmentCount} enrolled

                {offering.hostName ? ` · ${offering.hostName}` : ''}

              </AppText>

            </>

          ) : (

            <>

              <AppText variant="caption" weight="bold" style={{ color: colors.secondary }}>

                WEEKLY TIMETABLE

              </AppText>

              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>

                Define lab / seminar slots, assign instructors and groups, then publish to Schedule.

              </AppText>

            </>

          )}

          <AppText variant="caption" style={{ color: colors.secondary, marginTop: 4 }}>

            {summary}

            {offering.timetablePublishedAt

              ? ` · Published ${new Date(offering.timetablePublishedAt).toLocaleDateString()}`

              : ' · Not published yet'}

          </AppText>

          {!hasEnrollments ? (

            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>

              Enroll groups before publishing so attendance rows can be seeded.

            </AppText>

          ) : null}

        </View>

        <PressClay onPress={() => setExpanded((v) => !v)} accessibilityLabel={expanded ? 'Collapse' : 'Expand'}>

          <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.subtle} />

        </PressClay>

      </View>



      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>

        <AppButton

          title={expanded ? 'Hide editor' : 'Edit timetable'}

          size="sm"

          variant="outline"

          icon={expanded ? 'expand-less' : 'edit'}

          onPress={() => setExpanded((v) => !v)}

        />

        <AppButton

          title={

            publishMutation.isPending

              ? 'Publishing…'

              : offering.timetablePublishedAt

                ? 'Republish to schedule'

                : 'Publish to schedule'

          }

          size="sm"

          icon="event"

          onPress={handlePublish}

          disabled={busy}

          loading={publishMutation.isPending}

        />

      </View>



      {editorBlock}

    </View>

  );

}


