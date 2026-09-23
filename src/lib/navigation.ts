export function getProgress(y: number, height: number, viewport: number) {
  return height <= viewport
    ? 0
    : Math.max(0, Math.min(1, y / (height - viewport)));
}
export function getActiveSection(
  sections: { id: string; top: number }[],
  offset: number,
) {
  return (
    sections.filter((section) => section.top <= offset).at(-1)?.id ??
    sections[0]?.id ??
    "home"
  );
}
export function getDragTargetIndex(
  startIndex: number,
  nearestIndex: number,
  distance: number,
  count: number,
) {
  const target =
    nearestIndex === startIndex && Math.abs(distance) >= 64
      ? startIndex + Math.sign(distance)
      : nearestIndex;
  return Math.max(0, Math.min(count - 1, target));
}
export function wrapIndex(index: number, count: number) {
  return count <= 0 ? 0 : ((index % count) + count) % count;
}
