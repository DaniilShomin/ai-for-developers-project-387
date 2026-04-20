import dayjs from 'dayjs'
import type { BookingWithDetails, EventType, Owner, TimeSlot } from '@/types/api'

/**
 * Parse time string "HH:MM" to hours and minutes
 */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(':').map(Number)
  return { hour, minute }
}

/**
 * Generate time slots for a specific date
 * @param eventType - Event type with duration
 * @param owner - Owner with work hours
 * @param date - Date to generate slots for
 * @param existingBookings - Existing confirmed bookings to filter out
 * @returns Array of available time slots (non-overlapping with existing bookings)
 */
export function generateTimeSlots(
  eventType: EventType,
  owner: Owner,
  date: Date,
  existingBookings: BookingWithDetails[]
): TimeSlot[] {
  const { hour: workStartHour, minute: workStartMinute } = parseTime(
    owner.workStart
  )
  const { hour: workEndHour, minute: workEndMinute } = parseTime(owner.workEnd)

  // Create date objects for work hours
  const workStart = dayjs(date)
    .hour(workStartHour)
    .minute(workStartMinute)
    .second(0)
    .millisecond(0)

  const workEnd = dayjs(date)
    .hour(workEndHour)
    .minute(workEndMinute)
    .second(0)
    .millisecond(0)

  const slots: TimeSlot[] = []
  const duration = eventType.duration // in minutes
  const step = duration // Step equals event duration

  // Get current time to filter out past slots for today
  const now = dayjs()
  const isToday = dayjs(date).isSame(now, 'day')

  // Generate slots from work start to work end
  let currentTime = workStart
  const endTime = workEnd.subtract(duration, 'minute')

  // If today, skip past time slots
  if (isToday && currentTime.isBefore(now)) {
    // Find the first slot that is not in the past
    while (currentTime.isBefore(now) && currentTime.isBefore(endTime)) {
      currentTime = currentTime.add(step, 'minute')
    }
  }

  while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
    const slotStart = currentTime.toISOString()
    const slotEnd = currentTime.add(duration, 'minute').toISOString()

    // Check if this slot overlaps with any confirmed booking
    const isOverlapping = existingBookings.some(
      booking =>
        booking.status === 'confirmed' &&
        // Check overlap: slotStart < bookingEnd && slotEnd > bookingStart
        currentTime.isBefore(dayjs(booking.endTime)) &&
        currentTime.add(duration, 'minute').isAfter(dayjs(booking.startTime))
    )

    if (!isOverlapping) {
      slots.push({
        id: `slot-${currentTime.valueOf()}`, // Generate unique ID based on timestamp
        ownerId: owner.id,
        startTime: slotStart,
        endTime: slotEnd,
        eventTypeId: undefined,
        isBooked: false,
      })
    }

    currentTime = currentTime.add(step, 'minute')
  }

  return slots
}

/**
 * Check if a time slot is still available (re-verify before booking)
 * @param startTime - Proposed booking start time
 * @param duration - Event type duration in minutes
 * @param existingBookings - Current bookings to check against
 * @returns true if slot is available
 */
export function isSlotAvailable(
  startTime: string,
  duration: number,
  existingBookings: BookingWithDetails[]
): boolean {
  const slotStart = dayjs(startTime)
  const slotEnd = slotStart.add(duration, 'minute')

  return !existingBookings.some(
    booking =>
      booking.status === 'confirmed' &&
      slotStart.isBefore(dayjs(booking.endTime)) &&
      slotEnd.isAfter(dayjs(booking.startTime))
  )
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(startTime: string, endTime: string): string {
  return `${dayjs(startTime).format('HH:mm')} - ${dayjs(endTime).format(
    'HH:mm'
  )}`
}
