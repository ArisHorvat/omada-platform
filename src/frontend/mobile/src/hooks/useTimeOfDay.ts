import { useState, useEffect } from 'react';

export const useTimeOfDay = () => {
  const [greeting, setGreeting] = useState('');
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      setGreeting('Good Morning');
      setPeriod('morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
      setPeriod('afternoon');
    } else {
      setGreeting('Good Evening');
      setPeriod('evening');
    }
  }, []);

  return { greeting, period };
};