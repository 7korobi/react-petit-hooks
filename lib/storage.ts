import { createContext, useContext, useState, useEffect } from "react"
import * as _ from "lodash"

interface Storage<T> {
  getItem(key: string): T;
  setItem(key: string, val: T): void;
  removeItem(key: string): void;
}

export class Bits {
  constructor(o: {[key : string]: boolean}, public __dic: string[]) {
    for (const key of __dic) {
      this[key] = !! o[key]
    }
  }
  static by_str(o: string | null, base: Bits) {
    const bits = o ? Number.parseInt(o, 36) : 0
    const oo = {}
    base.__dic.forEach((key, idx)=>{
      oo[key] = !!(bits & 2**idx)
    })
    return new Bits(oo,base.__dic)
  }
  static to_str(o: Bits) {
    return o.__dic.reduce((val, key, idx)=> {
      return o[key] ? val | 2**idx : val 
    }, 0).toString(36)
  }
}

//
// format.
//
function to_String(u, nil: ''): string
function to_String(u, nil: undefined): string | undefined
function to_String(u, nil){ return u ? String(u) : nil }
function to_Number(u): number { return u ? Number(u) : NaN }
function to_Array(u): any[] { return u instanceof Array ? u : u ? Array(u) : [] }
function to_Object(u): object { return u instanceof Object ? u : {} }
function to_Boolean(u): boolean { return !!u && ! ['0', 'false'].includes(u) }

type VALUE = string | number | boolean | Bits
type VALUES = VALUE | VALUE[] | { [key: string]: VALUE }

function to_str<T extends VALUES>(o: T, base: T): string
function to_str(o, base) {
  switch (base.constructor) {
    case String  : return to_String(o, '')
    case Number  : return to_String(o, '')
    case Boolean : return to_String(to_Boolean(o), '')
    case Array   : return JSON.stringify(to_Array(o))
    case Object  : return JSON.stringify(to_Object(o))
    case Bits : return Bits.to_str(o)
  }
}

function by_str<T extends VALUES>(o: string | null, base: T): T
function by_str(o, base) {
    switch (base.constructor) {
    case String  : return to_String(o, undefined)
    case Number  : return to_Number(o)
    case Boolean : return to_Boolean(o)
    case Array   : return JSON.parse(o) || []
    case Object  : return JSON.parse(o) || {}
    case Bits : return Bits.by_str(o, base)
  }
}

function to_url<T extends VALUES>(o: T, base: T): string[]
function to_url(o, base) {
  switch (base.constructor) {
    case String  : return [encodeURIComponent( to_String(o, '') )]
    case Number  : return [to_String(to_Number(o), '')]
    case Boolean : return [to_String(to_Boolean(o), '')]
    case Array   : return to_Array(o).map(encodeURIComponent)
    case Bits : return [Bits.to_str(o)]
  }
}

function by_url<T extends VALUES>(o: string[], base: T): T
function by_url(o, base) {
    switch (base.constructor) {
    case String  : return to_String(decodeURIComponent(o[0]), '')
    case Number  : return to_Number(decodeURIComponent(o[0]))
    case Boolean : return to_Boolean(o[0])
    case Array   : return to_Array(o).map(decodeURIComponent)
    case Bits : return Bits.by_str(o[0], base)
  }
}


//
// data store.
//
const defaults = {}
const dataStore = {}
export const share = {}

function doShare(path: string[]) {
  path.forEach((_key, idx)=>{
    const subPath = path.slice(0,idx)
    const key = subPath.join('.')
    const val = _.get(dataStore, subPath )
    const base = _.get(defaults, subPath )
    share[key].forEach((cb)=>{
      cb(val, base)
    })
  })
}

export function localStore(o) { defineStore<string | null>(window.localStorage, o, to_str, by_str) }
export function sessionStore(o) { defineStore<string | null>(window.sessionStorage, o, to_str, by_str) }
export function pushUrlStore(o) { defineStore<string[]>(new UrlStorage('pushState'), o, to_url, by_url) }
export function replaceUrlStore(o) { defineStore<string[]>(new UrlStorage('replaceState'), o, to_url, by_url) }
function defineStore<P>(storage: Storage<P>, o: Object, to: (o: VALUES, base: VALUES)=> P, by: (o: P, base: VALUES)=> VALUES ) {
  for (const rootPath in o) {
    const val = o[rootPath]
    const item = storage.getItem(rootPath)
    const rootCb = (val) => {
      if (val) {
        storage.setItem(rootPath, to(val, defaults[rootPath]))
      } else {
        storage.removeItem(rootPath)
      }
    }

    defaults[rootPath] = val
    if ( ! share[rootPath] ) {
      share[rootPath] = new Set()
    }
    share[rootPath].add(rootCb)

    if (item) {
      dataStore[rootPath] = by(item, val)
    } else {
      dataStore[rootPath] = val
      rootCb(val)
    }
  }
}

class UrlStorage {
  data: any
  store: () => void

  getItem (key: string): string[] {
    return this.data[key]
  }

  setItem (key: string, val: string[]) {
    if ( val !== this.data[key] ) {
      this.store()
    }
    this.data[key] = val
  }

  removeItem (key: string) {
    if ( this.data[key] ) {
      this.store()
    }
    delete this.data[key]
  }

  constructor (public mode: 'pushState' | 'replaceState') {
    this.sync()
    this.store = _.debounce( this._store.bind(this), 100)
    this.store()
  }

  _store () {
    const [file] = this.data.PATH.slice(-1)
    const hash = this.data.HASH[0] ? `#${this.data.HASH[0]}` : ''
    let search = ""
    for (const key in this.data) {
      switch (key) {
        case 'PATH':
        case 'HASH':
          break;
        default :
          if ( this.data[key].length ) {
            search += `&${ key }=${ this.data[key].join("=") }`
          } else {
            search += `&${ key }`
          }
      }
    }
    if ( search ) {
      search = `?${ search.slice(1) }`
    }
    history[this.mode](null,'',`${file}${search}${hash}`)
    this.sync()
  }

  sync () {
    const data = {
      PATH: window.location.pathname.split(/\/+/).slice(1),
      HASH: [window.location.hash.slice(1)],
    }
    window.location.search.slice(1).split('&').forEach((query)=>{
      const [key, ...vals] = query.split("=")
      if ( ! key ) { return }
      data[key] = vals
    })
    this.data = data
  }
}


export function useStore<T>(path_obj: any): [T, (val: T)=> void ] {
  const path = _.toPath(path_obj)
  const key = path.join('.')
  const setter = (val: T) => {
    _.set(dataStore, path, val)
    doShare(path)
  }
  if ( ! share[key] ) {
    share[key] = new Set()
  }
  const [item, setItem] = useState<T>(_.get(dataStore, path))
  useEffect(()=>{
    share[key].add(setItem)
    return ()=>{
      share[key].delete(setItem)
    }
  }, [key])
  return [item, setter]
}

if (typeof window !== "undefined" && window !== null) {
  window.addEventListener("storage", ({ key, newValue }) => {
    if (!key || !newValue) { return }
    const base = defaults[key]
    if (!base) { return }
    const val = by_str(newValue, base)
    dataStore[key] = val
    doShare([key])
  })
}
