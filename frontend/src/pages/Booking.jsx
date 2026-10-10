import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DateSelector from '../components/DateSelector';
import CourtSelector from '../components/CourtSelector';
import TimeSlotGrid from '../components/TimeSlotGrid';
import BookingSummary from '../components/BookingSummary';
import ConfirmationModal from '../components/ConfirmationModal';
import { ErrorState, InlineAlert, LoadingState } from '../components/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { useCourts } from '../hooks/useCourts';
import { api } from '../lib/api';
import { formatTimeRange, generateDates, toDisplaySlots } from '../lib/time';
import { animatePageEnter } from '../animations/heroAnimations';

// Matches the backend booking window (today + 29 days).
const DATE_COUNT = 30;

export default function Booking() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { courts, loading: courtsLoading, error: courtsError, reload: reloadCourts } = useCourts();

  const dates = useMemo(() => generateDates(DATE_COUNT), []);

  // Optional preselection via /book?court=1&date=YYYY-MM-DD&time=HH:00
  // (used by the quick-book widget, court cards and the login redirect).
  const [selectedDate, setSelectedDate] = useState(() => {
    const index = dates.findIndex((d) => d.value === searchParams.get('date'));
    return index >= 0 ? index : 0;
  });
  const [selectedCourt, setSelectedCourt] = useState(() => {
    const id = Number(searchParams.get('court'));
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  const [selectedSlot, setSelectedSlot] = useState(() => searchParams.get('time'));

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [slotsVersion, setSlotsVersion] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingData, setBookingData] = useState(null);

  const activeCourt = courts.find((c) => c.id === selectedCourt);
  const activeDate = dates[selectedDate];
  const activeSlot = slots.find((s) => s.time === selectedSlot);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  // Drop a preselected court that doesn't exist or can't be booked.
  useEffect(() => {
    if (courtsLoading || selectedCourt === null) return;
    const court = courts.find((c) => c.id === selectedCourt);
    if (!court || !court.available) setSelectedCourt(null);
  }, [courts, courtsLoading, selectedCourt]);

  // Load availability whenever the court or date changes.
  useEffect(() => {
    if (!activeCourt || !activeCourt.available) {
      setSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);

    api.getAvailability(activeCourt.id, activeDate.value)
      .then((data) => { if (!cancelled) setSlots(toDisplaySlots(data.slots)); })
      .catch((err) => {
        if (cancelled) return;
        setSlots([]);
        setSlotsError(err.message);
      })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [activeCourt, activeDate, slotsVersion]);

  // Clear a selected slot that is no longer available.
  useEffect(() => {
    if (slotsLoading || selectedSlot === null) return;
    const slot = slots.find((s) => s.time === selectedSlot);
    if (!slot || !slot.available) setSelectedSlot(null);
  }, [slots, slotsLoading, selectedSlot]);

  const handleDateSelect = (index) => {
    setSelectedDate(index);
    setSelectedSlot(null);
    setBookingError(null);
  };

  const handleCourtSelect = (courtId) => {
    setSelectedCourt(courtId);
    setSelectedSlot(null);
    setBookingError(null);
  };

  const handleSlotSelect = (time) => {
    setSelectedSlot(time);
    setBookingError(null);
  };

  const handleConfirm = async () => {
    if (!activeCourt || !activeSlot) return;

    if (!user) {
      const params = new URLSearchParams({
        court: String(activeCourt.id),
        date: activeDate.value,
        time: activeSlot.time,
      });
      navigate(`/login?next=${encodeURIComponent(`/book?${params}`)}`);
      return;
    }

    setSubmitting(true);
    setBookingError(null);
    try {
      const { booking } = await api.createBooking({
        courtId: activeCourt.id,
        date: activeDate.value,
        startTime: activeSlot.time,
        endTime: activeSlot.endTime,
      });

      setBookingData({
        id: booking.id,
        courtName: activeCourt.name,
        date: activeDate.fullLabel,
        startTime: booking.startTime,
        endTime: booking.endTime,
        price: booking.price,
      });
    } catch (err) {
      setBookingError(
        err.status === 409 && err.message === 'the time slot is already booked'
          ? 'Sorry, that slot was just booked by someone else. Please pick another time.'
          : err.status === 409 && err.message === 'you have already requested this slot'
          ? 'You have already requested this slot. Check My Bookings - call us to complete the payment.'
          : err.message,
      );
      // Availability may have changed - refresh it.
      setSlotsVersion((v) => v + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setBookingData(null);
    setSelectedSlot(null);
    setSlotsVersion((v) => v + 1);
  };

  const isComplete = Boolean(activeCourt && activeSlot);

  return (
    <div ref={pageRef}>
      {/* Header */}
      <section className="pt-36 pb-10 md:pt-44 md:pb-14" aria-label="Booking Header">
        <div className="container">
          <span className="section-label">Book</span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mt-4">
            BOOK YOUR <span className="text-accent-ink">COURT</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed">
            Choose your date, court, and time. We'll handle the rest.
          </p>
        </div>
      </section>

      {/* Booking Flow */}
      <section className={`pb-24 md:pb-32 ${isComplete ? 'max-lg:pb-40' : ''}`} aria-label="Booking Steps">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Steps */}
            <div className="lg:col-span-2 space-y-12">
              {/* Step 1 - Date */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-8 flex items-center justify-center text-sm font-heading font-bold bg-accent text-on-accent">
                    1
                  </span>
                  <h2 className="font-heading text-xl font-bold tracking-wide">Select Date</h2>
                </div>
                <DateSelector
                  dates={dates}
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                />
              </div>

              {/* Step 2 - Court */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-8 flex items-center justify-center text-sm font-heading font-bold bg-accent text-on-accent">
                    2
                  </span>
                  <h2 className="font-heading text-xl font-bold tracking-wide">Select Court</h2>
                </div>
                {courtsLoading ? (
                  <LoadingState label="Loading courts…" />
                ) : courtsError ? (
                  <ErrorState message={courtsError} onRetry={reloadCourts} />
                ) : (
                  <CourtSelector
                    courts={courts}
                    selectedCourt={selectedCourt}
                    onSelect={handleCourtSelect}
                  />
                )}
              </div>

              {/* Step 3 - Time */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className={`w-8 h-8 flex items-center justify-center text-sm font-heading font-bold ${
                    activeCourt ? 'bg-accent text-on-accent' : 'bg-border text-text-muted'
                  }`}>
                    3
                  </span>
                  <h2 className="font-heading text-xl font-bold tracking-wide">Select Time</h2>
                </div>

                {!activeCourt ? (
                  <div className="py-8 text-center border border-border">
                    <p className="text-sm text-text-muted">Select a court to view available times</p>
                  </div>
                ) : slotsLoading && slots.length === 0 ? (
                  <LoadingState label="Loading times…" />
                ) : slotsError ? (
                  <ErrorState message={slotsError} onRetry={() => setSlotsVersion((v) => v + 1)} />
                ) : !slots.some((s) => s.available) ? (
                  <>
                    <TimeSlotGrid slots={slots} selectedSlot={selectedSlot} onSelect={handleSlotSelect} />
                    <p className="mt-4 text-sm text-text-muted">No times left on this day. Try another date or court.</p>
                  </>
                ) : (
                  <TimeSlotGrid
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelect={handleSlotSelect}
                  />
                )}
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-4">
                {bookingError && <InlineAlert>{bookingError}</InlineAlert>}
                {isComplete ? (
                  <>
                    <BookingSummary
                      court={activeCourt}
                      date={activeDate}
                      timeSlot={activeSlot.time}
                      price={activeCourt.pricePerHour}
                    />
                    <button
                      className="magnetic-btn magnetic-btn-primary w-full mt-2 justify-center disabled:opacity-50"
                      onClick={handleConfirm}
                      disabled={submitting}
                    >
                      {submitting ? 'Sending request…' : user ? 'Request Booking' : 'Log In to Book'}
                    </button>
                    <p className="text-xs text-text-muted text-center">
                      Your slot is reserved once payment is confirmed by phone. All times are IST.
                    </p>
                  </>
                ) : (
                  <div className="bg-bg-secondary border border-border p-8 text-center">
                    <p className="text-sm text-text-muted">
                      Complete all steps to see your booking summary
                    </p>
                    <div className="mt-6 space-y-2">
                      {[
                        { done: true, label: 'Select a date' },
                        { done: Boolean(activeCourt), label: 'Choose a court' },
                        { done: Boolean(activeSlot), label: 'Pick a time slot' },
                      ].map((step, i) => (
                        <div key={step.label} className="flex items-center gap-3 text-left">
                          <span className={`w-5 h-5 flex items-center justify-center text-xs ${
                            step.done ? 'bg-accent text-on-accent' : 'border border-border text-text-muted'
                          }`}>
                            {step.done ? '✓' : i + 1}
                          </span>
                          <span className={`text-sm ${step.done ? 'text-text-primary' : 'text-text-muted'}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: keep the request button in reach once a slot is picked */}
      {isComplete && !bookingData && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-secondary/95 backdrop-blur-md border-t border-border">
          <div className="container py-3 flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold truncate">{activeCourt.name} · ₹{activeCourt.pricePerHour}</p>
              <p className="text-xs text-text-muted truncate">
                {activeDate.label} · {formatTimeRange(activeSlot.time, activeSlot.endTime)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="magnetic-btn magnetic-btn-primary !px-5 text-xs shrink-0 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : user ? 'Request' : 'Log In to Book'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {bookingData && (
        <ConfirmationModal
          booking={bookingData}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
