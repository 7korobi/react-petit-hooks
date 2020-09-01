import { useState, useEffect, useRef } from 'react'
import { to_msec, to_relative_time_distance, to_tempo_bare, Tempo, to_tempo } from './time'

type TEMPO = [number, Tempo]
type TICK = [number, Tempo, string]
type RelativeTickOption<T> = {
  limit: string
  format(id: T): string
}
type RelativeTickData = {
  idAt: number
  limitAt: number
}

export function useTempo(size_str: string, zero_str: string = '0s') {
  const [[timerId, tempo], setTick] = useState<TEMPO>([] as any)
  useEffect(init, [])
  return [tempo]

  function init() {
    tick()
  }

  function tick() {
    const now = Date.now()
    const tempo = to_tempo(size_str, zero_str, now)
    const { timeout } = tempo
    const timerId = setTimeout(tick, timeout) as any
    setTick([timerId, tempo])
  }
}

export function useRelativeTick<T extends number | string | Date>(
  id: T,
  { limit, format }: RelativeTickOption<T>
): [string, Tempo] {
  const option = useRef<RelativeTickData>({} as any)
  const [[timerId, tempo, text], setTick] = useState([null as any, null as any, ''])
  useEffect(reset, [id, limit])
  return [text, tempo]

  function reset() {
    option.current.idAt = new Date(id).getTime()
    option.current.limitAt = to_msec(limit)
    if (timerId) {
      clearTimeout(timerId)
    }
    const newTimerId = tick()
    return () => {
      clearTimeout(newTimerId)
    }
  }

  function tick(): number {
    const { idAt, limitAt } = option.current
    const now = Date.now()
    const at = now - idAt
    const [, interval, , template] = to_relative_time_distance(at)
    const tempo = to_tempo_bare(interval, 0, at)
    const { now_idx, timeout } = tempo

    if (limitAt < at) {
      const timerId = null as any
      const text = format(id)
      setTick([timerId, tempo, text])
      return timerId
    }

    if (at < -limitAt) {
      const timerId = setTimeout(tick, timeout) as any
      const text = format(id)
      setTick([timerId, tempo, text])
      return timerId
    }

    const text = template.replace('%s', String(Math.abs(now_idx)))
    const timerId = setTimeout(tick, timeout) as any
    setTick([timerId, tempo, text])
    return timerId
  }
}
