export const JWT_BEARER_PREFIX = 'Bearer';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  TECHNICIAN = 'technician'
}

export enum RepairStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RepairPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationType {
  REPAIR_REQUEST_CREATED = 'repair_request_created',
  REPAIR_STATUS_UPDATED = 'repair_status_updated',
  TECHNICIAN_ASSIGNED = 'technician_assigned',
  REPAIR_COMPLETED = 'repair_completed'
}