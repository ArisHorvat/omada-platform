// --- Standard API Wrappers ---

export interface AppError {
  code: string;
  message: string;
}

export interface ServiceResponse<T> {
  isSuccess: boolean;
  data: T;
  error?: AppError;
}

// --- Authentication & Users ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
  organizationId: string;
  role: string;
}

export interface SwitchOrgRequest {
  organizationId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface UserOrganizationDto {
  organizationId: string;
  organizationName: string;
  role: string;
  isCurrent: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  profilePictureUrl?: string;
  isTwoFactorEnabled: boolean;
  createdAt: string; // ISO Date string
}

export interface UpdateProfileRequest {
  phoneNumber?: string;
  address?: string;
  profilePictureUrl?: string;
}

export interface UpdateSecurityRequest {
  isTwoFactorEnabled: boolean;
}

export interface UserImportDto {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  cnp?: string;
  address?: string;
  group?: string;
  isGroupManager?: boolean;
}

// --- Organizations ---

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  type: string;
  emailDomain: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
}

export interface RoleWidgetMappingDto {
  roleName: string;
  widgets: string[];
}

export interface RegisterOrganizationRequest {
  name: string;
  organizationType: string;
  shortName: string;
  emailDomain: string;
  
  // Admin Details
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  password: string;
  
  // Config
  defaultUserPassword?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  
  // Collections
  roles: string[];
  widgets: string[];
  roleWidgetMappings: RoleWidgetMappingDto[];
  users: UserImportDto[];
}

export interface OrganizationDetailsDto {
  id: string;
  name: string;
  shortName: string;
  emailDomain: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  
  roles: string[];
  widgets: string[];
  
  // Dictionary mapped to Record in TS
  roleWidgetMappings: Record<string, string[]>;
}

// --- Communication (Chat) ---

export interface Message {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string; // ISO Date string
}

// --- Productivity (Schedule & Tasks) ---

export interface ScheduleItemDto {
  id: string;
  title: string;
  subtitle: string;
  startTime: string; // ISO Date string
  endTime: string;   // ISO Date string
  type: number;      // 0=Class, 1=Meeting, etc.
  color: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;  // ISO Date string
  createdAt: string; // ISO Date string
}