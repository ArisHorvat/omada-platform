import { useEffect, useState } from 'react';

export function useQrCountdown(expiresAtUtc: Date | string | undefined): number {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAtUtc) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const exp = new Date(expiresAtUtc).getTime();
      const ms = Math.max(0, exp - Date.now());
      setSecondsLeft(Math.ceil(ms / 1000));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAtUtc]);

  return secondsLeft;
}
