// ═══════════════════════════════════════════════════════════
// Pickleball court markings, drawn inside an existing <svg>.
//
// Regulation court: 20 ft wide × 44 ft long. The net crosses the
// middle; the non-volley zone ("kitchen") extends 7 ft from the net on
// each side; a centreline splits each half into left/right service
// courts from the kitchen line to the baseline.
//
// The court is drawn portrait (net horizontal). Pass the top-left
// corner and the height; the width follows the real 20:44 ratio.
// ═══════════════════════════════════════════════════════════

import { getCourtGeometry } from '../lib/courtGeometry';

/**
 * @param lineProps  extra props for every line/shape (e.g. className
 *                   and style for scroll animations)
 * @param weight     stroke-width multiplier for small diagrams
 */
export default function PickleballCourt({
  x,
  y,
  height,
  color = 'currentColor',
  weight = 1,
  lineProps = {},
  kitchenFill = true,
}) {
  const g = getCourtGeometry(x, y, height);
  const netOverhang = g.width * 0.06; // net posts sit just outside the sidelines

  return (
    <g>
      {/* Kitchen (non-volley zone) tint */}
      {kitchenFill && (
        <rect
          {...lineProps}
          x={g.x}
          y={g.kitchenTop}
          width={g.width}
          height={g.kitchenBottom - g.kitchenTop}
          fill={color}
          fillOpacity="0.08"
          stroke="none"
        />
      )}

      {/* Baselines + sidelines */}
      <rect
        {...lineProps}
        x={g.x}
        y={g.y}
        width={g.width}
        height={g.height}
        fill="none"
        stroke={color}
        strokeWidth={2 * weight}
        strokeOpacity="0.8"
      />

      {/* Kitchen lines */}
      <line {...lineProps} x1={g.x} y1={g.kitchenTop} x2={g.right} y2={g.kitchenTop} stroke={color} strokeWidth={1.5 * weight} strokeOpacity="0.6" />
      <line {...lineProps} x1={g.x} y1={g.kitchenBottom} x2={g.right} y2={g.kitchenBottom} stroke={color} strokeWidth={1.5 * weight} strokeOpacity="0.6" />

      {/* Centrelines (service courts) */}
      <line {...lineProps} x1={g.centerX} y1={g.y} x2={g.centerX} y2={g.kitchenTop} stroke={color} strokeWidth={1.2 * weight} strokeOpacity="0.5" />
      <line {...lineProps} x1={g.centerX} y1={g.kitchenBottom} x2={g.centerX} y2={g.bottom} stroke={color} strokeWidth={1.2 * weight} strokeOpacity="0.5" />

      {/* Net with posts */}
      <line
        {...lineProps}
        x1={g.x - netOverhang}
        y1={g.netY}
        x2={g.right + netOverhang}
        y2={g.netY}
        stroke={color}
        strokeWidth={3 * weight}
        strokeOpacity="0.9"
        strokeDasharray={`${4 * weight} ${2 * weight}`}
      />
      <circle {...lineProps} cx={g.x - netOverhang} cy={g.netY} r={3 * weight} fill={color} />
      <circle {...lineProps} cx={g.right + netOverhang} cy={g.netY} r={3 * weight} fill={color} />
    </g>
  );
}
