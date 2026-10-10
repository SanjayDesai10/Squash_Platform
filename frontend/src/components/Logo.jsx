import { useTheme } from '../context/ThemeContext';

/** Brand logo in the variant that suits the current theme. */
export default function Logo({ className = '' }) {
  const { theme } = useTheme();
  return (
    <img
      src={theme === 'light' ? '/logo-on-white.png' : '/logo-on-dark.png'}
      alt="The Ball Room"
      className={className}
    />
  );
}
