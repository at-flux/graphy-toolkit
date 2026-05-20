/** Width / height after orientation. */
export function ratio(width: number, height: number): number {
  if (height <= 0) return 0;
  return width / height;
}

/** Log-space distance between two aspect ratios (symmetric). */
export function logDistance(a: number, b: number): number {
  if (a <= 0 || b <= 0) return Infinity;
  return Math.abs(Math.log(a / b));
}
