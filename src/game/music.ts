// Procedural chiptune music system using Web Audio API

interface Track {
  name: string
  bpm: number
  notes: number[][]  // Each sub-array is a bar of MIDI-like note numbers (0 = rest)
  bassNotes: number[][]
  style: OscillatorType
  bassStyle: OscillatorType
}

const TRACKS: Track[] = [
  {
    name: "Neon Drive",
    bpm: 140,
    style: "square",
    bassStyle: "sawtooth",
    notes: [
      [72, 0, 76, 0, 79, 0, 76, 0],
      [74, 0, 77, 0, 81, 0, 77, 0],
      [72, 0, 76, 0, 79, 0, 84, 0],
      [79, 0, 77, 0, 76, 0, 74, 0],
    ],
    bassNotes: [
      [48, 0, 48, 0, 48, 0, 48, 0],
      [50, 0, 50, 0, 50, 0, 50, 0],
      [48, 0, 48, 0, 48, 0, 48, 0],
      [45, 0, 45, 0, 47, 0, 47, 0],
    ],
  },
  {
    name: "Turbo Boost",
    bpm: 160,
    style: "square",
    bassStyle: "triangle",
    notes: [
      [76, 79, 83, 0, 76, 79, 83, 86],
      [74, 77, 81, 0, 74, 77, 81, 84],
      [72, 76, 79, 0, 72, 76, 79, 83],
      [71, 74, 78, 0, 71, 74, 78, 83],
    ],
    bassNotes: [
      [52, 0, 52, 52, 0, 52, 52, 0],
      [50, 0, 50, 50, 0, 50, 50, 0],
      [48, 0, 48, 48, 0, 48, 48, 0],
      [47, 0, 47, 47, 0, 47, 47, 0],
    ],
  },
  {
    name: "Midnight Racer",
    bpm: 120,
    style: "triangle",
    bassStyle: "sawtooth",
    notes: [
      [60, 0, 64, 67, 0, 72, 0, 67],
      [62, 0, 65, 69, 0, 74, 0, 69],
      [64, 0, 67, 71, 0, 76, 0, 71],
      [62, 0, 65, 69, 0, 72, 0, 67],
    ],
    bassNotes: [
      [36, 0, 36, 0, 43, 0, 43, 0],
      [38, 0, 38, 0, 45, 0, 45, 0],
      [40, 0, 40, 0, 47, 0, 47, 0],
      [38, 0, 38, 0, 45, 0, 45, 0],
    ],
  },
  {
    name: "Flip City",
    bpm: 150,
    style: "square",
    bassStyle: "square",
    notes: [
      [84, 81, 79, 76, 79, 81, 84, 86],
      [83, 79, 76, 74, 76, 79, 83, 86],
      [84, 81, 79, 76, 72, 76, 79, 81],
      [86, 84, 81, 79, 76, 79, 81, 84],
    ],
    bassNotes: [
      [48, 48, 0, 48, 48, 0, 48, 0],
      [47, 47, 0, 47, 47, 0, 47, 0],
      [45, 45, 0, 45, 45, 0, 45, 0],
      [43, 43, 0, 43, 43, 0, 43, 0],
    ],
  },
  {
    name: "Edu Groove",
    bpm: 130,
    style: "triangle",
    bassStyle: "triangle",
    notes: [
      [67, 0, 72, 0, 67, 74, 0, 72],
      [69, 0, 74, 0, 69, 76, 0, 74],
      [67, 0, 71, 0, 67, 72, 0, 71],
      [65, 0, 69, 0, 65, 72, 0, 69],
    ],
    bassNotes: [
      [43, 0, 43, 43, 0, 43, 0, 43],
      [45, 0, 45, 45, 0, 45, 0, 45],
      [43, 0, 43, 43, 0, 43, 0, 43],
      [41, 0, 41, 41, 0, 41, 0, 41],
    ],
  },
]

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12)
}

class MusicPlayer {
  private ctx: AudioContext | null = null
  private currentTrackIndex = 0
  private playing = false
  private masterGain: GainNode | null = null
  private nextNoteTime = 0
  private currentBar = 0
  private currentBeat = 0
  private schedulerInterval: ReturnType<typeof setInterval> | null = null
  private volume = 0.08

  get trackName(): string {
    return TRACKS[this.currentTrackIndex].name
  }

  get trackCount(): number {
    return TRACKS.length
  }

  get trackIndex(): number {
    return this.currentTrackIndex
  }

  get isPlaying(): boolean {
    return this.playing
  }

  getAllTrackNames(): string[] {
    return TRACKS.map(t => t.name)
  }

  init() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.ctx.destination)
    }
  }

  play() {
    this.init()
    if (!this.ctx || !this.masterGain) return
    if (this.ctx.state === "suspended") this.ctx.resume()

    this.playing = true
    this.nextNoteTime = this.ctx.currentTime
    this.currentBar = 0
    this.currentBeat = 0

    if (this.schedulerInterval) clearInterval(this.schedulerInterval)
    this.schedulerInterval = setInterval(() => this.scheduler(), 25)
  }

  stop() {
    this.playing = false
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = null
    }
  }

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % TRACKS.length
    if (this.playing) {
      this.currentBar = 0
      this.currentBeat = 0
    }
  }

  prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + TRACKS.length) % TRACKS.length
    if (this.playing) {
      this.currentBar = 0
      this.currentBeat = 0
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(0.2, v))
    if (this.masterGain) this.masterGain.gain.value = this.volume
  }

  private scheduler() {
    if (!this.ctx || !this.playing) return
    const track = TRACKS[this.currentTrackIndex]
    const secPerBeat = 60 / track.bpm / 2 // eighth notes

    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      const bar = track.notes[this.currentBar % track.notes.length]
      const bassBar = track.bassNotes[this.currentBar % track.bassNotes.length]
      const note = bar[this.currentBeat % bar.length]
      const bassNote = bassBar[this.currentBeat % bassBar.length]

      if (note > 0) this.playNote(note, this.nextNoteTime, secPerBeat * 0.8, track.style, 0.6)
      if (bassNote > 0) this.playNote(bassNote, this.nextNoteTime, secPerBeat * 0.9, track.bassStyle, 0.4)

      // Hi-hat on every other beat
      if (this.currentBeat % 2 === 0) this.playNoise(this.nextNoteTime, 0.04)

      this.nextNoteTime += secPerBeat
      this.currentBeat++
      if (this.currentBeat >= bar.length) {
        this.currentBeat = 0
        this.currentBar++
      }
    }
  }

  private playNote(midiNote: number, time: number, duration: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.masterGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = midiToFreq(midiNote)
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(time)
    osc.stop(time + duration + 0.01)
  }

  private playNoise(time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration)
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
      }
      const source = this.ctx.createBufferSource()
      source.buffer = buffer
      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.15, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

      const filter = this.ctx.createBiquadFilter()
      filter.type = "highpass"
      filter.frequency.value = 8000

      source.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)
      source.start(time)
    } catch {
      // ignore
    }
  }
}

export const musicPlayer = new MusicPlayer()
