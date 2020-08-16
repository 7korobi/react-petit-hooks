import { useEffect, useState } from 'react'
import React from 'react'

import { SIZE, POINT } from './util'

type ResizeCall = (size: SIZE, e: ObserverEvent) => void
type AnimationInit = {
  animation?: boolean
}

type IntersectionCall = (
  isIn: boolean,
  ratio: number,
  rect: DOMRectReadOnly,
  e: ObserverEvent,
  anime?: AnimationEvent
) => void

type ElementRef = React.MutableRefObject<Element>

interface ObserverEvent {
  target: Element
}

class AnimationEvent {
  target!: Element
  map: Map<Element, [IntersectionCall, boolean, number, DOMRectReadOnly, ObserverEvent]>

  base = document.scrollingElement!
  scroll: POINT = [0, 0]
  diff: POINT = [0, 0]
  stays: number
  at: number
  timespan: number
  hold: boolean

  static instance = new AnimationEvent()

  constructor() {
    const { scrollLeft, scrollTop } = this.base
    this.scroll = [scrollLeft, scrollTop]
    this.diff = [0, 0]
    this.stays = 0
    this.at = new Date().getTime()
    this.timespan = 0
    this.hold = false

    this.map = new Map()
    this.capture(this.base)
    this.roop = this.roop.bind(this)
    this.roop()
  }

  capture(by: Element) {
    by.addEventListener('thouchstart', () => {
      this.hold = true
    })
    by.addEventListener('touchend', () => {
      this.hold = false
    })
  }

  private roop() {
    this.update()
    for (const [el, [cb, isIn, ratio, rect, e]] of this.map) {
      this.target = el
      cb(isIn, ratio, rect, e, this)
    }
    requestAnimationFrame(this.roop)
  }
  private update() {
    const { scrollLeft, scrollTop } = this.base
    const diffX = scrollLeft - this.scroll[0]
    const diffY = scrollTop - this.scroll[1]
    const at = new Date().getTime()
    const timespan = at - this.at

    if (diffX || diffY) {
      this.stays = 0
    } else {
      this.stays += timespan
    }

    this.scroll = [scrollLeft, scrollTop]
    this.diff = [diffX, diffY]
    this.at = at
    this.timespan = timespan
  }

  scrollBy(left: number, top: number) {
    if (!left && !top) {
      return
    }
    this.base.scrollLeft += left
    this.base.scrollTop += top
    const { scrollLeft, scrollTop } = this.base
    this.scroll = [scrollLeft, scrollTop]
    this.diff[0] += left
    this.diff[1] += top
  }
}

export function useResizeObserver(cb: ResizeCall): [typeof useObservee] {
  const [[map, observer, use_observee], reset] = useState<
    [Map<Element, ObserverEvent>, ResizeObserver, typeof useObservee]
  >([] as any)
  useEffect(init, [cb])

  return [use_observee]

  function init() {
    const map = new Map<Element, ObserverEvent>()
    const resize = new ResizeObserver(bare)
    reset([map, resize, useObservee])
    return () => {
      observer.disconnect()
    }
  }

  function useObservee(
    divRef: ElementRef,
    option: ResizeObserverOptions = {},
    constructor = defaultCreateEvent
  ): [ObserverEvent] {
    const [[e], reset] = useState<[ObserverEvent]>([] as any)
    const el = divRef.current

    useEffect(init, [observer, el])

    return [e]

    function init() {
      const { box } = option
      if (el) {
        const e = constructor(el)
        map.set(el, e)
        observer.observe(el, { box })
        reset([e])
        return () => {
          map.delete(el)
          observer.unobserve(el)
        }
      }
      return
    }
  }

  function bare(entries: readonly ResizeObserverEntry[]) {
    const list: ResizeObserverEntry[] = entries as any
    list.forEach(({ target, contentRect, borderBoxSize }) => {
      let size: ResizeObserverSize | null = null
      let width: number
      let height: number
      if (borderBoxSize) {
        const _size: ResizeObserverSize = (borderBoxSize as any)[0]
        size = _size ? _size : borderBoxSize
      }
      if (size) {
        width = size.inlineSize
        height = size.blockSize
      } else {
        ;({ width, height } = contentRect)
      }
      const e = map.get(target)!
      cb([width, height], e)
    })
  }
}

export function useIntersectionObserver(
  cb: IntersectionCall,
  option: IntersectionObserverInit & AnimationInit
): [typeof useObservee] {
  const [[map, observer, use_observee], reset] = useState<
    [Map<Element, ObserverEvent>, IntersectionObserver, typeof useObservee]
  >([] as any)
  const { root, rootMargin, threshold, animation } = option

  useEffect(init, [cb, root, rootMargin, threshold])

  return [use_observee]

  function init() {
    const map = new Map<Element, ObserverEvent>()
    const observer = new IntersectionObserver(bare, { root, rootMargin, threshold })
    reset([map, observer, useObservee])
    return () => {
      observer.disconnect()
    }
  }

  function useObservee(divRef: ElementRef, constructor = defaultCreateEvent): [ObserverEvent] {
    const [[e], reset] = useState<[ObserverEvent]>([] as any)
    const el = divRef.current

    useEffect(init, [el, observer])

    return [e]

    function init() {
      if (el) {
        const e = constructor(el)
        map.set(el, e)
        observer.observe(el)
        reset([e])
        return () => {
          map.delete(el)
          observer.unobserve(el)
        }
      }
      return
    }
  }

  function bare(entries: readonly IntersectionObserverEntry[]) {
    if (animation) {
      entries.forEach(({ target, isIntersecting, intersectionRatio, intersectionRect }) => {
        const e = map.get(target)!
        AnimationEvent.instance.map.set(target, [
          cb,
          isIntersecting,
          intersectionRatio,
          intersectionRect,
          e,
        ])
      })
    } else {
      entries.forEach(({ target, isIntersecting, intersectionRatio, intersectionRect }) => {
        const e = map.get(target)!
        cb(isIntersecting, intersectionRatio, intersectionRect, e)
      })
    }
  }
}

export const easingExp4 = easingExponent(4)
export const easingExp3 = easingExponent(3)
export const easingExp2 = easingExponent(2)
export const easingPlain = easingExponent(1)

function defaultCreateEvent(target: Element) {
  return { target }
}

function easingExponent(mode: 0 | 1 | 2 | 3 | 4 | 5) {
  const size = [1, 120, 80, 50, 25, 20][mode]
  return new Array(size + 1).fill(0).map((_0, idx) => idx ** mode / size ** mode)
}
