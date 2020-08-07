import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import Dexie from 'dexie'

import { to_tempo } from './time'
import { useInternet, useVisible } from './browser'

type DIC<T> = { [idx: string]: T }
type API<T> = (...args: any[]) => Promise<T>

const roops: DIC<() => Promise<void>> = {}
const timers: DIC<NodeJS.Timeout> = {}
const is_cache: DIC<number> = {}

const dexie = new Dexie('poll-web')
dexie.version(1).stores({
  meta: '&idx',
  data: '&idx',
})

export function usePoll<T>(
  api: API<T>,
  initState: T,
  timestr: string,
  version: string,
  args: any[] = []
): [T, Dispatch<SetStateAction<T>>] {
  const [list, setList] = useState(initState)

  const [is_online] = useInternet()
  const [is_visible] = useVisible()

  const is_active = is_online && is_visible
  const idx = [api.name, ...args].join('&')
  let tempo = to_tempo(timestr)

  useEffect(() => {
    if (is_active) {
      Object.values(roops).forEach((roop) => roop())
    } else {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [is_active])

  useEffect(() => {
    roops[idx] = roop
    const p = roop()
    return () => {
      clearTimeout(timers[idx])
      delete roops[idx]
      delete timers[idx]
    }
  }, [])
  return [list, setList]

  async function roop() {
    let meta: { idx: string; version: string; next_at: number } | null = null
    let data: { idx: string; pack: any } | null = null
    tempo = tempo.reset()
    const { timeout, write_at, next_at } = tempo
    try {
      if (write_at < is_cache[idx]) {
        get_pass()
      } else {
        // IndexedDB metadata not use if memory has past data,
        if (!(0 < is_cache[idx])) {
          meta = await dexie.table('meta').get(idx)
          if (meta!?.version !== version) {
            meta = null
          }
        }
        if (write_at < meta!?.next_at) {
          await get_by_lf()
        } else if (0 < meta!?.next_at) {
          await get_by_lf()
          await get_by_api()
        } else {
          await get_by_api()
          dexie.table('meta').put({ idx, version, next_at })
        }
      }
      is_cache[idx] = next_at
    } catch (e) {
      console.error(e)
    }
    if (timeout < 0x7fffffff) {
      // 25days
      timers[idx] = (setTimeout(roop, timeout) as unknown) as NodeJS.Timeout
    }

    async function get_pass() {
      console.log({ wait: new Date().getTime() - write_at, idx, mode: null })
    }
    async function get_by_lf() {
      data = await dexie.table('data').get(idx)
      // Mem.State.store(meta)
      setList(data!?.pack)
      console.log({ wait: new Date().getTime() - write_at, idx, mode: '(lf)' })
    }
    async function get_by_api() {
      const pack = await api(...args)
      // TODO: data to meta api.
      // meta = Mem.State.transaction(()=> cb(data),{})
      data = { idx, pack }
      await dexie.table('data').put(data)
      setList(data!?.pack)
      console.log({
        wait: new Date().getTime() - write_at,
        idx,
        mode: '(api)',
      })
    }
  }
}
