import { http, HttpResponse } from 'msw';
import { fixtures } from './fixtures';
import type {
  Booking,
  BookingWithDetails,
  Booker,
  EventType,
  Owner,
  TimeSlot,
} from '@/types/api';

// Type for mock data
interface MockEventType {
  id: number;
  owner_id: number;
  name: string;
  duration: number;
  description: string;
  created_at: string;
}

interface MockTimeslot {
  id: number;
  event_type_id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

interface MockBooking {
  id: number;
  event_type_id: number;
  timeslot_id: number;
  booker_name: string;
  booker_email: string;
  booker_phone: string;
  notes: string;
  created_at: string;
}

// Helper to convert mock data to API response format
const toEventTypeResponse = (et: MockEventType): EventType => ({
  id: String(et.id),
  ownerId: String(et.owner_id),
  title: et.name,
  duration: et.duration,
  description: et.description || undefined,
  createdAt: et.created_at,
});

const toBookingWithDetails = (b: MockBooking): BookingWithDetails => {
  const eventType = fixtures.eventTypes.find((et: MockEventType) => et.id === b.event_type_id);
  const timeslot = fixtures.timeslots.find((ts: MockTimeslot) => ts.id === b.timeslot_id);

  const booker: Booker = {
    id: '1',
    name: b.booker_name,
    email: b.booker_email,
    phone: b.booker_phone || undefined,
    createdAt: b.created_at,
  };

  const startTime = timeslot
    ? `${timeslot.date}T${timeslot.start_time}:00`
    : new Date().toISOString();
  const endTime = timeslot
    ? `${timeslot.date}T${timeslot.end_time}:00`
    : new Date().toISOString();

  const eventTypeData: EventType = eventType
    ? toEventTypeResponse(eventType)
    : {
        id: '0',
        ownerId: '1',
        title: 'Unknown',
        duration: 30,
        createdAt: new Date().toISOString(),
      };

  return {
    id: String(b.id),
    eventTypeId: String(b.event_type_id),
    ownerId: '1',
    bookerId: '1',
    status: 'confirmed',
    startTime,
    endTime,
    notes: b.notes || undefined,
    createdAt: b.created_at,
    eventType: eventTypeData,
    booker,
  };
};

export const handlers = [
  // GET /api/v1/owner - Get default owner
  http.get('/api/v1/owner', () => {
    const owner = fixtures.owners[0];
    if (!owner) {
      return new HttpResponse(null, { status: 404 });
    }
    const response: Owner = {
      id: String(owner.id),
      email: owner.email,
      name: owner.name,
      timezone: 'Europe/Moscow',
      workStart: '09:00',
      workEnd: '18:00',
      createdAt: owner.created_at,
    };
    return HttpResponse.json(response);
  }),

  // PUT /api/v1/owner - Update owner
  http.put('/api/v1/owner', async ({ request }) => {
    const body = (await request.json()) as Partial<Owner>;
    const owner = fixtures.owners[0];
    if (!owner) {
      return new HttpResponse(null, { status: 404 });
    }
    const response: Owner = {
      id: String(owner.id),
      email: body.email || owner.email,
      name: body.name || owner.name,
      timezone: body.timezone || 'Europe/Moscow',
      workStart: body.workStart || '09:00',
      workEnd: body.workEnd || '18:00',
      createdAt: owner.created_at,
    };
    return HttpResponse.json(response);
  }),

  // GET /api/v1/event-types - Get event types by ownerId
  http.get('/api/v1/event-types', ({ request }) => {
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId');

    let result = fixtures.eventTypes as MockEventType[];
    if (ownerId) {
      result = result.filter((et) => et.owner_id === Number(ownerId));
    }

    return HttpResponse.json(result.map(toEventTypeResponse));
  }),

  // GET /api/v1/event-types/:id - Get single event type
  http.get('/api/v1/event-types/:id', ({ params }) => {
    const id = Number(params.id);
    const eventType = (fixtures.eventTypes as MockEventType[]).find((et) => et.id === id);
    if (!eventType) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(toEventTypeResponse(eventType));
  }),

  // POST /api/v1/event-types - Create event type
  http.post('/api/v1/event-types', async ({ request }) => {
    const body = (await request.json()) as {
      ownerId: string;
      title: string;
      duration: number;
      description?: string;
    };
    const newEventTypeData: MockEventType = {
      id: Date.now(),
      owner_id: Number(body.ownerId),
      name: body.title,
      duration: body.duration,
      description: body.description || '',
      created_at: new Date().toISOString(),
    };
    (fixtures.eventTypes as MockEventType[]).push(newEventTypeData);
    return HttpResponse.json(toEventTypeResponse(newEventTypeData), { status: 201 });
  }),

  // PUT /api/v1/event-types/:id - Update event type
  http.put('/api/v1/event-types/:id', async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as {
      title?: string;
      duration?: number;
      description?: string;
    };
    const index = (fixtures.eventTypes as MockEventType[]).findIndex((et) => et.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    (fixtures.eventTypes as MockEventType[])[index] = {
      ...(fixtures.eventTypes as MockEventType[])[index],
      name: body.title || (fixtures.eventTypes as MockEventType[])[index].name,
      duration: body.duration || (fixtures.eventTypes as MockEventType[])[index].duration,
      description: body.description || (fixtures.eventTypes as MockEventType[])[index].description,
    };
    return HttpResponse.json(toEventTypeResponse((fixtures.eventTypes as MockEventType[])[index]));
  }),

  // DELETE /api/v1/event-types/:id - Delete event type
  http.delete('/api/v1/event-types/:id', ({ params }) => {
    const id = Number(params.id);
    const index = (fixtures.eventTypes as MockEventType[]).findIndex((et) => et.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    (fixtures.eventTypes as MockEventType[]).splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/v1/bookings - Get bookings by ownerId with optional filters
  http.get('/api/v1/bookings', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let result = (fixtures.bookings as MockBooking[]).map(toBookingWithDetails);

    if (status) {
      result = result.filter((b) => b.status === status);
    }

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      result = result.filter((b) => {
        const bookingDate = new Date(b.startTime);
        return bookingDate >= from && bookingDate <= to;
      });
    }

    return HttpResponse.json(result);
  }),

  // POST /api/v1/bookings - Create booking
  http.post('/api/v1/bookings', async ({ request }) => {
    const body = (await request.json()) as {
      eventTypeId: string;
      ownerId: string;
      startTime: string;
      bookerName: string;
      bookerEmail: string;
      bookerPhone?: string;
      notes?: string;
    };

    const eventType = (fixtures.eventTypes as MockEventType[]).find(
      (et) => et.id === Number(body.eventTypeId)
    );
    if (!eventType) {
      return new HttpResponse(
        JSON.stringify({ code: 'NOT_FOUND', message: 'Event type not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newBookingData: MockBooking = {
      id: Date.now(),
      event_type_id: Number(body.eventTypeId),
      timeslot_id: 0,
      booker_name: body.bookerName,
      booker_email: body.bookerEmail,
      booker_phone: body.bookerPhone || '',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
    };
    (fixtures.bookings as MockBooking[]).push(newBookingData);

    const response: Booking = {
      id: String(newBookingData.id),
      eventTypeId: body.eventTypeId,
      ownerId: body.ownerId,
      bookerId: '0',
      status: 'confirmed',
      startTime: body.startTime,
      endTime: new Date(
        new Date(body.startTime).getTime() + eventType.duration * 60000
      ).toISOString(),
      notes: body.notes || undefined,
      createdAt: newBookingData.created_at,
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  // DELETE /api/v1/bookings/:id - Cancel booking
  http.delete('/api/v1/bookings/:id', ({ params }) => {
    const id = Number(params.id);
    const index = (fixtures.bookings as MockBooking[]).findIndex((b) => b.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    (fixtures.bookings as MockBooking[]).splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/v1/timeslots - Get time slots by ownerId with optional filters
  http.get('/api/v1/timeslots', ({ request }) => {
    const url = new URL(request.url);
    const eventTypeId = url.searchParams.get('eventTypeId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let result = fixtures.timeslots as MockTimeslot[];

    if (eventTypeId) {
      result = result.filter((ts) => ts.event_type_id === Number(eventTypeId));
    }

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      result = result.filter((ts) => {
        const slotDate = new Date(ts.date);
        return slotDate >= from && slotDate <= to;
      });
    }

    const response: TimeSlot[] = result.map((ts) => ({
      id: String(ts.id),
      eventTypeId: String(ts.event_type_id),
      ownerId: '1',
      startTime: `${ts.date}T${ts.start_time}:00`,
      endTime: `${ts.date}T${ts.end_time}:00`,
      isBooked: !ts.is_available,
    }));

    return HttpResponse.json(response);
  }),
];
