/**
 * Display number for a court, e.g. "02".
 *
 * Taken from the court's name ("Court 02" → "02") rather than its
 * database id: ids are never reused, so after courts are removed the
 * id no longer matches the court's name. Falls back to the court's
 * position in the list when the name has no number.
 */
export function getCourtNumber(court, index = 0) {
  const match = court.name.match(/(\d+)\s*$/);
  const number = match ? Number(match[1]) : index + 1;
  return String(number).padStart(2, '0');
}
