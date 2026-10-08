/**
 * Format: {class}{section}{roll-padded-to-2}
 * Example: Class 6, Section B, Roll 1  → "6B01"
 *          Class 10, Section A, Roll 15 → "10A15"
 */
export function generateStudentId(cls: number, section: string, rollNo: number): string {
  return `${cls}${section.toUpperCase()}${String(rollNo).padStart(2, '0')}`;
}