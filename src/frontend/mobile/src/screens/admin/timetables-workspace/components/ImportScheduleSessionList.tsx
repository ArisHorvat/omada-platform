import React, { useState } from 'react';

import { TouchableOpacity, View } from 'react-native';



import { AppText, ClayView, Icon } from '@/src/components/ui';

import { PressClay } from '@/src/components/animations';

import { ScrapedEventCompactRow } from '@/src/screens/admin/web-spider-workspace/components/ScrapedEventCompactRow';

import type { WebSpiderWorkspaceModel } from '@/src/screens/admin/web-spider-workspace/hooks/useWebSpiderWorkspace';

import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';

import { scrapedSessionKey } from '../utils/scrapedSessionKey';



const MAX_ROWS = 80;



type Props = {

  model: WebSpiderWorkspaceModel;

  events: ScrapedScheduleEvent[];

  title?: string;

  enabledSessionKeys: Set<string>;

  onToggleSession: (key: string) => void;

  onSetAllSessions: (enabled: boolean) => void;

};



export function ImportScheduleSessionList({

  model,

  events,

  title,

  enabledSessionKeys,

  onToggleSession,

  onSetAllSessions,

}: Props) {

  const { colors } = model;

  const [expanded, setExpanded] = useState(false);



  const visible = events.slice(0, MAX_ROWS);

  const truncated = events.length > MAX_ROWS;

  const enabledCount = events.filter((ev, i) => enabledSessionKeys.has(scrapedSessionKey(ev, i))).length;



  if (events.length === 0) return null;



  return (

    <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>

      <TouchableOpacity

        onPress={() => setExpanded((v) => !v)}

        activeOpacity={0.85}

        style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}

      >

        <View

          style={{

            width: 4,

            alignSelf: 'stretch',

            borderRadius: 2,

            backgroundColor: colors.primary,

          }}

        />

        <View style={{ flex: 1 }}>

          <AppText variant="label" weight="bold" style={{ color: colors.text }}>

            {title ?? 'Sessions'}

          </AppText>

          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4, lineHeight: 18 }}>

            {enabledCount} of {events.length} selected for import

            {truncated ? ` · showing first ${MAX_ROWS} when expanded` : ''}

          </AppText>

          {!expanded ? (

            <AppText variant="caption" style={{ color: colors.primary, marginTop: 6, lineHeight: 16 }}>

              Tap to expand — deselect any session you do not want in the import.

            </AppText>

          ) : null}

        </View>

        <Icon name={expanded ? 'expand-less' : 'expand-more'} size={24} color={colors.subtle} />

      </TouchableOpacity>



      {expanded ? (

        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>

            <PressClay onPress={() => onSetAllSessions(true)}>

              <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>

                Select all

              </AppText>

            </PressClay>

            <AppText variant="caption" style={{ color: colors.subtle }}>

              ·

            </AppText>

            <PressClay onPress={() => onSetAllSessions(false)}>

              <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>

                Deselect all

              </AppText>

            </PressClay>

          </View>



          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 10 }}>

            Tap a row to include or exclude it. Disabled sessions stay visible but won&apos;t be written to the

            offering pattern.

          </AppText>



          <View style={{ gap: 8 }}>

            {visible.map((ev, i) => {

              const key = scrapedSessionKey(ev, i);

              const enabled = enabledSessionKeys.has(key);

              return (

                <PressClay key={key} onPress={() => onToggleSession(key)}>

                  <View style={{ opacity: enabled ? 1 : 0.45 }}>

                    <ScrapedEventCompactRow model={model} event={ev} />

                    {!enabled ? (

                      <AppText variant="caption" style={{ color: colors.subtle, marginTop: -4, marginBottom: 4 }}>

                        Excluded from import

                      </AppText>

                    ) : null}

                  </View>

                </PressClay>

              );

            })}

          </View>



          {truncated ? (

            <AppText variant="caption" style={{ color: colors.primary, marginTop: 10 }}>

              Narrow to a single group to see every session.

            </AppText>

          ) : null}

        </View>

      ) : null}

    </ClayView>

  );

}


