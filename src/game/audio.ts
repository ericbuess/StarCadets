// Web Audio API sound effects - no external files needed
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

export function initAudio() {
  // Initialize on first user interaction
  getCtx()
}

function playTone(freq: number, duration: number, type: OscillatorType = "square", volume = 0.15) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available
  }
}

export function playEngineSound(speed: number) {
  const freq = 80 + speed * 0.3
  playTone(freq, 0.08, "sawtooth", 0.03)
}

export function playCrashSound() {
  const ctx = getCtx()
  try {
    // Noise burst
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  } catch {
    // fallback
    playTone(100, 0.3, "sawtooth", 0.3)
  }
}

export function playFlipSound() {
  playTone(800, 0.15, "sine", 0.1)
  setTimeout(() => playTone(1200, 0.1, "sine", 0.08), 50)
}

export function playPowerupSound() {
  playTone(600, 0.1, "sine", 0.12)
  setTimeout(() => playTone(900, 0.1, "sine", 0.1), 80)
  setTimeout(() => playTone(1200, 0.1, "sine", 0.08), 160)
}

export function playLandingSound() {
  playTone(150, 0.1, "triangle", 0.1)
}

export function playCheckpointSound() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "sine", 0.12), i * 100)
  })
}

export function playCorrectSound() {
  playTone(523, 0.15, "sine", 0.12)
  setTimeout(() => playTone(784, 0.2, "sine", 0.1), 100)
}

export function playWrongSound() {
  playTone(200, 0.3, "sawtooth", 0.1)
  setTimeout(() => playTone(150, 0.3, "sawtooth", 0.08), 150)
}

export function playExplosionSound() {
  const ctx = getCtx()
  try {
    const bufferSize = ctx.sampleRate * 0.5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2) * Math.sin(t * 50)
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  } catch {
    playTone(80, 0.5, "sawtooth", 0.3)
  }
}

export function playCelebrationSound() {
  const melody = [523, 659, 784, 1047, 784, 1047, 1318]
  melody.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, "sine", 0.1), i * 80)
  })
}
