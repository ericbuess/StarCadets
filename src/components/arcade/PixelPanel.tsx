import React from 'react'

interface PixelPanelProps {
  children: React.ReactNode
  variant?: 'default' | 'hot' | 'info' | 'error'
  className?: string
  style?: React.CSSProperties
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default: {
    background: '#1a1a2e',
    border: '4px solid #2d2d5c',
  },
  hot: {
    background: '#1a1a2e',
    border: '6px solid #ffd93d',
    boxShadow:
      '0 0 0 6px #0a0a14, 0 8px 0 6px #0a0a14, 0 0 60px rgba(255,217,61,0.3)',
  },
  info: {
    background: '#1a1a2e',
    border: '5px solid #4cf1ff',
    boxShadow: '0 0 30px rgba(76,241,255,0.4), 0 6px 0 #0a0a14',
  },
  error: {
    background: '#1a1a2e',
    border: '4px solid #ff2e63',
    boxShadow: '0 0 30px rgba(255,46,99,0.5)',
  },
}

export function PixelPanel({
  children,
  variant = 'default',
  className,
  style,
}: PixelPanelProps) {
  const variantStyle = VARIANT_STYLES[variant]

  const combinedStyle: React.CSSProperties = {
    ...variantStyle,
    padding: '20px 22px',
    borderRadius: 0,
    ...style,
  }

  return (
    <div style={combinedStyle} className={className}>
      {children}
    </div>
  )
}
