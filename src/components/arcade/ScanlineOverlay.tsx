export function ScanlineOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        background:
          'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)',
        mixBlendMode: 'multiply',
        opacity: 0.6,
      }}
    />
  )
}
