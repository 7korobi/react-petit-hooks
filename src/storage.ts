import { useState, useEffect } from 'react'

import { BitsData } from './bits'
import { __BROWSER__ } from './device'

export function useLocalStorage<T>(key: string, base: T) {
  return useStorage('localStorage', key, base)
}

export function useSessionStorage<T>(key: string, base: T) {
  return useStorage('localStorage', key, base)
}

function to_String(u: any, nil: ''): string
function to_String(u: any, nil: undefined): string | undefined
function to_String(u: any, nil: undefined | '') {
  return u ? String(u) : nil
}
function to_Number(u: any): number {
  return u ? Number(u) : 0 === u ? 0 : NaN
}
function to_Array(u: any): any[] {
  return u instanceof Array ? u : u ? Array(u) : []
}
function to_Object(u: any): object {
  return u instanceof Object ? u : {}
}
function to_Boolean(u: any): boolean {
  return !!u && !['0', 'false'].includes(u)
}

function to_str(o: any, base: any): string {
  if ('string' === typeof base) {
    return to_String(o, '')
  }
  if ('number' === typeof base) {
    return to_String(o, '')
  }
  if ('boolean' === typeof base) {
    return to_String(to_Boolean(o), '')
  }
  if (base instanceof BitsData) {
    return base.field.to_str(o as any)
  }
  if (base instanceof Array) {
    return JSON.stringify(to_Array(o).map((arg, idx) => to_str(arg, base[idx] || base[0])))
  }
  if (base instanceof Object) {
    const val: { [key: string]: any } = Object.assign({}, to_Object(o))
    for (const key in base) {
      val[key] = to_str(val[key], base[key])
    }
    return JSON.stringify(val)
  }
  throw new Error(`bad data. ${o} ${base}`)
}

function by_str(o: string | null | undefined, base: any): any {
  if (undefined === o) {
    return base
  }
  if ('string' === typeof base) {
    return to_String(o, undefined)
  }
  if ('number' === typeof base) {
    return to_Number(o)
  }
  if ('boolean' === typeof base) {
    return to_Boolean(o)
  }
  if (base instanceof BitsData) {
    return base.field.by_str(o as any)
  }
  if (base instanceof Array) {
    return ((o ? JSON.parse(o) || [] : []) as string[]).map((arg, idx) =>
      by_str(arg, base[idx] || base[0])
    )
  }
  if (base instanceof Object) {
    const val: { [key: string]: any } = o ? JSON.parse(o) || {} : {}
    for (const key in base) {
      val[key] = by_str(val[key], base[key])
    }
    return val
  }
  throw new Error(`bad data. ${o} ${base}`)
}

function useStorage<T>(
  storage: 'localStorage' | 'sessionStorage',
  key: string,
  base: T
): [T, (data: T) => void] {
  const [data, setData] = useState(base)
  useEffect(init, [])
  useEffect(refresh, [data])

  return [data, setData]

  function init() {
    const data = by_str(window[storage].getItem(key) || undefined, base)
    __BROWSER__ && setData(data)

    if ('sessionStorage' === storage) {
      return
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }
  function refresh() {
    __BROWSER__ && window[storage].setItem(key, to_str(data, base))
  }
  function onStorage(e: StorageEvent) {
    if (e.key !== key) {
      return
    }
    const data = by_str(e.newValue, base)
    setData(data)

    if (e.oldValue === null && e.newValue !== null) {
      console.log('type : add')
    } else if (e.oldValue !== null && e.newValue === null) {
      console.log('type : remove')
    } else if (e.oldValue !== null && e.newValue !== null) {
      console.log('type : update')
    } else if (e.oldValue === null && e.newValue === null && e.storageArea!.length === 0) {
      console.log('type : clear')
    }
  }
}

function getUrl() {
  return new URL(__BROWSER__ ? location.href : 'https://localhost/')
}

function getUrlData(): [URL, { [key: string]: string[] }, string[]] {
  const url = getUrl()
  const urlHash = url.hash.slice(1).split('=').map(decodeURIComponent)
  const urlSearch = {}
  for (const str of url.search.slice(1).split('&')) {
    if (!str) {
      continue
    }
    const [key, ...val] = str.split('=').map(decodeURIComponent)
    if (!urlSearch[key]) {
      urlSearch[key] = []
    }
    urlSearch[key].push(...val)
  }
  return [url, urlSearch, urlHash]
}

function to_url(o: any, base: any): string[] {
  if ('string' === typeof base) {
    return [to_String(o, '')]
  }
  if ('number' === typeof base) {
    return [to_String(to_Number(o), '')]
  }
  if ('boolean' === typeof base) {
    return [to_String(to_Boolean(o), '')]
  }
  if (base instanceof BitsData) {
    return [base.field.to_str(o as any)]
  }
  if (base instanceof Array) {
    return to_Array(o).map((arg, idx) => to_url(arg, base[idx] || base[0])[0])
  }
  throw new Error(`bad data. ${o} ${base}`)
}

function by_url(args: string[], base: any): any {
  if (!args.length) {
    return base
  }
  if ('string' === typeof base) {
    return to_String(args[0], '')
  }
  if ('number' === typeof base) {
    return to_Number(args[0])
  }
  if ('boolean' === typeof base) {
    return to_Boolean(args[0])
  }
  if (base instanceof BitsData) {
    return base.field.by_str(args[0] as any)
  }
  if (base instanceof Array) {
    return args.map((arg, idx) => by_url([arg], base[idx] || base[0]))
  }
  throw new Error(`bad data. ${args} ${base}`)
}

export function useUrlState<Q, H>(
  mode: 'pushState' | 'replaceState',
  search: Q,
  hash?: H
): [[Q] | [Q, H], (data: [Q] | [Q, H]) => void] {
  const [data, setData] = useState<[Q] | [Q, H]>(hash ? [search, hash] : [search])
  useEffect(init, [])

  return [data, setUrl]

  function init() {
    onChange()
    window.addEventListener('popstate', popup)
    return () => {
      window.removeEventListener('popstate', popup)
    }
  }

  function onChange() {
    const [url, urlSearch, urlHash] = getUrlData()
    const hashVal = capture(urlHash, hash)
    const searchVal: Q = {} as Q
    for (const key in search) {
      searchVal[key] = capture(urlSearch[key], search[key])
    }
    setData([searchVal, hashVal])
  }

  function capture(data, base) {
    if (data) {
      if (data[0].length) {
        return by_url(data, base)
      }
    }
    return by_url([], base)
  }

  function popup(e: PopStateEvent) {
    console.log(e, e.state)
    onChange()
  }

  function setUrl(data: [Q] | [Q, H]): void {
    let [url, urlSearch, urlHash] = getUrlData()

    if (data[1]) {
      url.hash = to_url(data[1], hash).map(encodeURIComponent).join('=')
    }

    for (const key in data[0]) {
      urlSearch[key] = to_url(data[0][key], search[key])
    }

    const searchStrings: string[] = []
    for (const key in urlSearch) {
      searchStrings.push(
        `${encodeURIComponent(key)}=${urlSearch[key].map(encodeURIComponent).join('=')}`
      )
    }
    url.search = searchStrings.join('&')

    __BROWSER__ && history[mode](data, '', url.href)
    onChange()
  }
}
