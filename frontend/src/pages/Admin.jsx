import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminSchedule from '../components/admin/AdminSchedule';
import AdminBookings from '../components/admin/AdminBookings';
import AdminCourts from '../components/admin/AdminCourts';
import { animatePageEnter } from '../animations/heroAnimations';

const TABS = [
  { id: 'schedule', label: 'Schedule', description: 'Every court and every slot for the day. Click a slot to confirm a paid request, block it, or cancel its booking.' },
  { id: 'bookings', label: 'Bookings', description: 'All bookings and requests for a day as a list. Confirm requests here once the player has paid.' },
  { id: 'courts', label: 'Courts', description: 'Add courts, change prices, or close a court for maintenance.' },
];

export default function Admin() {
  const pageRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Keep the active tab in the URL so refresh / back button work.
  const activeTab = TABS.find((t) => t.id === searchParams.get('tab')) ?? TABS[0];

  useEffect(() => {
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  return (
    <div ref={pageRef}>
      <section className="pt-36 pb-10 md:pt-44 md:pb-14" aria-label="Admin Header">
        <div className="container">
          <span className="section-label">Admin</span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mt-4">
            DASH<span className="text-accent-ink">BOARD</span>
          </h1>
        </div>
      </section>

      <section className="pb-24 md:pb-32" aria-label="Admin Dashboard">
        <div className="container">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border overflow-x-auto" role="tablist">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSearchParams({ tab: tab.id }, { replace: true })}
                  className={`relative px-5 py-3 font-heading text-sm tracking-widest uppercase transition-colors duration-300 whitespace-nowrap ${
                    isActive ? 'text-accent-ink' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                  {isActive && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-accent" />}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-text-muted">{activeTab.description}</p>

          <div className="mt-8" role="tabpanel">
            {activeTab.id === 'schedule' && <AdminSchedule />}
            {activeTab.id === 'bookings' && <AdminBookings />}
            {activeTab.id === 'courts' && <AdminCourts />}
          </div>
        </div>
      </section>
    </div>
  );
}
