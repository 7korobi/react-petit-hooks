import { useEffect, useState, useRef } from 'react'
import React from 'react'

import { useInternet, internetOnline } from './browser'
import { useResizeObserver } from './observer'
import { SIZE } from './util'
import { url } from 'inspector'

type DownloaderManager<T> = {
  history: T[]
  downloading?: Promise<void>
  onOnline?(): void
}

type DownloaderEvent = {
  idx: number
  url: string
  isError: boolean
  isLoaded: boolean
  isExpress: boolean
  imageEl?: HTMLImageElement
  iframeEl?: HTMLIFrameElement
  fetchAPI?(res: Response): Promise<any>
  fetchInit?: RequestInit
}

const GetInit = {
  method: 'GET',
  mode: 'cors',
  redirect: 'follow',
  cache: 'no-cache',
  credentials: 'include',
  referrer: 'no-referrer',
  headers: [['Accept', 'application/json']],
} as RequestInit

export function useDownloader<T extends DownloaderEvent>(attention: number) {
  const manager = useRef<DownloaderManager<T>>({ history: [] })
  const [e, setEvent] = useState<T>({} as T)

  useEffect(() => {}, [])

  return [e, history, onStart]

  function onStart() {
    if (manager.current.downloading) {
      manager.current.downloading.then(nextSequence)
    } else {
      nextSequence()
    }
  }

  function nextSequence() {
    const top: T[] = []
    const back: T[] = []
    const after: T[] = []
    const before: T[] = []
    let cursor: T[] = after
    manager.current.history.forEach((e, idx) => {
      e.idx = idx
      if (attention < e.idx) {
        cursor = e.isExpress ? back : before
      } else {
        cursor = e.isExpress ? top : after
      }
      if (!e.isLoaded && !e.isError) {
        cursor.push(e)
      }
    })
    const e = [...top, ...back.reverse(), ...after, ...before.reverse()][0]

    if (e) {
      manager.current.downloading = sequence(e).catch(() => {
        if (e.imageEl) {
          e.imageEl.src = ''
        }
        if (window.navigator.onLine) {
          e.isError = true
          setEvent(e)
          nextSequence()
        } else {
          manager.current.downloading = sequence(e)
        }
      })
    } else {
      manager.current.downloading = undefined
    }
  }

  async function sequence(e: T) {
    await internetOnline()
    await download(e)
    e.isLoaded = true

    setEvent(e)
    nextSequence()
    /*
    if (e.iframeEl) {
      const doc = e.iframeEl.contentDocument
      if (doc) {
        const body = doc.body
        const [e] = useResizeObservee({ current: body }, {box: 'border-box'}, (target: Element)=>{
          return { target }
        })
      }
    }
     */
  }

  function download({ imageEl, iframeEl, fetchAPI }: T): Promise<Event | void> {
    return new Promise((ok, ng) => {
      if (fetchAPI) {
        e.fetchInit || (e.fetchInit = GetInit)
        fetch(e.url, e.fetchInit).then(fetchAPI).then(ok).catch(ng)
        return
      }
      let el: HTMLImageElement | HTMLIFrameElement | undefined = imageEl || iframeEl
      if (el) {
        el.addEventListener('error', ng)
        el.addEventListener('load', success)
        el.src = e.url
      } else {
        ng()
      }

      function success() {
        el!.removeEventListener('error', ng)
        el!.removeEventListener('load', success)
        ok()
      }
    })
  }
}
