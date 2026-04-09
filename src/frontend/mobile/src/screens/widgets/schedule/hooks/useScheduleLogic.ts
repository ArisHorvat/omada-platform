import { useState } from 'react';
import { Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useScheduleApi, ScheduleFilters } from './useScheduleApi';
import { AttendanceStatus, ScheduleItemDto } from '@/src/api/generatedClient';
import { useEventForm } from './useEventForm';
import { useAuth } from '@/src/context/AuthContext';
import { usersApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';

export const useScheduleLogic = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [editMode, setEditMode] = useState<'series' | 'instance'>('series');
  
  // 🚀 Initialize with My Schedule = true
  const [filters, setFilters] = useState<ScheduleFilters>({ myScheduleOnly: true });

  const { token } = useAuth();
  const { data: profile } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: () => unwrap(usersApi.getMe()),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const api = useScheduleApi(selectedDate, viewMode, filters);
  const form = useEventForm(selectedDate); 

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleItemDto | null>(null);

  const startCreating = () => {
      setEditingEvent(null);
      form.resetForm(selectedDate);
      if (filters.roomId) form.setRoomId(filters.roomId);
      if (profile?.id) {
        const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
        form.setHostId(profile.id);
        form.setHostName(name || 'You');
      }
      setIsModalVisible(true);
  };

  const startEditing = (event: ScheduleItemDto, mode: 'series' | 'instance' = 'series') => {
      setEditingEvent(event);
      setEditMode(mode);
      form.loadEvent(event);
      setIsModalVisible(true);
  };

  const closeModal = () => {
      setIsModalVisible(false);
      setEditingEvent(null);
  };

  const handleSaveEvent = async () => {
    // Basic validation
    if (!form.title.trim()) return;
    if (!form.eventTypeId) {
        // You might want to show an alert here
        console.warn("Event Type is required");
        return;
    }

    const request = form.getRequestObject(editMode === 'instance' ? null : undefined);
    
    try {
        if (editingEvent) {
           if (editMode === 'instance') {
               // Logic: Cancel old instance -> Create new single event
               const originalDate = new Date(editingEvent.startTime);
               await api.cancelInstance.mutateAsync({ id: editingEvent.id, date: originalDate });
               
               // Ensure the new request is a single event (no recurrence)
               const newEventRequest = form.getRequestObject(null); // null forces no recurrence rule
               await api.createEvent.mutateAsync(newEventRequest);
               
               closeModal();
           } else {
               api.updateEvent.mutate({ id: editingEvent.id, request });
               closeModal();
           }
        } else {
           await api.createEvent.mutateAsync(request);
            closeModal();
        }
    } catch (error: any) {
        console.error("Failed to save event:", error);
        Alert.alert("Error", error.response?.data?.message || error.message || "Failed to save.");
    }
  };

  const deleteEvent = async (id: string, mode: 'series' | 'instance' = 'series', date?: Date) => {
      if (mode === 'instance' && date) {
          await api.cancelInstance.mutateAsync({ id, date });
      } else {
          await api.deleteEvent.mutateAsync(id);
      }
  };

  const handleAttendance = async (event: ScheduleItemDto, status: AttendanceStatus) => {
    try {
      await api.updateAttendance.mutateAsync({
        id: event.id,
        event,
        status,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Could not update attendance.';
      Alert.alert('Attendance', msg);
    }
  };

  const swapToAlternate = async (
    original: ScheduleItemDto,
    target: ScheduleItemDto
  ) => {
    await api.swapAttendance.mutateAsync({
      targetEvent: target,
      declineEvent: original,
    });
  };

  return {
    events: api.events, 
    eventTypes: api.eventTypes, 
    loading: api.isLoading, 
    rooms: api.rooms, // 🚀 Expose rooms to UI
    
    selectedDate, setSelectedDate, 
    viewMode, setViewMode,
    editMode, 
    
    // 🚀 Expose filters so UI can change them
    filters, setFilters,
    handleAttendance,
    swapToAlternate,
    swapPending: api.swapAttendance.isPending,
    
    isModalVisible, startCreating, startEditing, closeModal,
    editingEvent,
    form, 
    handleSaveEvent, 
    deleteEvent,
    searchHosts: api.searchHosts,
    isSaving:
      api.createEvent.isPending ||
      api.updateEvent.isPending ||
      api.cancelInstance.isPending ||
      api.swapAttendance.isPending,
  };
};