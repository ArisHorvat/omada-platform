import React from 'react';
import { NewsWidget } from '../../news/components/NewsWidget';
import { ScheduleWidget } from '../../schedule/components/ScheduleWidget';
import { TasksWidget } from '../../tasks/components/TasksWidget';
import { MapWidget } from '../../map/components/MapWidget';
import { UsersWidget } from '../../users/components/UsersWidget';
import { AttendanceWidget } from '../../attendance/components/AttendanceWidget';
import { AssignmentsWidget } from '../../assignments/components/AssignmentsWidget';
import { ChatWidget } from '../../chat/components/ChatWidget';
import { GradesWidget } from '../../grades/components/GradesWidget';
import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { RoomsWidget } from '../../rooms/components/RoomsWidget';


export const WIDGET_REGISTRY: Record<string, React.FC<BaseWidgetProps>> = {
    'news': NewsWidget,
    'schedule': ScheduleWidget,
    'tasks': TasksWidget,
    'map': MapWidget,
    'users': UsersWidget,
    'attendance': AttendanceWidget,
    'assignments': AssignmentsWidget,
    'chat': ChatWidget,
    'grades': GradesWidget,
    'rooms': RoomsWidget,
};