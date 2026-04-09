import { useState } from 'react';
import { CreateEventRequest, ScheduleItemDto } from '@/src/api/generatedClient';
import { roundToQuarterHour } from '../utils/quarterHour';

export const useEventForm = (initialDate: Date) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [eventTypeId, setEventTypeId] = useState<string>('');
  const [maxCapacityText, setMaxCapacityText] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const [startDate, setStartDate] = useState(() => roundToQuarterHour(new Date(initialDate.getTime())));
  const [endDate, setEndDate] = useState(() => {
    const s = roundToQuarterHour(new Date(initialDate.getTime()));
    return roundToQuarterHour(new Date(s.getTime() + 60 * 60 * 1000));
  });
  
  // Recurrence State
  const [recFreq, setRecFreq] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('NONE');
  const [recInterval, setRecInterval] = useState(1);
  const [recEndMode, setRecEndMode] = useState<'never' | 'date'>('never');
  const [recEndDate, setRecEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 3)));
  const [recLabel, setRecLabel] = useState('Never');

  const resetForm = (date: Date) => {
      setTitle(''); setDescription(''); setColor('#3b82f6');
      setRoomId(null); setHostId(null); setHostName(null); setEventTypeId('');
      setMaxCapacityText('');
      setIsPublic(false);
      const start = roundToQuarterHour(new Date(date.getTime()));
      const end = roundToQuarterHour(new Date(start.getTime() + 60 * 60 * 1000));
      setStartDate(start);
      setEndDate(end);
      
      // Reset Recurrence
      setRecFreq('NONE'); 
      setRecInterval(1); 
      setRecEndMode('never'); 
      setRecLabel('Never');
      setRecEndDate(new Date(new Date().setMonth(new Date().getMonth() + 3)));
  };

  const loadEvent = (event: ScheduleItemDto) => {
      setTitle(event.title);
      setDescription(event.subtitle || '');
      setColor(event.color);
      setRoomId(event.roomId || null);
      setHostId(event.hostId || null);
      setHostName(event.hostName || null);
      setEventTypeId(event.eventTypeId || '');
      setMaxCapacityText(
        event.maxCapacity != null && event.maxCapacity > 0 ? String(event.maxCapacity) : ''
      );
      setIsPublic(event.isPublic === true);
      setStartDate(new Date(event.startTime));
      setEndDate(new Date(event.endTime));

      if (event.recurrenceRule) {
          if (event.recurrenceRule.includes('DAILY')) setRecFreq('DAILY');
          else if (event.recurrenceRule.includes('WEEKLY')) setRecFreq('WEEKLY');
          else if (event.recurrenceRule.includes('MONTHLY')) setRecFreq('MONTHLY');
          else if (event.recurrenceRule.includes('YEARLY')) setRecFreq('YEARLY');
          else setRecFreq('NONE');

          const intervalMatch = event.recurrenceRule.match(/INTERVAL=(\d+)/);
          setRecInterval(intervalMatch ? parseInt(intervalMatch[1]) : 1);
          setRecEndMode(event.recurrenceRule.includes('UNTIL') ? 'date' : 'never');
          setRecLabel('Custom');
      } else {
          setRecFreq('NONE'); setRecLabel('Never');
      }
  };

  const getRequestObject = (overrideRecurrence?: string | null): CreateEventRequest => {
    let finalRule = undefined;
    
    if (overrideRecurrence === null) {
        finalRule = undefined; 
    } else if (overrideRecurrence) {
        finalRule = overrideRecurrence;
    } else if (recFreq !== 'NONE') {
        finalRule = `FREQ=${recFreq}`;
        if (recInterval > 1) finalRule += `;INTERVAL=${recInterval}`;
        
        // 🚀 FIX 1: Custom End Date Logic
        if (recEndMode === 'date') {
            // We need to ensure the UNTIL date covers the entire last day
            const untilDate = new Date(recEndDate);
            untilDate.setHours(23, 59, 59); 
            
            // Convert to UTC String properly for iCal (YYYYMMDDTHHmmssZ)
            const untilStr = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            finalRule += `;UNTIL=${untilStr}`;
        }
    }

    const request = new CreateEventRequest();
    request.title = title;
    request.description = description;
    // CreateEventRequest serializes with toISOString() (true UTC instant). Do not apply
    // getTimezoneOffset hacks — those shift the instant and cause wrong wall times on the server.
    request.startTime = roundToQuarterHour(startDate);
    request.endTime = roundToQuarterHour(endDate);
    request.eventTypeId = eventTypeId;
    request.colorHex = color;
    
    request.roomId = roomId ? roomId : undefined;
    request.hostId = hostId ? hostId : undefined;

    const cap = parseInt(maxCapacityText.trim(), 10);
    if (!Number.isNaN(cap) && cap > 0) {
      request.maxCapacity = cap;
    }

    request.isPublic = isPublic;

    request.recurrenceRule = finalRule;

    return request;
  };

  return {
      title, setTitle, description, setDescription, color, setColor,
      roomId, setRoomId, hostId, setHostId, hostName, setHostName, eventTypeId, setEventTypeId,
      maxCapacityText, setMaxCapacityText, isPublic, setIsPublic,
      startDate, setStartDate, endDate, setEndDate,
      recFreq, setRecFreq, recInterval, setRecInterval, recEndMode, setRecEndMode,
      recEndDate, setRecEndDate, recLabel, setRecLabel,
      resetForm, loadEvent, getRequestObject
  };
};