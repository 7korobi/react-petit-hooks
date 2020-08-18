import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import React from 'react'

import { SIZE, POINT, OFFSET } from './util'
import { __BROWSER__, isAndroid, isIOS } from './device'

import './browser.scss'

type MeasureEntry = {
  onResize: (target: Element, rect: DOMRectReadOnly) => void
}

type SetterContextProp = {
  setIsMenu?(isMenu: boolean): void
  setFullScreen?(ref: React.RefObject<Element> | null): Promise<Element | null>
}

type BrowserProviderProp = {
  ratio: number
  children: React.ReactNode | React.ReactNode[]
}

declare global {
  interface Window {
    visualViewport: {
      offsetLeft: number
      offsetTop: number
      pageLeft: number
      pageTop: number
      width: number
      height: number
      scale: number
      addEventListener(type: 'resize' | 'scroll', cb: (e: Event) => void): void
      removeEventListener(type: 'resize' | 'scroll', cb: (e: Event) => void): void
    }
  }
}

const default_vp = { width: 0, height: 0, scale: 1 }
const vp = __BROWSER__ ? window.visualViewport || default_vp : default_vp
const MINIMUM_PIXEL_SIZE = 0.2
const SAFE_WIDTH = 44
const SAFE_HEIGHT = 21

class AreaBox {
  size: SIZE
  offset: OFFSET

  page!: POINT
  sizeNow!: SIZE
  scale!: number
  isPortrait!: boolean
  isLandscape!: boolean
  constructor(size: SIZE, offset: OFFSET) {
    this.size = this.sizeNow = size
    this.offset = offset
  }

  measure(scale: number, sizeNow: SIZE, isPortrait: boolean, isLandscape: boolean) {
    this.scale = scale
    this.sizeNow = sizeNow
    this.isPortrait = isPortrait
    this.isLandscape = isLandscape
  }
}

export const ViewBox = new AreaBox([vp.width, vp.height], [0, 0, 0, 0])
export const SafeAreaBox = new AreaBox([vp.width, vp.height], [0, 0, 0, 0])

type MeasureProp = {
  setTimer: (timer: Date) => void
  ratio: number
}

function Measure({ setTimer, ratio }: MeasureProp) {
  const measureRef = useRef<HTMLDivElement & MeasureEntry>(null)

  if (__BROWSER__) {
    useEffect(() => {
      window.visualViewport.addEventListener('resize', onResize)
      onResize()

      return () => {
        window.visualViewport.removeEventListener('resize', onResize)
      }
    }, [])
  }

  return <div id="safe-area-measure" ref={measureRef} />

  function onResize() {
    const css = window.getComputedStyle(measureRef.current!)
    let top = parseInt(css.marginTop)
    let right = parseInt(css.marginRight)
    let bottom = parseInt(css.marginBottom)
    let left = parseInt(css.marginLeft)

    const zeroSafety = MINIMUM_PIXEL_SIZE === Math.max(MINIMUM_PIXEL_SIZE, top, right, bottom, left)
    const { width: vw, height: vh } = window.visualViewport

    if (isAndroid) {
      if (vh < vw && zeroSafety) {
        left = right = SAFE_WIDTH
      }
      if (vw < vh && zeroSafety) {
        bottom = SAFE_HEIGHT
      }
    }

    if (isIOS) {
      if (vw < vh && zeroSafety) {
        bottom = SAFE_HEIGHT
      }
    }

    top *= ratio
    right *= ratio
    bottom *= ratio
    left *= ratio

    const width = vw - left - right
    const height = vh - top - bottom - 1

    const { style } = document.body
    style.setProperty('--safe-area-width', `${width}px`)
    style.setProperty('--safe-area-height', `${height}px`)

    style.setProperty('--safe-area-top', `${top}px`)
    style.setProperty('--safe-area-right', `${right}px`)
    style.setProperty('--safe-area-bottom', `${bottom}px`)
    style.setProperty('--safe-area-left', `${left}px`)

    SafeAreaBox.size = [width, height]
    SafeAreaBox.offset = [top, right, bottom, left]
    setTimer(new Date())
  }
}

export function useSafeArea(ratio = 1.0): [AreaBox, AreaBox, JSX.Element] {
  const [_timer, setTimer] = useState(new Date())
  const measure = <Measure setTimer={setTimer} ratio={ratio} />

  return [SafeAreaBox, ViewBox, measure]
}

export function useViewportScroll(): [AreaBox] {
  const [hash, setHash] = useState(0)

  if (__BROWSER__) {
    useEffect(() => {
      window.visualViewport.addEventListener('scroll', onScroll)
      onScroll()
      return () => {
        window.visualViewport.removeEventListener('scroll', onScroll)
      }
    }, [])
  }

  return [ViewBox]

  function onScroll() {
    const { style } = document.body
    const { offsetLeft, offsetTop, pageLeft, pageTop } = window.visualViewport
    ViewBox.offset = [
      Math.floor(offsetTop),
      Math.ceil(-offsetLeft),
      Math.ceil(-offsetTop),
      Math.floor(offsetLeft),
    ]
    ViewBox.page = [Math.floor(pageLeft), Math.floor(pageTop)]
    setHash(pageTop + pageLeft + offsetTop + offsetLeft)
  }
}

export function useViewportSize(): [AreaBox] {
  const [hash, setHash] = useState(0)

  if (__BROWSER__) {
    useEffect(() => {
      window.visualViewport.addEventListener('resize', onResize)
      onResize()

      return () => {
        window.visualViewport.removeEventListener('resize', onResize)
      }
    }, [])
  }

  return [ViewBox]

  function onResize() {
    const { style } = document.body
    const { scale, width, height } = window.visualViewport
    let { availHeight, availWidth, orientation } = window.screen
    if (orientation) {
    } else {
      if ('number' === typeof window.orientation && window.orientation) {
        availWidth = availHeight // iPhone landscape
      }
    }
    ViewBox.measure(scale, [width, height], width < height, height < width)
    if (scale !== 1 || availWidth < width) {
      return
    }

    ViewBox.size = ViewBox.sizeNow
    style.setProperty('--view-width', `${width}px`)
    style.setProperty('--view-height', `${height}px`)
    setHash(width * 10000 + height)
  }
}

export function useFullScreenChanger(): [
  Element | null,
  (ref: React.RefObject<Element> | null) => Promise<Element | null>
] {
  const [element, setElementBare] = useState<Element | null>(null)
  const setElement = useCallback(
    async (ref: React.RefObject<Element> | null): Promise<Element | null> => {
      try {
        if (ref && ref.current) {
          await ref.current.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      } catch {}
      onChange()
      return document.fullscreenElement
    },
    []
  )

  if (__BROWSER__) {
    useEffect(() => {
      document.addEventListener('fullscreenchange', onChange)
      document.addEventListener('fullscreenerror', onError)
      return () => {
        document.removeEventListener('fullscreenchange', onChange)
        document.removeEventListener('fullscreenerror', onError)
      }
    }, [])
  }
  return [element, setElement]

  function onChange() {
    setElementBare(document.fullscreenElement)
  }
  function onError(e: Event) {
    console.error(e)
  }
}

export function useInternet(): [boolean] {
  const [isOnline, setIsOnline] = useState(true)

  if (__BROWSER__) {
    useEffect(() => {
      window.addEventListener('offline', network_state)
      window.addEventListener('online', network_state)
      return () => {
        window.removeEventListener('offline', network_state)
        window.removeEventListener('online', network_state)
      }
    }, [])
  }
  return [isOnline]

  function network_state() {
    const { onLine } = window.navigator
    if (isOnline === onLine) {
      setIsOnline(!isOnline)
      requestAnimationFrame(() => {
        setIsOnline(onLine)
      })
    } else {
      setIsOnline(onLine)
    }
  }
}

export function useVisibility(): [boolean] {
  const [isVisible, setIsVisible] = useState(true)

  if (__BROWSER__) {
    useEffect(() => {
      document.addEventListener('visibilitychange', visible_state)
      return () => {
        document.removeEventListener('visibilitychange', visible_state)
      }
    }, [])
  }
  return [isVisible]

  function visible_state() {
    setIsVisible('hidden' !== document.visibilityState)
  }
}

export function useContextMenu(base: boolean): [boolean, (isMenu: boolean) => void] {
  const [isMenu, setIsMenu] = useState(base)

  if (__BROWSER__) {
    useEffect(() => {
      const { style } = document.body
      if (isMenu) {
        style.setProperty('--menu-opacity', '1')
      } else {
        style.setProperty('--menu-opacity', '0')
      }
    }, [isMenu])

    useEffect(() => {
      document.addEventListener('contextmenu', deny)
      return () => {
        document.removeEventListener('contextmenu', deny)
      }
    }, [])
  }

  return [isMenu, setIsMenu]

  function deny(e: { preventDefault: () => void }) {
    e.preventDefault()
    setIsMenu(true)
  }
}

export function useKeyboard(target: EventTarget = document): [KeyboardEvent] {
  const [key, setKey] = useState<KeyboardEvent>(new KeyboardEvent(''))
  if (__BROWSER__) {
    useEffect(() => {
      target.addEventListener('keyup', setKey as any)
      return () => {
        target.removeEventListener('keyup', setKey as any)
      }
    }, [])
  }

  return [key]
}

const SetterContext = createContext<SetterContextProp>({})

const MenuContext = createContext({ isMenu: true, isOnline: true, isVisible: true })
const KeyboardContext = createContext<KeyboardEvent | null>(null)
const FullScreenContext = createContext<Element | null>(null)

const ViewBoxScaleContext = createContext<number>(ViewBox.scale)
const ViewBoxSizeContext = createContext<SIZE>(ViewBox.size)
const SafeAreaSizeContext = createContext<SIZE>(SafeAreaBox.size)
const SafeAreaOffsetContext = createContext<OFFSET>(SafeAreaBox.offset)

export function useFullScreen() {
  return useContext(FullScreenContext)
}

export function useKey() {
  return useContext(KeyboardContext)
}

export function useContextSetter() {
  return useContext(SetterContext)
}
export function useViewBoxScale() {
  return useContext(ViewBoxScaleContext)
}

export function useViewBoxSize() {
  return useContext(ViewBoxSizeContext)
}
export function useSafeAreaSize() {
  return useContext(SafeAreaSizeContext)
}
export function useSafeAreaOffset() {
  return useContext(SafeAreaOffsetContext)
}

export function useMenu() {
  return useContext(MenuContext)
}

export function BrowserProvider({ ratio, children }: BrowserProviderProp) {
  const [isOnline] = useInternet()
  const [isVisible] = useVisibility()
  const [sbox, vbox, measure] = useSafeArea(ratio)
  useViewportSize()
  useViewportScroll()

  const [key] = useKeyboard()
  const [fullscreenElement, setFullScreen] = useFullScreenChanger()
  const [isMenu, setIsMenu] = useContextMenu(true)

  return (
    <>
      {measure}
      <SetterContext.Provider value={{ setIsMenu, setFullScreen }}>
        <FullScreenContext.Provider value={fullscreenElement}>
          <KeyboardContext.Provider value={key}>
            <MenuContext.Provider value={{ isMenu, isOnline, isVisible }}>
              <ViewBoxScaleContext.Provider value={vbox.scale}>
                <ViewBoxSizeContext.Provider value={vbox.size}>
                  <SafeAreaSizeContext.Provider value={sbox.size}>
                    <SafeAreaOffsetContext.Provider value={sbox.offset}>
                      {children}
                    </SafeAreaOffsetContext.Provider>
                  </SafeAreaSizeContext.Provider>
                </ViewBoxSizeContext.Provider>
              </ViewBoxScaleContext.Provider>
            </MenuContext.Provider>
          </KeyboardContext.Provider>
        </FullScreenContext.Provider>
      </SetterContext.Provider>
    </>
  )
}
