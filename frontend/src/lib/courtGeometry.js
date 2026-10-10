// Pickleball court geometry: 20 ft × 44 ft, kitchen 7 ft from the net.

export const COURT_RATIO = 20 / 44;
const KITCHEN_DEPTH = 7 / 44; // fraction of court length

export function getCourtGeometry(x, y, height) {
  const width = height * COURT_RATIO;
  const netY = y + height / 2;
  const kitchen = height * KITCHEN_DEPTH;

  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    netY,
    kitchenTop: netY - kitchen,
    kitchenBottom: netY + kitchen,
    bottom: y + height,
    right: x + width,
  };
}

