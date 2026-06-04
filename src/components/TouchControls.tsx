/** On-screen touch controls for iPad/mobile — D-pad and action buttons */

import { useCallback, useRef } from "react"

// ─── D-Pad (4-direction) ───

interface DPadProps {
  onDirectionChange: (dir: { up: boolean; down: boolean; left: boolean; right: boolean }) => void
  size?: number
}

export function DPad({ onDirectionChange, size = 140 }: DPadProps) {
  const activeRef = useRef({ up: false, down: false, left: false, right: false })

  const press = useCallback((dir: "up" | "down" | "left" | "right") => {
    activeRef.current = { up: false, down: false, left: false, right: false, [dir]: true }
    onDirectionChange(activeRef.current)
  }, [onDirectionChange])

  const release = useCallback(() => {
    activeRef.current = { up: false, down: false, left: false, right: false }
    onDirectionChange(activeRef.current)
  }, [onDirectionChange])

  const bs = size * 0.36 // button size
  const gap = size * 0.02

  return (
    <div className="relative select-none" style={{ width: size, height: size, touchAction: "none" }}>
      {/* Up */}
      <DPadBtn x={(size - bs) / 2} y={0} w={bs} h={bs} label="▲"
        onDown={() => press("up")} onUp={release} />
      {/* Down */}
      <DPadBtn x={(size - bs) / 2} y={size - bs} w={bs} h={bs} label="▼"
        onDown={() => press("down")} onUp={release} />
      {/* Left */}
      <DPadBtn x={0} y={(size - bs) / 2} w={bs} h={bs} label="◀"
        onDown={() => press("left")} onUp={release} />
      {/* Right */}
      <DPadBtn x={size - bs} y={(size - bs) / 2} w={bs} h={bs} label="▶"
        onDown={() => press("right")} onUp={release} />
      {/* Center decoration */}
      <div className="absolute rounded-md" style={{
        left: (size - bs * 0.5) / 2, top: (size - bs * 0.5) / 2,
        width: bs * 0.5 + gap, height: bs * 0.5 + gap,
        backgroundColor: "rgba(0,240,255,0.06)",
      }} />
    </div>
  )
}

function DPadBtn({ x, y, w, h, label, onDown, onUp }: {
  x: number; y: number; w: number; h: number; label: string
  onDown: () => void; onUp: () => void
}) {
  return (
    <button
      className="absolute flex items-center justify-center rounded-lg text-sm font-bold select-none"
      style={{
        left: x, top: y, width: w, height: h,
        backgroundColor: "rgba(0,240,255,0.12)",
        border: "1px solid rgba(0,240,255,0.25)",
        color: "rgba(0,240,255,0.7)",
        touchAction: "none",
      }}
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onDown() }}
      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onUp() }}
      onMouseDown={(e) => { e.preventDefault(); onDown() }}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      {label}
    </button>
  )
}

// ─── Action Buttons (shoot, rotate, drop, etc.) ───

interface ActionButtonProps {
  label: string
  color?: string
  size?: number
  onDown: () => void
  onUp: () => void
}

export function ActionButton({ label, color = "#00f0ff", size = 56, onDown, onUp }: ActionButtonProps) {
  return (
    <button
      className="flex items-center justify-center rounded-full text-xs font-bold select-none"
      style={{
        width: size, height: size,
        backgroundColor: `${color}20`,
        border: `2px solid ${color}50`,
        color: `${color}cc`,
        touchAction: "none",
      }}
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onDown() }}
      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onUp() }}
      onMouseDown={(e) => { e.preventDefault(); onDown() }}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      {label}
    </button>
  )
}

// ─── Horizontal arrow controls (left/right + optional up for jump) ───

interface LRControlsProps {
  onLeft: (pressed: boolean) => void
  onRight: (pressed: boolean) => void
  onUp?: (pressed: boolean) => void
  onDown?: (pressed: boolean) => void
  size?: number
}

export function LRControls({ onLeft, onRight, onUp, onDown, size = 56 }: LRControlsProps) {
  return (
    <div className="flex items-center gap-3 select-none" style={{ touchAction: "none" }}>
      <ActionButton label="◀" size={size} onDown={() => onLeft(true)} onUp={() => onLeft(false)} />
      {onDown && <ActionButton label="▼" size={size} onDown={() => onDown(true)} onUp={() => onDown(false)} />}
      {onUp && <ActionButton label="▲" size={size} onDown={() => onUp(true)} onUp={() => onUp(false)} />}
      <ActionButton label="▶" size={size} onDown={() => onRight(true)} onUp={() => onRight(false)} />
    </div>
  )
}
