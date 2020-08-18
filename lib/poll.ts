import { useState, useEffect } from 'react'
import Dexie from 'dexie'

import { to_tempo, Tempo } from './time'
import { useMenu } from './browser'

import { __BROWSER__ } from './device'

type DATA = { idx: string; pack: any }
type META = { idx: string; version: string; next_at: number }

class PollWeb extends Dexie {
  meta!: Dexie.Table<META, string>
  data!: Dexie.Table<DATA, string>
}

let dexie: PollWeb = null as any
if (__BROWSER__) {
  dexie = new Dexie('poll-web') as PollWeb
  dexie.version(1).stores({
    meta: '&idx',
    data: '&idx',
  })
  console.log(Dexie.dependencies, dexie, dexie.meta, dexie.data)
}

export function usePoll<T>(
  api: (...args: any[]) => Promise<T>,
  initState: T,
  timestr: string,
  version: string,
  args: any[] = []
): [T] {
  const [list, setList] = useState(initState)
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
  return [list]

  async function roop() {
    tempo = tempo.reset()
    try {
      if (tempo.write_at < next_at) {
        get_pass(idx, tempo)
      } else {
        // IndexedDB metadata not use if memory has past data,
        const meta_next_at = await chk_meta(idx, version, next_at)
        if (tempo.write_at < meta_next_at) {
          await get_by_lf(idx, tempo, setList)
        } else if (-Infinity < meta_next_at) {
          await get_by_lf(idx, tempo, setList)
          const pack = await api(...args)
          await get_by_api(idx, tempo, setList, pack)
        } else {
          const pack = await api(...args)
          await get_by_api(idx, tempo, setList, pack)
          dexie.meta.put({ idx, version, next_at })
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

async function get_by_lf<T>(idx: string, { write_at }: Tempo, setList: (data: T) => void) {
  if (dexie) {
    const data = await dexie.data.get(idx)
    if (data) {
      // Mem.State.store(meta)
      setList(data.pack)
    }
  }
  const wait = new Date().getTime() - write_at
  console.log({ wait, idx, mode: '(lf)' })
}

async function get_by_api<T>(
  idx: string,
  { write_at }: Tempo,
  setList: (data: T) => void,
  pack: any
) {
  if (dexie) {
    // TODO: data to meta api.
    // meta = Mem.State.transaction(()=> cb(data),{})
    const data: DATA = { idx, pack }
    await dexie.data.put(data)
    setList(data.pack)
  }
  const wait = new Date().getTime() - write_at
  console.log({ wait, idx, mode: '(api)' })
}
