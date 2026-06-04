import { useState, useCallback } from "react"
import { runAllTests } from "@/game/qaTests"
import type { TestReport, TestResult } from "@/game/qaTests"

interface QAPanelProps {
  onClose: () => void
}

export function QAPanel({ onClose }: QAPanelProps) {
  const [report, setReport] = useState<TestReport | null>(null)
  const [running, setRunning] = useState(false)
  const [filter, setFilter] = useState<string>("all")

  const handleRun = useCallback(() => {
    setRunning(true)
    // Use setTimeout to let the UI update before running tests
    setTimeout(() => {
      const result = runAllTests()
      setReport(result)
      setRunning(false)
    }, 50)
  }, [])

  const filtered = report
    ? filter === "all"
      ? report.results
      : filter === "failed"
        ? report.results.filter(r => !r.passed)
        : report.results.filter(r => r.category === filter)
    : []

  const categories = report
    ? [...new Set(report.results.map(r => r.category))]
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">QA Test Harness</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Headless game engine + education system tests
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl leading-none hover:text-white"
          >
            &times;
          </button>
        </div>

        {/* Run button + summary */}
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={handleRun}
            disabled={running}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-950 transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: "#00d4e0" }}
          >
            {running ? "Running tests..." : "Run All Tests"}
          </button>

          {report && (
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm font-mono">
                <span className="text-green-400">{report.passed} passed</span>
                {report.failed > 0 && (
                  <>
                    {" / "}
                    <span className="text-red-400">{report.failed} failed</span>
                  </>
                )}
                {" / "}
                <span className="text-gray-400">{report.total} total</span>
              </span>
              <span className="text-xs text-gray-600">
                {report.duration.toFixed(0)}ms
              </span>
              {report.failed === 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-900/50 text-green-400 border border-green-800">
                  ALL PASS
                </span>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        {report && (
          <div className="flex gap-1.5 p-3 border-b border-gray-800 flex-wrap">
            <FilterChip
              label="All"
              active={filter === "all"}
              onClick={() => setFilter("all")}
              count={report.total}
            />
            <FilterChip
              label="Failed"
              active={filter === "failed"}
              onClick={() => setFilter("failed")}
              count={report.failed}
              color="#ff4444"
            />
            {categories.map(cat => (
              <FilterChip
                key={cat}
                label={cat}
                active={filter === cat}
                onClick={() => setFilter(cat)}
                count={report.results.filter(r => r.category === cat).length}
              />
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-3 space-y-1.5">
          {filtered.map((result, i) => (
            <TestResultRow key={i} result={result} />
          ))}
          {report && filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8 text-sm">
              No tests match this filter.
            </p>
          )}
          {!report && (
            <p className="text-center text-gray-500 py-12 text-sm">
              Click "Run All Tests" to execute the test suite.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  count,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  count: number
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-xs font-mono transition-all"
      style={{
        backgroundColor: active
          ? color ? `${color}30` : "rgba(0,212,224,0.2)"
          : "rgba(255,255,255,0.05)",
        border: active
          ? `1px solid ${color || "#00d4e0"}`
          : "1px solid rgba(255,255,255,0.1)",
        color: active ? color || "#00d4e0" : "#888",
      }}
    >
      {label} ({count})
    </button>
  )
}

function TestResultRow({ result }: { result: TestResult }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-lg border transition-all"
      style={{
        borderColor: result.passed ? "rgba(0,255,0,0.15)" : "rgba(255,68,68,0.3)",
        backgroundColor: result.passed ? "rgba(0,255,0,0.03)" : "rgba(255,68,68,0.05)",
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-sm flex-shrink-0">
          {result.passed ? "✓" : "✗"}
        </span>
        <span
          className="text-xs font-mono flex-1 truncate"
          style={{ color: result.passed ? "#aaa" : "#ff8888" }}
        >
          {result.name}
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "#666",
          }}
        >
          {result.category}
        </span>
      </div>
      {expanded && (
        <div
          className="px-3 pb-2 text-[11px] font-mono"
          style={{ color: result.passed ? "#666" : "#cc8888" }}
        >
          {result.details}
        </div>
      )}
    </button>
  )
}
