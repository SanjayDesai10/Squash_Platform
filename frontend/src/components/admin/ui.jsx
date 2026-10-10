import { addDays, formatFullDate, getIndiaToday } from '../../lib/time';

// Small building blocks shared by the admin tabs.

export function StatCard({ label, value }) {
  return (
    <div className="bg-bg-card border border-border p-5">
      <p className="text-xs text-text-muted uppercase tracking-widest font-heading">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold">{value}</p>
    </div>
  );
}

const BADGE_TONES = {
  green: 'text-success bg-success/10',
  red: 'text-danger bg-danger/10',
  amber: 'text-warning bg-warning/10',
  grey: 'text-text-secondary bg-bg-tertiary',
  accent: 'text-accent-ink bg-accent/10',
};

export function Badge({ tone = 'grey', children }) {
  return (
    <span className={`inline-block text-xs px-2 py-1 font-heading tracking-wider uppercase whitespace-nowrap ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function ActionButton({ tone = 'default', children, ...props }) {
  const tones = {
    default: 'hover:border-accent-ink hover:text-accent-ink',
    danger: 'hover:border-danger hover:text-danger',
  };

  return (
    <button
      type="button"
      className={`text-xs font-heading tracking-widest uppercase border border-border px-3 py-2 text-text-secondary transition-colors whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none ${tones[tone]}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Horizontally scrollable table wrapper so wide tables work on phones. */
export function Table({ headers, children }) {
  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-bg-secondary">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-xs text-text-muted uppercase tracking-widest font-heading font-normal whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

/** ‹ Prev | date picker | Next › | Today - used by the day-based tabs. */
export function DateNav({ date, onChange }) {
  const today = getIndiaToday();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionButton onClick={() => onChange(addDays(date, -1))} aria-label="Previous day">‹ Prev</ActionButton>
      <input
        type="date"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="bg-bg-card border border-border px-3 py-1.5 text-sm text-text-primary focus:border-accent-ink focus:outline-none"
        aria-label="Date"
      />
      <ActionButton onClick={() => onChange(addDays(date, 1))} aria-label="Next day">Next ›</ActionButton>
      {date !== today && <ActionButton onClick={() => onChange(today)}>Today</ActionButton>}
      <span className="ml-auto font-heading font-semibold">
        {formatFullDate(date)}
        {date === today && <span className="ml-2 text-xs text-accent-ink tracking-widest uppercase">Today</span>}
      </span>
    </div>
  );
}
