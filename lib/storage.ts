import { createContext, useContext, useState, useEffect } from "react"
import * as _ from "lodash"

type UrlData = {
  PATH: string[]
  HASH: [string]
  BASIC_AUTH: [string, string]
  [key: string]: string[]
}
interface Storage<T> {
  getItem(label: string): T;
  setItem(label: string, val: T): void;
  removeItem(label: string): void;
}

const BITLIMIT = 31
const BITMASK = 2**31-1
export class Bits {
  static by_str(o: string, base: any) {
    const bits = [null, undefined, "undefined"].includes(o) ? 0 : Number.parseInt(o, 36)
    return base._.copy(bits)
  }
  static to_str(o: any) {
    return o.bits.toString(36)
  }

  static min(x: number){ return x & (-x) }

  static assign<L extends string>(labels: readonly L[] ) {
    if (BITLIMIT < labels.length) { throw new Error("too much bits.") }

    class BitsProcess {
      labels: readonly L[] = labels

      constructor (public target: BitsBox) {}
      copy(x = this.target.bits): BitsBox {
        return new BitsBox(x) 
      }
      calc(cb: (x:number) => number){
        const x = this.target.bits
        return this.copy(cb(x))
      }
      get labels_off(){ return BitsProcess.get_labels(BITMASK - this.target.bits) }
      get labels_on(){ return BitsProcess.get_labels(this.target.bits) }

      static get_labels(x){
        let count = labels.length
        let idx = 0
        const res: L[] = []
        do {
          if (x & 1 && labels[idx]) {
            res.push(labels[idx]) 
          }
          x >>>= 1
          ++idx
        } while( --count )
        return res.reverse()
      }
    }
    
    class BitsBox extends Bits {
      _: BitsProcess
      constructor(public bits: number) {
        super()
        this._ = new BitsProcess(this)
      }
      static all = new BitsBox(BITMASK)
      static zero = new BitsBox(0)
      static by(labels: L[]): BitsBox {
        const o: any = new BitsBox(0)
        labels.forEach((label)=>{
          o[label] = true
        })
        return o
      }
    }

    labels.forEach((label, idx)=>{
      const bit = 2**idx
      const mask = BITMASK - bit
      Object.defineProperty(BitsBox.prototype, label,{
        enumerable: true,
        get: function (this: BitsBox): boolean { return Boolean(this.bits & bit) },
        set: function (this: BitsBox, b: boolean ){
          this.bits = this.bits & mask | (bit * Number(to_Boolean(b))) 
        }
      })
    })
    return BitsBox
  }
}

//
// format.
//
function to_String(u: any, nil: ''): string
function to_String(u: any, nil: undefined): string | undefined
function to_String(u: any, nil){ return u ? String(u) : nil }
function to_Number(u: any): number { return u ? Number(u) : NaN }
function to_Array(u: any): any[] { return u instanceof Array ? u : u ? Array(u) : [] }
function to_Object(u: any): object { return u instanceof Object ? u : {} }
function to_Boolean(u: any): boolean { return !!u && ! ['0', 'false'].includes(u) }

type VALUE = string | number | boolean | Bits
type VALUE_SET = VALUE | VALUE[]
type VALUE_SETS = {[key: string]: VALUE_SET }
type VALUE_TREE = VALUE_SET | VALUE_TREES
type VALUE_TREES = {[key: string]: VALUE_TREE }

function to_str<T extends VALUE_TREE>(o: T, base: T): string
function to_str(o, base) {
  switch (base.constructor) {
    case String  : return to_String(o, '')
    case Number  : return to_String(o, '')
    case Boolean : return to_String(to_Boolean(o), '')
  }
  if ( base instanceof Bits ) { return Bits.to_str(o) }
  if ( base instanceof Array ) { return JSON.stringify(to_Array(o)) }
  return JSON.stringify(to_Object(o))
}

function by_str<T extends VALUE_TREE>(o: string | null, base: T): T
function by_str(o, base) {
    switch (base.constructor) {
    case String  : return to_String(o, undefined)
    case Number  : return to_Number(o)
    case Boolean : return to_Boolean(o)
  }
  if ( base instanceof Bits ) { return Bits.by_str(o, base) }
  if ( base instanceof Array ) { return JSON.parse(o) || [] }
  return JSON.parse(o) || {}
}

function to_url<T extends VALUE_SET>(o: T, base: T): string[]
function to_url(o, base) {
  switch (base.constructor) {
    case String  : return [encodeURIComponent( to_String(o, '') )]
    case Number  : return [to_String(to_Number(o), '')]
    case Boolean : return [to_String(to_Boolean(o), '')]
  }
  if ( base instanceof Bits ) { return [Bits.to_str(o)] }
  if ( base instanceof Array ) { return to_Array(o).map(encodeURIComponent) }
}

function by_url<T extends VALUE_SET>(o: string[], base: T): T
function by_url(o, base) {
    switch (base.constructor) {
    case String  : return to_String(decodeURIComponent(o[0]), '')
    case Number  : return to_Number(decodeURIComponent(o[0]))
    case Boolean : return to_Boolean(o[0])
  }
  if ( base instanceof Bits ) { return Bits.by_str(o[0], base) }
  if ( base instanceof Array ) { return to_Array(o).map(decodeURIComponent) }
}


//
// data store.
//
const defaults = {}
const dataStore = {}
const share = {}
export const debug = { share, dataStore, defaults }

function doShare(path: string[], tail, val, base) {
  const key = path.join('.')
  if (! share[key] ) { return }
  share[key].forEach((cb) => {
    cb(val, base)
  })
  // console.warn( path, tail, share[key].length )
}

function doSharesDown(path: string[], tail, val, base) {
  if ( base instanceof Object ) {
    Object.keys(val).forEach((key)=>{
      if ( tail === key ) { return }
      if ('_' === key[0]) { return }
      const extPath = [...path, key]
      const base = _.get(defaults, extPath)
      const val = _.get(dataStore, extPath)
      doSharesDown(extPath, undefined, val, base)
    })
  }
  doShare(path, tail, val, base)
}

function doSharesUp(path: string[]) {
  let idx = path.length
  do {
    const tail = path[idx]
    const subPath = path.slice(0, idx)
    const base = _.get(defaults, subPath)
    const val = _.get(dataStore, subPath)
    doSharesDown(subPath, tail, val, base)
  } while (--idx)
}

export function pushState(o: VALUE_SETS) { defineUrlStore(pushStateStorage, o) }
export function replaceState(o: VALUE_SETS) { defineUrlStore(replaceStateStorage, o) }
function defineUrlStore(store: UrlStorage, o: VALUE_SETS){
  defineStore<VALUE_SET,VALUE_SETS,string[]>(store, o, to_url, by_url)
  store.reset(o)
}
export function localStore(o) { defineStore<VALUE_TREE,VALUE_TREES,string | null>(LocalStorage, o, to_str, by_str) }
export function sessionStore(o) { defineStore<VALUE_TREE,VALUE_TREES,string | null>(SessionStorage, o, to_str, by_str) }
function defineStore<T,TT,P>(storage: Storage<P>, o: TT, to: (o: T, base: T) => P, by: (o: P, base: T) => T) {
  Object.keys(o).forEach((rootPath)=>{
    const val = o[rootPath]
    const item = storage.getItem(rootPath)
    const rootCb = _.debounce((val) => {
      if (val) {
        storage.setItem(rootPath, to(val, defaults[rootPath]))
      } else {
        storage.removeItem(rootPath)
      }
    }, 100);

    defaults[rootPath] = val
    if (!share[rootPath]) {
      share[rootPath] = new Set()
    }
    share[rootPath].add(rootCb)

    if (item) {
      dataStore[rootPath] = by(item, val)
    } else {
      dataStore[rootPath] = val
      rootCb(val)
    }
  })
}

class UrlStorage {
  rootPaths: string[]
  data: UrlData

  getItem(key: string): string[] {
    return this.data[key]
  }

  setItem(key: string, val: string[]) {
    if (val !== this.data[key]) {
      this.data[key] = val
      this.store()
    } else {
      this.data[key] = val
    }
  }

  removeItem(key: string) {
    if (this.data[key]) {
      delete this.data[key]
      this.store()
    } else {
      delete this.data[key]
    }
  }

  constructor(public mode: 'pushState' | 'replaceState') {
    this.rootPaths = []
    this.data = {PATH:[""], HASH:[""], BASIC_AUTH: ["", ""]}
  }

  reset(defs: VALUE_SETS){
    this.rootPaths.forEach((rootPath)=>{
      rootPath
    })
    this.rootPaths = Object.keys(defs)
    this.data = UrlStorage.parse()
    this.store('replaceState')
  }

  store(mode: 'pushState' | 'replaceState' = this.mode) {
    const href = UrlStorage.stringify(this.data)
    history[mode](this.data, '', href)
  }


  static parse(href = BaseUrl(), base = BaseUrl()): UrlData {
    const { hash, search, pathname, username, password, protocol, host, hostname } = new URL(href, base)
    const data: UrlData = {
      PATH: pathname.split(/\/+/).slice(1),
      HASH: [hash.slice(1)],
      BASIC_AUTH: [username, password],
    }
    search.slice(1).split('&').forEach((query) => {
      const [key, ...vals] = query.split("=")
      if (!key) { return }
      data[key] = vals
    })
    return data
  }

  static stringify(data: UrlData, base = BaseUrl()): string {
    const hash = data.HASH[0] ? `#${data.HASH[0]}` : ''
    let search = ""
    for (const key in data) {
      switch (key) {
        case 'PATH':
        case 'HASH':
        case 'BASIC_AUTH':
          break;
        default:
          if (data[key].length) {
            search += `&${key}=${data[key].join("=")}`
          } else {
            search += `&${key}`
          }
      }
    }
    if (search) {
      search = `?${search.slice(1)}`
    }
    return new URL(`${search}${hash}`, base).href
  }
}
export const pushStateStorage = new UrlStorage('pushState')
export const replaceStateStorage = new UrlStorage('replaceState')


export function useStore<T>(path_obj: any): [T, (val: T) => void] {
  const path = _.toPath(path_obj)
  const key = path.join('.')
  const setter = (val: T) => {
    _.set(dataStore, path, val)
    doSharesUp(path)
  }
  if (!share[key]) {
    share[key] = new Set()
  }
  const [item, setItem] = useState<T>(_.get(dataStore, path))
  useEffect(() => {
    share[key].add(setItem)
    return () => {
      share[key].delete(setItem)
    }
  }, [key])
  return [item, setter]
}

let BaseUrl: ()=> string
let LocalStorage : Storage<string | null>
let SessionStorage : Storage<string | null>

if (typeof window !== "undefined") {
  BaseUrl = () => window.location.href
  LocalStorage = window.localStorage
  SessionStorage = window.sessionStorage
  window.addEventListener('popstate', (e) => {
    const data = UrlStorage.parse()

    console.warn(e)
  })
  window.addEventListener("storage", ({ key, newValue }) => {
    if (!key || !newValue) { return }
    const base = defaults[key]
    if (!base) { return }
    const val = by_str(newValue, base)
    dataStore[key] = val
    doSharesUp([key])
  })

} else {
  BaseUrl = () => "https://localhost/"
  const dummyStorage : Storage<string | null> = {
    getItem(label) { return '' },
    setItem(label) {},
    removeItem(label) {}
  }
  LocalStorage = SessionStorage = dummyStorage
}
