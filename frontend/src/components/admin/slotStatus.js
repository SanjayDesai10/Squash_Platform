export const SLOT_STATUS = {
  available: { label: 'Free', tone: 'green' },
  requested: { label: 'Requested', tone: 'amber' },
  booked: { label: 'Booked', tone: 'accent' },
  blocked: { label: 'Blocked', tone: 'red' },
  past: { label: 'Passed', tone: 'grey' },
};

/** Which of SLOT_STATUS a schedule slot is shown as. */
export function slotKind(slot) {
  if (slot.isPast) return 'past';
  if (slot.state === 'available' && slot.requests?.length > 0) return 'requested';
  return slot.state;
}
