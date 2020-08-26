import { useState, useEffect } from 'react'
import Dexie from 'dexie'

import { to_tempo, Tempo } from './time'
import { useMenu } from './browser'

import { __BROWSER__ } from './device'

type DATA<T> = { idx: string; pack: T }
type META = { idx: string; version: string; next_at: number }

class PollWeb extends Dexie {
  meta!: Dexie.Table<META, string>
  data!: Dexie.Table<DATA<any>, string>
}

let dexie: PollWeb = null as any
if (__BROWSER__) {
  dexie = new Dexie('poll-web') as PollWeb
  dexie.version(1).stores({
    meta: '&idx',
    data: '&idx',
  })
}

export function usePoll<T>(
  api: (...args: any[]) => Promise<{ pack: T }>,
  store: (data: DATA<T>) => void,
  initState: T | (() => T),
  timestr: string,
  version: string,
  args: any[] = []
): [T] {
  const [pack, setPack] = useState<T>(initState)
  const { isOnline, isVisible } = useMenu()
  const is_active = isOnline && isVisible
  const idx = [api.name, args.join('/')].join('&')

  // in roop vars.
  let tempo = to_tempo(timestr)
  let next_at = -Infinity
  let timerId = 0 as any

  useEffect(() => {
    if (is_active) {
      roop()
      return () => {
        clearTimeout(timerId)
      }
    } else {
      clearTimeout(timerId)
      return () => {}
    }
  }, [is_active])
  return [pack]

  async function roop() {
    tempo = tempo.reset()
    try {
      if (tempo.write_at < next_at) {
        get_pass(idx, tempo)
      } else {
        // IndexedDB metadata not use if memory has past data,
        const meta_next_at = await chk_meta(idx, version, next_at)
        if (tempo.write_at < meta_next_at) {
          await get_by_lf(idx, tempo, setPack, store)
        } else if (-Infinity < meta_next_at) {
          await get_by_lf(idx, tempo, setPack, store)
          const data = (await api(...args)) as DATA<T>
          await get_by_api(idx, tempo, setPack, data)
        } else {
          const data = (await api(...args)) as DATA<T>
          await get_by_api(idx, tempo, setPack, data)
          dexie.meta.put({ idx, version, next_at: tempo.next_at })
        }
      }
      next_at = tempo.next_at
    } catch (e) {
      console.error(e)
    }
    if (tempo.timeout < 0x7fffffff) {
      // 25days
      timerId = setTimeout(roop, tempo.timeout)
    }
  }
}

async function chk_meta(idx: string, version: string, next_at: number) {
  if (-Infinity < next_at) {
    return next_at
  }
  if (dexie) {
    const meta = await dexie.meta.get(idx)
    if (meta && meta.version === version) {
      return meta.next_at
    }
  }
  return -Infinity
}

async function get_pass(idx: string, { write_at }: Tempo) {
  const wait = new Date().getTime() - write_at
  console.log({ wait, idx, mode: null })
}

async function get_by_lf<T>(
  idx: string,
  { write_at }: Tempo,
  setPack: (pack: T) => void,
  store: (data: DATA<T>) => void
) {
  if (dexie) {
    const data = await dexie.data.get(idx)
    if (data) {
      store(data)
      setPack(data.pack)
    }
  }
  const wait = new Date().getTime() - write_at
  console.log({ wait, idx, mode: '(lf)' })
}

async function get_by_api<T>(
  idx: string,
  { write_at }: Tempo,
  setPack: (pack: T) => void,
  data: DATA<T>
) {
  if (dexie) {
    data.idx = idx
    await dexie.data.put(data)
    setPack(data.pack)
  }
  const wait = new Date().getTime() - write_at
  console.log({ wait, idx, mode: '(api)' })
}
