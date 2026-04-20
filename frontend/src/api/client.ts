import type {
  Booking,
  BookingCreate,
  BookingStatus,
  BookingWithDetails,
  ErrorResponse,
  EventType,
  EventTypeCreate,
  EventTypeUpdate,
  Owner,
  OwnerUpdate,
  TimeSlot,
} from '@/types/api'

// Get backend URL from env (for production) or use relative path (for local dev)
// VITE_BACKEND_URL - full URL (e.g., https://api.example.com)
// VITE_BACKEND_HOST - hostname only (e.g., api.example.com), used by Render Blueprint
const BACKEND_HOST = (import.meta as any).env.VITE_BACKEND_HOST
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || (BACKEND_HOST ? `https://${BACKEND_HOST}` : '')
const API_BASE_URL = `${BACKEND_URL}/api/v1`

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = (await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      }))) as ErrorResponse
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  // ==================== Owner ====================

  async getOwner(): Promise<Owner> {
    return this.request('/owner', { method: 'GET' })
  }

  async updateOwner(data: OwnerUpdate): Promise<Owner> {
    return this.request('/owner', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // ==================== Event Types ====================

  async getEventTypes(ownerId: string): Promise<EventType[]> {
    const params = new URLSearchParams({ ownerId })
    return this.request(`/event-types?${params.toString()}`, { method: 'GET' })
  }

  async getEventType(id: string): Promise<EventType> {
    return this.request(`/event-types/${id}`, { method: 'GET' })
  }

  async createEventType(data: EventTypeCreate): Promise<EventType> {
    return this.request('/event-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEventType(
    id: string,
    data: EventTypeUpdate
  ): Promise<EventType> {
    return this.request(`/event-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEventType(id: string): Promise<void> {
    return this.request(`/event-types/${id}`, { method: 'DELETE' })
  }

  // ==================== Time Slots ====================

  async getTimeSlots(
    ownerId: string,
    eventTypeId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<TimeSlot[]> {
    const params = new URLSearchParams({ ownerId })
    if (eventTypeId) params.append('eventTypeId', eventTypeId)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    return this.request(`/timeslots?${params.toString()}`, { method: 'GET' })
  }

  // ==================== Bookings ====================

  async getBookings(
    ownerId: string,
    status?: BookingStatus,
    dateFrom?: string,
    dateTo?: string
  ): Promise<BookingWithDetails[]> {
    const params = new URLSearchParams({ ownerId })
    if (status) params.append('status', status)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/bookings${query}`, { method: 'GET' })
  }

  async createBooking(data: BookingCreate): Promise<Booking> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async cancelBooking(id: string): Promise<Booking> {
    return this.request(`/bookings/${id}`, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
