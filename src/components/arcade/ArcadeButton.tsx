import React, { useState } from 'react'

interface ArcadeButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'pink' | 'yellow' | 'green' | 'cyan' | 'muted'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

const VARIANT_COLORS: Record<string, string> = {
  pink: '#ff2e63',
  yellow: '#ffd93d',
  green: '#3ce67a',
  cyan: '#4cf1ff',
  muted: '#8a8aad',
}

const VARIANT_TEXT: Record<string, string> = {
  pink: '#fff',
  yellow: '#0a0a14',
  green: '#0a0a14',
  cyan: '#0a0a14',
  muted: '#fff',
}

const SIZE_FONT: Record<string, number> = {
  sm: 10,
  md: 14,
  lg: 18,
}

const SIZE_PADDING: Record<string, string> = {
  sm: '8px 12px',
  md: '14px 22px',
  lg: '18px 28px',
}

export function ArcadeButton({
  children,
  onClick,
  variant = 'pink',
  size = 'md',
  disabled = false,
  className,
}: ArcadeButtonProps) {
  const [pressed, setPressed] = useState(false)

  const bg = VARIANT_COLORS[variant]
  const color = VARIANT_TEXT[variant]
  const fontSize = SIZE_FONT[size]
  const padding = SIZE_PADDING[size]

  const style: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize,
    padding,
    background: bg,
    color,
    border: 'none',
    boxShadow: pressed
      ? 'inset 0 0 0 4px #0a0a14, 0 2px 0 4px #0a0a14'
      : 'inset 0 0 0 4px #0a0a14, 0 6px 0 4px #0a0a14',
    letterSpacing: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transform: pressed ? 'translateY(4px)' : 'translateY(0)',
    transition: 'transform 0.05s, box-shadow 0.05s',
    lineHeight: 1.4,
    display: 'inline-block',
    textAlign: 'center' as const,
    userSelect: 'none' as const,
  }

  const handleMouseDown = () => {
    if (!disabled) setPressed(true)
  }

  const handleMouseUp = () => {
    setPressed(false)
  }

  const handleMouseLeave = () => {
    setPressed(false)
  }

  return (
    <button
      style={style}
      className={className}
      onClick={disabled ? undefined : onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
