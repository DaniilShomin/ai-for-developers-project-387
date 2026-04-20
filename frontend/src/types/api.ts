/**
 * Типы API согласно OpenAPI спецификации
 * Generated from typespec/openapi/openapi.yaml
 */

// ==================== Enums ====================

export type BookingStatus = 'confirmed' | 'cancelled'

// ==================== Owner ====================

export interface Owner {
  id: string
  name: string
  email: string
  timezone: string
  workStart: string // Format "HH:MM", e.g., "09:00"
  workEnd: string // Format "HH:MM", e.g., "18:00"
  createdAt: string
}

export interface OwnerUpdate {
  name?: string
  email?: string
  timezone?: string
  workStart?: string
  workEnd?: string
}

// ==================== Event Types ====================

export interface EventType {
  id: string
  title: string
  description?: string
  duration: number // Duration in minutes
  ownerId: string
  createdAt: string
}

export interface EventTypeCreate {
  title: string
  description?: string
  duration: number
  ownerId: string
}

export interface EventTypeUpdate {
  title?: string
  description?: string
  duration?: number
}

// ==================== Time Slots ====================

export interface TimeSlot {
  id: string // Generated on the fly
  ownerId: string
  startTime: string
  endTime: string
  eventTypeId?: string
  isBooked: boolean
}

// ==================== Bookings ====================

export interface Booking {
  id: string
  eventTypeId: string
  ownerId: string
  bookerId: string
  startTime: string
  endTime: string
  notes?: string
  status: BookingStatus
  createdAt: string
}

export interface BookingCreate {
  eventTypeId: string
  ownerId: string
  startTime: string
  bookerName: string
  bookerEmail: string
  bookerPhone?: string
  notes?: string
}

export interface Booker {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

export interface BookingWithDetails extends Booking {
  eventType: EventType
  booker: Booker
}

// ==================== Error Response ====================

export interface ErrorResponse {
  code: string
  message: string
}

// ==================== API Request Params ====================

export interface ListBookingsParams {
  ownerId: string
  status?: BookingStatus
  dateFrom?: string // ISO date string
  dateTo?: string // ISO date string
}

export interface ListTimeSlotsParams {
  ownerId: string
  eventTypeId?: string
  dateFrom?: string
  dateTo?: string
}
