import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as signalR from '@microsoft/signalr';

import { API_BASE_URL } from '@/src/config/config';
import { secureGetItem } from '@/src/lib/secureStorage';

export interface OrganizationHubHandlers {
  onAnnouncementPost?: (payload: unknown) => void;
  onAnnouncementComment?: (payload: unknown) => void;
  /** Called when the app returns to the foreground — refresh stale data after background. */
  onAppForeground?: () => void;
}

/** Expected when the OS suspends the app or we tear down during resume — not actionable. */
const QUIET_SIGNALR_MESSAGES = [
  'Server timeout elapsed',
  'stopped during negotiation',
  'before stop() was called',
  'Connection disconnected with error',
];

const quietSignalRLogger: signalR.ILogger = {
  log(logLevel, message) {
    if (QUIET_SIGNALR_MESSAGES.some((fragment) => message.includes(fragment))) return;
    if (logLevel >= signalR.LogLevel.Warning) {
      console.warn(`[SignalR] ${message}`);
    }
  },
};

export function useOrganizationHub(
  orgId: string,
  token: string | undefined,
  handlers: OrganizationHubHandlers,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const orgIdRef = useRef(orgId);
  orgIdRef.current = orgId;

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const lifecycleRef = useRef(0);
  const lifecycleChainRef = useRef(Promise.resolve());
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!orgId || !token) return;

    const enqueueLifecycle = (task: () => Promise<void>) => {
      lifecycleChainRef.current = lifecycleChainRef.current.then(task).catch(() => {});
    };

    const joinOrg = async (connection: signalR.HubConnection) => {
      const activeOrgId = orgIdRef.current;
      if (!activeOrgId || connection.state !== signalR.HubConnectionState.Connected) return;
      try {
        await connection.invoke('JoinOrganization', activeOrgId);
      } catch {
        /* retried on next connect */
      }
    };

    const stopConnection = async () => {
      const connection = connectionRef.current;
      connectionRef.current = null;
      if (!connection) return;
      try {
        await connection.stop();
      } catch {
        /* already stopped */
      }
    };

    const startConnection = async () => {
      if (pausedRef.current || !orgIdRef.current || !tokenRef.current) return;
      if (AppState.currentState !== 'active') return;

      const generation = lifecycleRef.current;

      await stopConnection();

      if (
        generation !== lifecycleRef.current ||
        pausedRef.current ||
        AppState.currentState !== 'active'
      ) {
        return;
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/ws/app`, {
          accessTokenFactory: async () =>
            (await secureGetItem('jwt_token')) ?? tokenRef.current ?? '',
          withCredentials: false,
        })
        .configureLogging(quietSignalRLogger)
        .build();

      connection.serverTimeoutInMilliseconds = 120_000;
      connection.keepAliveIntervalInMilliseconds = 15_000;

      connection.on('announcement_post', (payload) => {
        handlersRef.current.onAnnouncementPost?.(payload);
      });
      connection.on('announcement_comment', (payload) => {
        handlersRef.current.onAnnouncementComment?.(payload);
      });

      connectionRef.current = connection;

      try {
        await connection.start();
        if (
          generation !== lifecycleRef.current ||
          pausedRef.current ||
          connectionRef.current !== connection
        ) {
          await connection.stop();
          return;
        }
        await joinOrg(connection);
      } catch {
        if (connectionRef.current === connection) {
          connectionRef.current = null;
        }
        try {
          await connection.stop();
        } catch {
          /* ignore */
        }
      }
    };

    const pauseHub = () => {
      pausedRef.current = true;
      enqueueLifecycle(async () => {
        await stopConnection();
      });
    };

    const resumeHub = () => {
      pausedRef.current = false;
      enqueueLifecycle(async () => {
        if (AppState.currentState !== 'active') return;
        handlersRef.current.onAppForeground?.();
        await startConnection();
      });
    };

    const handleAppState = (next: AppStateStatus) => {
      if (next === 'background') {
        pauseHub();
        return;
      }

      if (next === 'active') {
        resumeHub();
      }
    };

    pausedRef.current = AppState.currentState === 'background';
    if (AppState.currentState === 'active') {
      enqueueLifecycle(async () => {
        await startConnection();
      });
    }

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      lifecycleRef.current += 1;
      pausedRef.current = true;
      subscription.remove();
      enqueueLifecycle(async () => {
        await stopConnection();
      });
    };
  }, [orgId, token]);
}
