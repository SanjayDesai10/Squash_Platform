// ═══════════════════════════════════════════════════════════
// Date / time helpers - bookings are always in India time
// ═══════════════════════════════════════════════════════════

export const INDIA_TIME_ZONE = 'Asia/Kolkata';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** Today's date in India as YYYY-MM-DD. */
export function getIndiaToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return { year, month, day, weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay() };
}

export function addDays(dateString, days) {
  const { year, month, day } = parseDate(dateString);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** "Sunday, 11 October" */
export function formatFullDate(dateString) {
  const { month, day, weekday } = parseDate(dateString);
  return `${FULL_DAY_NAMES[weekday]}, ${day} ${MONTH_NAMES[month - 1]}`;
}

/** "11 Oct 2026" */
export function formatShortDate(dateString) {
  const { year, month, day } = parseDate(dateString);
  return `${day} ${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`;
}

/** Upcoming bookable dates starting from today in India. */
export function generateDates(count = 7) {
  const today = getIndiaToday();

  return Array.from({ length: count }, (_, i) => {
    const value = addDays(today, i);
    const { day, weekday } = parseDate(value);

    let label;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = `${DAY_NAMES[weekday]} ${day}`;

    return {
      id: i,
      value,
      label,
      dayName: DAY_NAMES[weekday],
      dayNumber: day,
      monthShort: MONTH_NAMES[parseDate(value).month - 1].slice(0, 3),
      fullLabel: formatFullDate(value),
    };
  });
}

/** "18:00" → "6:00 PM" */
export function formatTime(time) {
  const hour = parseInt(time.split(':')[0], 10);
  const period = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

/** "18:00", "19:00" → "6:00 PM – 7:00 PM" */
export function formatTimeRange(startTime, endTime) {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

function getPeriod(time) {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

/** Maps API availability slots to the shape the slot grids render. */
export function toDisplaySlots(apiSlots) {
  return apiSlots.map((slot) => ({
    time: slot.startTime,
    endTime: slot.endTime,
    label: formatTime(slot.startTime),
    period: getPeriod(slot.startTime),
    status: slot.status,
    available: slot.available,
  }));
}

/** True once the booking's start time (India time) has passed. */
export function hasStarted(date, startTime) {
  return new Date(`${date}T${startTime}:00+05:30`).getTime() <= Date.now();
}
