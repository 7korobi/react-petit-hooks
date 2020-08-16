import { useRef, useEffect, useState } from 'react'
import React from 'react'

import { SIZE, POINT, OFFSET } from './util'

type ResizeCall = (size: SIZE, e: ResizeEvent) => void
type AnimationInit = {
  animation?: boolean
}

type IntersectionCall = (
  isIn: boolean,
  ratio: number,
  rect: DOMRectReadOnly,
  e: IntersectionEvent,
  anime?: AnimationEvent
) => void

type ElementRef = React.MutableRefObject<Element>
type UseObserverResult = [(divRef: ElementRef) => UseObserveeResult]
type UseObserveeResult = [IntersectionEvent | ResizeEvent]

const easingExp4 = easingExponent(4)

class ResizeEvent {
  target!: Element
}

class IntersectionEvent {
  target!: Element
}

class AnimationEvent {
  target!: Element
  map: Map<Element, [IntersectionCall, boolean, number, DOMRectReadOnly, IntersectionEvent]>

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

export function useScrollCheck(
  root: Element | undefined,
  rootMargin = '0%',
  threshold = easingExp4
) {
  return useIntersectionObserver(intersection, { rootMargin, threshold })
  function intersection(
    isIn: boolean,
    ratio: number,
    rect: DOMRectReadOnly,
    e: IntersectionEvent
  ) {}
}

export function useResizeObserver(cb: ResizeCall): UseObserverResult {
  const [[map, observer, use_observee], reset] = useState<
    [Map<Element, ResizeEvent>, ResizeObserver, typeof useObservee]
  >([] as any)
  useEffect(init, [cb])

  return [use_observee]

  function init() {
    const map = new Map<Element, ResizeEvent>()
    const resize = new ResizeObserver(bare)
    reset([map, resize, useObservee])
    return () => {
      observer.disconnect()
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

  function useObservee(divRef: ElementRef, options?: ResizeObserverOptions): [ResizeEvent] {
    const [[e], reset] = useState<[ResizeEvent]>([] as any)
    const el = divRef.current

    useEffect(init, [observer, el])

    return [e]

    function init() {
      if (el) {
        const e = new ResizeEvent()
        e.target = el
        map.set(el, e)
        observer.observe(el, options)
        reset([e])
        return () => {
          map.delete(el)
          observer.unobserve(el)
        }
      }
      return
    }
  }
}

export function useIntersectionObserver(
  cb: IntersectionCall,
  option: IntersectionObserverInit & AnimationInit
): UseObserverResult {
  const [[map, observer, use_observee], reset] = useState<
    [Map<Element, IntersectionEvent>, IntersectionObserver, typeof useObservee]
  >([] as any)
  useEffect(init, [cb, option.root, option.rootMargin, option.threshold])

  return [use_observee]

  function init() {
    const map = new Map<Element, IntersectionEvent>()
    const observer = new IntersectionObserver(bare, option)
    reset([map, observer, useObservee])
    return () => {
      observer.disconnect()
    }
  }

  function bare(entries: readonly IntersectionObserverEntry[]) {
    if (option.animation) {
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

  function useObservee(divRef: ElementRef): [IntersectionEvent] {
    const [[e], reset] = useState<[IntersectionEvent]>([] as any)
    const el = divRef.current

    useEffect(init, [el, observer])

    return [e]

    function init() {
      if (el) {
        const e = new IntersectionEvent()
        e.target = el
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
}

function easingExponent(mode: 0 | 1 | 2 | 3 | 4 | 5) {
  const size = [1, 120, 80, 50, 25, 20][mode]
  return new Array(size + 1).fill(0).map((_0, idx) => idx ** mode / size ** mode)
}
