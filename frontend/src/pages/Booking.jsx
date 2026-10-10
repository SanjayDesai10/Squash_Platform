import { useState, useRef, useEffect } from 'react';
import DateSelector from '../components/DateSelector';
import CourtSelector from '../components/CourtSelector';
import TimeSlotGrid from '../components/TimeSlotGrid';
import BookingSummary from '../components/BookingSummary';
import ConfirmationModal from '../components/ConfirmationModal';
import MagneticButton from '../components/MagneticButton';
import { courts, generateDates, generateTimeSlots, generateBookingId } from '../data/mockData';
import { animatePageEnter, prefersReducedMotion } from '../animations/heroAnimations';


export default function Booking() {
  const pageRef = useRef(null);
  const dates = generateDates(7);

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  const timeSlots = selectedCourt
    ? generateTimeSlots(selectedCourt, selectedDate)
    : [];

  const activeCourt = courts.find((c) => c.id === selectedCourt);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  // Reset slot when date or court changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedCourt]);

  const handleConfirm = () => {
    if (!activeCourt || !selectedSlot) return;
    const booking = {
      id: generateBookingId(),
      courtName: activeCourt.name,
      date: dates[selectedDate].fullLabel,
      timeSlot: selectedSlot,
      price: activeCourt.pricePerHour,
    };
    setBookingData(booking);
    setShowConfirmation(true);
  };

  const handleCloseModal = () => {
    setShowConfirmation(false);
    setSelectedDate(0);
    setSelectedCourt(null);
    setSelectedSlot(null);
    setBookingData(null);
  };

  const isComplete = selectedCourt && selectedSlot;

  return (
    <div ref={pageRef}>
      {/* Header */}
      <section className="pt-36 pb-12 md:pt-44 md:pb-16" aria-label="Booking Header">
        <div className="container">
          <span className="section-label">Book</span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mt-4">
            BOOK YOUR <span className="text-accent">COURT</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed">
            Choose your date, court, and time. We'll handle the rest.
          </p>
        </div>
      </section>

      {/* Booking Flow */}
      <section className="pb-24 md:pb-32" aria-label="Booking Steps">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Steps */}
            <div className="lg:col-span-2 space-y-12">
              {/* Step 1 — Date */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-8 flex items-center justify-center text-sm font-heading font-bold bg-accent text-bg-primary">
                    1
                  </span>
                  <h2 className="font-heading text-xl font-bold tracking-wide">Select Date</h2>
                </div>
                <DateSelector
                  dates={dates}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />
              </div>

              {/* Step 2 — Court */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className={`w-8 h-8 flex items-center justify-center text-sm font-heading font-bold ${
                    selectedDate !== null ? 'bg-accent text-bg-primary' : 'bg-border text-text-muted'
                  }`}>
                    2
                  </span>
                  <h2 className="font-heading text-xl font-bold tracking-wide">Select Court</h2>
                </div>
                <CourtSelector
                  courts={courts}
                  selectedCourt={selectedCourt}
                  onSelect={setSelectedCourt}
                />
              </div>

              {/* Step 3 — Time */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className={`w-8 h-8 flex items-center justify-center text-sm font-heading font-bold ${
                    selectedCourt ? 'bg-accent text-bg-primary' : 'bg-border text-text-muted'
                  }`}>
                    3
                  </span>
                  <h2 className="font-heading text-xl font-bold tracking-wide">Select Time</h2>
                </div>

                {selectedCourt ? (
                  <TimeSlotGrid
                    slots={timeSlots}
                    selectedSlot={selectedSlot}
                    onSelect={setSelectedSlot}
                  />
                ) : (
                  <div className="py-8 text-center border border-border">
                    <p className="text-sm text-text-muted">Select a court to view available times</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                {isComplete ? (
                  <>
                    <BookingSummary
                      court={activeCourt}
                      date={dates[selectedDate]}
                      timeSlot={selectedSlot}
                      price={activeCourt.pricePerHour}
                    />
                    <button
                      className="magnetic-btn magnetic-btn-primary w-full mt-6 justify-center"
                      onClick={handleConfirm}
                    >
                      Confirm Booking
                    </button>
                  </>
                ) : (
                  <div className="bg-bg-secondary border border-border p-8 text-center">
                    <p className="text-sm text-text-muted">
                      Complete all steps to see your booking summary
                    </p>
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center gap-3 text-left">
                        <span className={`w-5 h-5 flex items-center justify-center text-xs ${
                          selectedDate !== null ? 'bg-accent text-bg-primary' : 'border border-border text-text-muted'
                        }`}>
                          {selectedDate !== null ? '✓' : '1'}
                        </span>
                        <span className={`text-sm ${selectedDate !== null ? 'text-text-primary' : 'text-text-muted'}`}>
                          Select a date
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-left">
                        <span className={`w-5 h-5 flex items-center justify-center text-xs ${
                          selectedCourt ? 'bg-accent text-bg-primary' : 'border border-border text-text-muted'
                        }`}>
                          {selectedCourt ? '✓' : '2'}
                        </span>
                        <span className={`text-sm ${selectedCourt ? 'text-text-primary' : 'text-text-muted'}`}>
                          Choose a court
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-left">
                        <span className={`w-5 h-5 flex items-center justify-center text-xs ${
                          selectedSlot ? 'bg-accent text-bg-primary' : 'border border-border text-text-muted'
                        }`}>
                          {selectedSlot ? '✓' : '3'}
                        </span>
                        <span className={`text-sm ${selectedSlot ? 'text-text-primary' : 'text-text-muted'}`}>
                          Pick a time slot
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      {showConfirmation && bookingData && (
        <ConfirmationModal
          booking={bookingData}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
