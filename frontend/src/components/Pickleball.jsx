import { useId, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
// Pickleball - optic-yellow plastic ball with evenly spaced holes.
//
// Real balls have 26 (indoor, larger holes) or 40 (outdoor, smaller
// holes) holes spread evenly over the sphere. We place hole centres on
// a sphere with a Fibonacci lattice, rotate it so the pattern doesn't
// look aligned to the viewer, and draw only the front hemisphere with
// perspective foreshortening: holes near the rim become thin ellipses
// flattened toward the centre, like on a real ball.
// ═══════════════════════════════════════════════════════════

const HOLE_RADIUS_RATIO = {
  40: 0.105, // outdoor
  26: 0.14,  // indoor
};

function computeHoles(count) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const tilt = 0.6;  // rotation about X (radians)
  const spin = 0.35; // rotation about Y
  const holes = [];

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere point
    const y0 = 1 - ((i + 0.5) / count) * 2;
    const ring = Math.sqrt(1 - y0 * y0);
    const theta = golden * i;
    let x = Math.cos(theta) * ring;
    let y = y0;
    let z = Math.sin(theta) * ring;

    // Tilt the lattice so poles aren't facing the camera
    [y, z] = [y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
    [x, z] = [x * Math.cos(spin) + z * Math.sin(spin), -x * Math.sin(spin) + z * Math.cos(spin)];

    // Front hemisphere only (z toward viewer); skip holes almost
    // edge-on, which would be invisible slivers.
    if (z <= 0.12) continue;

    holes.push({
      x,
      y: -y, // SVG y grows downward
      depth: z,
      // Direction from the ball centre, used to orient the ellipse
      angle: (Math.atan2(-y, x) * 180) / Math.PI,
    });
  }

  return holes;
}

/**
 * Pickleball drawn inside an existing <svg> (for court diagrams).
 * `cx`, `cy`, `r` are in the parent SVG's user units.
 */
export function PickleballShape({ cx, cy, r, holes = 40, ...props }) {
  const id = useId().replace(/:/g, '');
  const holeList = useMemo(() => computeHoles(holes), [holes]);
  const holeRadius = r * (HOLE_RADIUS_RATIO[holes] ?? 0.12);

  return (
    <g {...props}>
      <defs>
        {/* Body: highlight top-left, darker rim bottom-right */}
        <radialGradient id={`${id}-body`} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fbff9a" />
          <stop offset="30%" stopColor="#e4f53a" />
          <stop offset="70%" stopColor="#c3d916" />
          <stop offset="100%" stopColor="#7d8d05" />
        </radialGradient>
        {/* Hole: you see the shaded inside of the hollow ball */}
        <radialGradient id={`${id}-hole`} cx="60%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#4d5600" />
          <stop offset="100%" stopColor="#7c8a05" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-body)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {holeList.map((hole, i) => {
          const hx = cx + hole.x * r;
          const hy = cy + hole.y * r;
          return (
            <ellipse
              key={i}
              cx={hx}
              cy={hy}
              // Foreshortened along the radial direction
              rx={holeRadius * hole.depth}
              ry={holeRadius}
              transform={`rotate(${hole.angle} ${hx} ${hy})`}
              fill={`url(#${id}-hole)`}
              // Holes facing away from the light read darker
              opacity={0.55 + 0.4 * hole.depth}
            />
          );
        })}
      </g>

      {/* Soft specular highlight */}
      <ellipse
        cx={cx - r * 0.35}
        cy={cy - r * 0.4}
        rx={r * 0.28}
        ry={r * 0.16}
        transform={`rotate(-35 ${cx - r * 0.35} ${cy - r * 0.4})`}
        fill="#ffffff"
        opacity="0.35"
      />
      {/* Rim shading */}
      <circle cx={cx} cy={cy} r={r - r * 0.01} fill="none" stroke="#5f6c00" strokeOpacity="0.35" strokeWidth={r * 0.02} />
    </g>
  );
}

/** Standalone pickleball image. */
export default function Pickleball({ size = 192, holes = 40, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <PickleballShape cx={50} cy={50} r={49} holes={holes} />
    </svg>
  );
}
