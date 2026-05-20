export const DEFAULT_AUTO_ACCEPT_THRESHOLD = 0.85

export function shouldAutoAccept(confidence: number, threshold: number): boolean {
  return confidence >= threshold
}
