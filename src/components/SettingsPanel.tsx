import { useState } from "react"
import { getAvailableSubjects } from "@/game/education"
import { getShadowMode, setShadowMode, type ShadowMode } from "@/game/shadowMode"

export interface UserSettings {
  displayName: string
  age: string
  grade: string
  location: string
  school: string
  subjects: string[]
  soundEnabled: boolean
}

interface SettingsPanelProps {
  settings: UserSettings
  onSave: (settings: UserSettings) => void
  onClose: () => void
}

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]

const pixel = "'Press Start 2P', monospace"
const vt = "'VT323', monospace"

function ArcadeInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      style={{
        width: "100%", boxSizing: "border-box",
        background: "#0a0a14", border: "3px solid #2d2d5c", padding: "8px 12px",
        fontFamily: vt, fontSize: 20, color: "#fff",
        outline: "none",
      }}
      onFocus={e => { e.currentTarget.style.borderColor = "#4cf1ff" }}
      onBlur={e => { e.currentTarget.style.borderColor = "#2d2d5c" }}
    />
  )
}

export function SettingsPanel({ settings, onSave, onClose }: SettingsPanelProps) {
  const [form, setForm] = useState<UserSettings>({ ...settings })
  const [shadow, setShadow] = useState<ShadowMode>(() => getShadowMode())
  const availableSubjects = getAvailableSubjects()

  const pickShadow = (mode: ShadowMode) => {
    setShadow(mode)
    setShadowMode(mode)
  }

  const toggleSubject = (subject: string) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(10,10,20,0.95)", padding: 16, overflowY: "auto",
    }}>
      <div style={{
        maxWidth: 480, width: "100%", background: "#1a1a2e",
        border: "4px solid #4cf1ff", padding: 20,
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: pixel, fontSize: 14,
            color: "#ffd93d", textShadow: "2px 2px 0 #ff2e63",
          }}>CADET PROFILE</span>
          <button onClick={onClose} style={{
            background: "transparent", border: "3px solid #2d2d5c",
            padding: "4px 10px", cursor: "pointer",
            fontFamily: pixel, fontSize: 8, color: "#8a8aad",
          }}>✕</button>
        </div>

        <div style={{ fontFamily: vt, fontSize: 18, color: "#8a8aad" }}>
          All fields optional — the more you provide, the better we match your training.
        </div>

        {/* Display Name */}
        <div>
          <div style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1, marginBottom: 6 }}>CALL SIGN</div>
          <ArcadeInput value={form.displayName} onChange={v => setForm(f => ({ ...f, displayName: v }))} placeholder="YOUR NAME" />
        </div>

        {/* Age + Grade */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1, marginBottom: 6 }}>AGE</div>
            <ArcadeInput value={form.age} onChange={v => setForm(f => ({ ...f, age: v }))} placeholder="e.g. 10" type="number" />
          </div>
          <div>
            <div style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1, marginBottom: 6 }}>RANK (GRADE)</div>
            <select
              value={form.grade}
              onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0a0a14", border: "3px solid #2d2d5c", padding: "8px 12px",
                fontFamily: vt, fontSize: 20, color: "#fff", outline: "none",
              }}
            >
              <option value="">SELECT</option>
              {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        </div>

        {/* School + Location */}
        <div>
          <div style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1, marginBottom: 6 }}>ACADEMY</div>
          <ArcadeInput value={form.school} onChange={v => setForm(f => ({ ...f, school: v }))} placeholder="SCHOOL NAME" />
        </div>
        <div>
          <div style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1, marginBottom: 6 }}>SECTOR</div>
          <ArcadeInput value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="CITY, STATE" />
        </div>

        {/* Subjects */}
        <div>
          <div style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1, marginBottom: 8 }}>FOCUS SUBJECTS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {availableSubjects.map(subject => {
              const active = form.subjects.includes(subject)
              return (
                <button key={subject} onClick={() => toggleSubject(subject)} style={{
                  background: active ? "#4cf1ff15" : "transparent",
                  border: `3px solid ${active ? "#4cf1ff" : "#2d2d5c"}`,
                  padding: "6px 12px", cursor: "pointer",
                  fontFamily: pixel, fontSize: 7, color: active ? "#4cf1ff" : "#8a8aad",
                  letterSpacing: 1,
                }}>{subject.toUpperCase()}</button>
              )
            })}
          </div>
          <div style={{ fontFamily: vt, fontSize: 16, color: "#8a8aad60", marginTop: 4 }}>
            Leave all unselected for mixed subjects
          </div>
        </div>

        {/* Sound */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1 }}>SOUND FX</span>
          <button onClick={() => setForm(f => ({ ...f, soundEnabled: !f.soundEnabled }))} style={{
            background: form.soundEnabled ? "#3ce67a20" : "transparent",
            border: `3px solid ${form.soundEnabled ? "#3ce67a" : "#2d2d5c"}`,
            padding: "6px 14px", cursor: "pointer",
            fontFamily: pixel, fontSize: 8, color: form.soundEnabled ? "#3ce67a" : "#8a8aad",
          }}>{form.soundEnabled ? "ON" : "OFF"}</button>
        </div>

        {/* Shadow Mode */}
        <div>
          <div style={{ fontFamily: pixel, fontSize: 7, color: "#4cf1ff", letterSpacing: 1, marginBottom: 8 }}>SHADOW MODE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {(["off", "last", "best"] as ShadowMode[]).map(mode => {
              const active = shadow === mode
              const label = mode === "off" ? "OFF" : mode === "last" ? "VS LAST" : "VS BEST"
              return (
                <button key={mode} onClick={() => pickShadow(mode)} style={{
                  background: active ? "#b83dff20" : "transparent",
                  border: `3px solid ${active ? "#b83dff" : "#2d2d5c"}`,
                  padding: "8px 0", cursor: "pointer",
                  fontFamily: pixel, fontSize: 8, color: active ? "#b83dff" : "#8a8aad",
                  boxShadow: active ? "0 0 12px #b83dff30" : "none",
                }}>{label}</button>
              )
            })}
          </div>
          <div style={{ fontFamily: vt, fontSize: 16, color: "#8a8aad60", marginTop: 4 }}>
            Race a ghost of your previous run
          </div>
        </div>

        {/* Save / Cancel */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, background: "#1a1a2e", border: "4px solid #2d2d5c",
            padding: "12px 0", cursor: "pointer",
            fontFamily: pixel, fontSize: 10, color: "#8a8aad",
          }}>CANCEL</button>
          <button onClick={() => onSave(form)} style={{
            flex: 1, background: "#ffd93d", border: "4px solid #ffd93d",
            padding: "12px 0", cursor: "pointer",
            fontFamily: pixel, fontSize: 10, color: "#0a0a14",
            boxShadow: "0 0 16px #ffd93d30, inset 0 -4px 0 #cc9900",
          }}>SAVE</button>
        </div>
      </div>
    </div>
  )
}
