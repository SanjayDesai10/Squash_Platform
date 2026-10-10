export default function FormField({ id, label, type = 'text', value, onChange, autoComplete, minLength, required = true, hint }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-text-muted uppercase tracking-widest mb-2 font-heading">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className="w-full bg-bg-card border border-border px-4 py-3 text-text-primary placeholder:text-text-muted transition-colors duration-300 focus:border-accent-ink focus:outline-none"
      />
      {hint && <p className="mt-2 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
