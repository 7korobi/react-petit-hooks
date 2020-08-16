import { useState, useEffect } from 'react'
import { BitsData } from './bits'
import { __BROWSER__ } from './device'

export function useLocalStorage<T>(key: string, base: T) {
  return useStorage('localStorage', key, base)
}

export function useSessionStorage<T>(key: string, base: T) {
  return useStorage('localStorage', key, base)
}

export function usePushState<T>(base: T) {
  return useUrlState('pushState', base)
}

export function useReplaceState<T>(base: T) {
  return useUrlState('replaceState', base)
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

  return [data, refresh]

  function init() {
    const data = by_str(window[storage].getItem(key) || undefined, base)
    __BROWSER__ && setData(data)
  }
  function refresh(data: T): void {
    __BROWSER__ && window[storage].setItem(key, to_str(data, base))
    setData(data)
  }
}

function getUrl() {
  return new URL(__BROWSER__ ? location.href : 'https://localhost/')
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

function useUrlState<T>(mode: 'pushState' | 'replaceState', base: T): [T, (data: T) => void] {
  const [data, setData] = useState(base)
  useEffect(init, [])

  return [data, refresh]

  function init() {
    onChange()
    window.addEventListener('popstate', popup)
    return () => {
      window.removeEventListener('popstate', popup)
    }
  }

  function onChange() {
    const url = getUrl()
    const urlData: { [key: string]: string[] } = {
      HASH: url.hash.slice(1).split('=').map(decodeURIComponent),
    }
    const val: any = {}
    for (const [key, val] of url.searchParams) {
      if (!urlData[key]) {
        urlData[key] = []
      }
      urlData[key].push(val)
    }
    for (const key in base) {
      const ary = urlData[key] && urlData[key][0].length ? urlData[key].join('=').split('=') : []
      val[key] = by_url(ary, (base as any)[key])
    }
    setData(val)
  }
  function popup(e: PopStateEvent) {
    console.log(e, e.state)
    onChange()
  }
  function refresh(data: T): void {
    const url = getUrl()
    const search: string[] = []
    for (const key in base) {
      const texts = to_url((data as any)[key], (base as any)[key])
      search.push(`${key}=${texts.map(encodeURIComponent).join('=')}`)
    }
    url.search = search.join('&')
    if ((base as any).HASH) {
      url.hash = to_url((data as any).HASH, (base as any).HASH).join('=')
    }
    __BROWSER__ && history[mode](data, '', url.href)
    setData(data)
  }
}
