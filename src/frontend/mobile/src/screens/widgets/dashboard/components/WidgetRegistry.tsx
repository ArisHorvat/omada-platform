import React from 'react';
import { AnnouncementsWidget } from '../../announcements/components/AnnouncementsWidget';
import { ScheduleWidget } from '../../schedule/components/ScheduleWidget';
import { TasksWidget } from '../../tasks/components/TasksWidget';
import { MapWidget } from '../../map/components/MapWidget';
import { UsersWidget } from '../../users/components/UsersWidget';
import { AttendanceWidget } from '../../attendance/components/AttendanceWidget';
import { AssignmentsWidget } from '../../assignments/components/AssignmentsWidget';
import { GradesWidget } from '../../grades/components/GradesWidget';
import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { RoomsWidget } from '../../rooms/components/RoomsWidget';
import { DocumentsWidget } from '../../documents/components/DocumentsWidget';


export const WIDGET_REGISTRY: Record<string, React.FC<BaseWidgetProps>> = {
    'announcements': AnnouncementsWidget,
    'schedule': ScheduleWidget,
    'tasks': TasksWidget,
    'map': MapWidget,
    'users': UsersWidget,
    'attendance': AttendanceWidget,
    'assignments': AssignmentsWidget,
    'grades': GradesWidget,
    'rooms': RoomsWidget,
    'documents': DocumentsWidget,
};
