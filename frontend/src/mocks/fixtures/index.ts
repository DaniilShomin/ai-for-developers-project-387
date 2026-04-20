import { owners } from '../data/owners';
import { eventTypes } from '../data/eventTypes';
import { bookings } from '../data/bookings';
import { timeslots } from '../data/timeslots';

// Deep copy for test isolation
export const fixtures = {
  owners: JSON.parse(JSON.stringify(owners)),
  eventTypes: JSON.parse(JSON.stringify(eventTypes)),
  bookings: JSON.parse(JSON.stringify(bookings)),
  timeslots: JSON.parse(JSON.stringify(timeslots)),
};

// Reset fixtures to initial state
export function resetFixtures() {
  fixtures.owners = JSON.parse(JSON.stringify(owners));
  fixtures.eventTypes = JSON.parse(JSON.stringify(eventTypes));
  fixtures.bookings = JSON.parse(JSON.stringify(bookings));
  fixtures.timeslots = JSON.parse(JSON.stringify(timeslots));
}
