export function starsFromCorrect(correct: number): number {
  if (correct >= 15) return 3
  if (correct >= 8) return 2
  if (correct >= 3) return 1
  return 0
}

export function accuracy(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}

export function perMin(correct: number, elapsedSec: number): number {
  return elapsedSec > 0 ? Math.round((correct / elapsedSec) * 60) : 0
}
