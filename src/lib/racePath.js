/** SVG path in viewBox 0 0 100 100 — winds across the viewport like a real pit lane */
export const ROAD_PATH_D =
  'M 50 2 C 58 4, 68 7, 74 12 C 80 17, 78 22, 70 25 C 58 28, 38 30, 26 34 C 14 38, 16 44, 26 48 C 36 52, 52 54, 68 56 C 80 58, 84 64, 76 70 C 64 76, 42 78, 30 82 C 20 86, 24 92, 36 95 C 44 97, 48 99, 50 99.5'

export const PIT_STOPS = [
  { id: 'hero', label: 'START', progress: 0.06 },
  { id: 'standard', label: 'VERIFY', progress: 0.22 },
  { id: 'lanes', label: 'LANES', progress: 0.4 },
  { id: 'vault', label: 'VAULT', progress: 0.58 },
  { id: 'drop', label: 'DROP', progress: 0.76 },
]

export function lerpKeyframes(progress, keys, values) {
  if (progress <= keys[0]) return values[0]
  for (let i = 0; i < keys.length - 1; i++) {
    if (progress <= keys[i + 1]) {
      const t = (progress - keys[i]) / (keys[i + 1] - keys[i])
      const eased = t * t * (3 - 2 * t)
      return values[i] + eased * (values[i + 1] - values[i])
    }
  }
  return values[values.length - 1]
}

export const MOTION_KEYS = {
  progress: [0, 0.05, 0.08, 0.18, 0.22, 0.36, 0.4, 0.54, 0.58, 0.72, 0.76, 0.9, 0.94, 1],
  blur: [0, 0, 0, 5, 5, 0, 0, 5, 5, 0, 0, 5, 0, 0],
  scale: [1.1, 1.1, 1, 1, 0.96, 0.96, 0.94, 0.94, 0.92, 0.92, 0.9, 0.9, 0.88, 0.88],
}

export function samplePath(pathEl, progress) {
  if (!pathEl) return { x: 50, y: 10, angle: 90 }

  const len = pathEl.getTotalLength()
  const t = Math.max(0, Math.min(1, progress))
  const at = pathEl.getPointAtLength(len * t)
  const ahead = pathEl.getPointAtLength(Math.min(len, len * t + len * 0.008))
  const angle = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI

  return { x: at.x, y: at.y, angle }
}
