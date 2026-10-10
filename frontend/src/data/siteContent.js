// ═══════════════════════════════════════════════════════════
// Mock Data — Squash Court Booking Platform
// ═══════════════════════════════════════════════════════════

export const courts = [
  {
    id: 1,
    name: 'Court 01',
    type: 'Professional',
    description: 'Tournament-grade court with premium maple flooring and competition-standard lighting.',
    features: ['Maple Flooring', 'LED Lighting', 'Glass Back Wall', 'Climate Control'],
    pricePerHour: 500,
    available: true,
    image: null,
    color: '#c8ff00',
  },
  {
    id: 2,
    name: 'Court 02',
    type: 'Premium',
    description: 'Our most popular court. Perfect for competitive matches and regular training sessions.',
    features: ['Hardwood Floor', 'LED Lighting', 'Viewing Gallery', 'Sound System'],
    pricePerHour: 500,
    available: true,
    image: null,
    color: '#00ccff',
  },
  {
    id: 3,
    name: 'Court 03',
    type: 'Standard',
    description: 'Excellent court for practice sessions and casual play. Well-maintained and reliable.',
    features: ['Synthetic Floor', 'Standard Lighting', 'Wall Mirrors', 'Equipment Storage'],
    pricePerHour: 400,
    available: true,
    image: null,
    color: '#ff6644',
  },
  {
    id: 4,
    name: 'Court 04',
    type: 'Training',
    description: 'Designed for coaching and skill development. Includes video analysis capability.',
    features: ['Synthetic Floor', 'LED Lighting', 'Video Analysis', 'Practice Wall'],
    pricePerHour: 350,
    available: false,
    image: null,
    color: '#aa66ff',
  },
];

export const facilities = [
  {
    icon: '◆',
    title: 'Professional Flooring',
    description: 'Tournament-grade maple and hardwood surfaces across all courts.',
  },
  {
    icon: '◈',
    title: 'Premium Lighting',
    description: 'Flicker-free LED systems designed for optimal visibility during play.',
  },
  {
    icon: '◇',
    title: 'Changing Rooms',
    description: 'Modern changing facilities with showers, lockers, and amenities.',
  },
  {
    icon: '▣',
    title: 'Equipment Rental',
    description: 'Quality rackets, balls, and protective eyewear available for rent.',
  },
  {
    icon: '◫',
    title: 'Spectator Seating',
    description: 'Comfortable viewing areas with clear sightlines to the courts.',
  },
  {
    icon: '▥',
    title: 'Free Parking',
    description: 'Complimentary parking for all players with easy facility access.',
  },
];

export const benefits = [
  {
    title: 'Premium Courts',
    description: 'Tournament-grade courts with professional flooring and lighting.',
    icon: '⬡',
  },
  {
    title: 'Easy Booking',
    description: 'Book your court in seconds with our seamless online platform.',
    icon: '⬢',
  },
  {
    title: 'Professional Facilities',
    description: 'Changing rooms, equipment rental, and everything you need.',
    icon: '⬣',
  },
  {
    title: 'Play Anytime',
    description: 'Open 12 hours daily with 24/7 online booking availability.',
    icon: '⬡',
  },
];

export const stats = [
  { value: 4, label: 'Courts', prefix: '0' },
  { value: 12, label: 'Hours Open', prefix: '' },
  { value: 500, label: 'Players', prefix: '', suffix: '+' },
  { value: 24, label: 'Online Booking', prefix: '', suffix: '/7' },
];

// Generate dates starting from today
export function generateDates(count = 7) {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    let label;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = `${dayNames[date.getDay()]} ${date.getDate()}`;

    dates.push({
      id: i,
      date,
      label,
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      fullLabel: `${dayNames[date.getDay()]}day, ${date.getDate()} ${monthNames[date.getMonth()]}`,
    });
  }

  return dates;
}

// Generate time slots with mock availability
export function generateTimeSlots(courtId, dateIndex) {
  const morning = [
    { time: '06:00', label: '6:00 AM', period: 'Morning' },
    { time: '07:00', label: '7:00 AM', period: 'Morning' },
    { time: '08:00', label: '8:00 AM', period: 'Morning' },
    { time: '09:00', label: '9:00 AM', period: 'Morning' },
  ];

  const afternoon = [
    { time: '12:00', label: '12:00 PM', period: 'Afternoon' },
    { time: '13:00', label: '1:00 PM', period: 'Afternoon' },
    { time: '14:00', label: '2:00 PM', period: 'Afternoon' },
    { time: '15:00', label: '3:00 PM', period: 'Afternoon' },
  ];

  const evening = [
    { time: '17:00', label: '5:00 PM', period: 'Evening' },
    { time: '18:00', label: '6:00 PM', period: 'Evening' },
    { time: '19:00', label: '7:00 PM', period: 'Evening' },
    { time: '20:00', label: '8:00 PM', period: 'Evening' },
    { time: '21:00', label: '9:00 PM', period: 'Evening' },
  ];

  const allSlots = [...morning, ...afternoon, ...evening];

  // Deterministic "random" unavailability based on court + date
  const seed = courtId * 7 + dateIndex;
  return allSlots.map((slot, i) => ({
    ...slot,
    available: !((seed + i) % 3 === 0 && i % 2 === 1),
  }));
}

// Quick booking preview slots (for home page)
export const quickBookingSlots = [
  { time: '09:00', label: '9:00 AM', available: true },
  { time: '10:00', label: '10:00 AM', available: true },
  { time: '11:00', label: '11:00 AM', available: false },
  { time: '12:00', label: '12:00 PM', available: true },
  { time: '18:00', label: '6:00 PM', available: true },
  { time: '19:00', label: '7:00 PM', available: false },
  { time: '20:00', label: '8:00 PM', available: true },
];

export function generateBookingId() {
  const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `SQ-2026-${num}`;
}
