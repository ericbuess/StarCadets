import type { Problem } from '@/types/drill'

export function genProblem(): Problem {
  for (let attempt = 0; attempt < 50; attempt++) {
    const a = Math.floor(Math.random() * 9) + 1
    const b = Math.floor(Math.random() * 9) + 1
    const c = Math.floor(Math.random() * 9) + 1
    const op1: '+' | '−' = Math.random() < 0.5 ? '+' : '−'
    const op2: '+' | '−' = Math.random() < 0.5 ? '+' : '−'
    const apply = (x: number, op: '+' | '−', y: number) => (op === '+' ? x + y : x - y)
    const ans = apply(apply(a, op1, b), op2, c)
    if (ans >= 0 && ans <= 18) return { a, b, c, op1, op2, ans }
  }
  return { a: 5, b: 3, c: 2, op1: '+', op2: '−', ans: 6 }
}
