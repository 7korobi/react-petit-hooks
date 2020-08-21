import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import React from 'react'
import { Helmet } from 'react-helmet'

import { SIZE, POINT, OFFSET } from './util'
import { __BROWSER__, isAndroid, isIOS } from './device'

import './browser.scss'

type MeasureEntry = {
  onResize: (target: Element, rect: DOMRectReadOnly) => void
}

type MeasureProp = {
  setHash: (hash: number) => void
  ratio: number
  isDefaultSafeArea: boolean
}

type ViewportProp = {
  min?: number
  max?: number
}

type BrowserProviderProp = {
  ratio: number
  children: React.ReactNode | React.ReactNode[]
}

type SetterContextProp = {
  setIsMenu?(isMenu: boolean): void
  setFullScreen?(ref: React.RefObject<Element> | null): Promise<Element | null>
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

const default_vp = { width: 1, height: 1, scale: 1 }
const vp = __BROWSER__ ? window.visualViewport || default_vp : default_vp
const MINIMUM_PIXEL_SIZE = 0.2
const SAFE_WIDTH = 44
const SAFE_HEIGHT = 21

class AreaBox {
  scale: number

  size: SIZE
  point!: POINT
  offset!: OFFSET

  isZoom: boolean
  isPortrait!: boolean
  isLandscape!: boolean

  constructor(size: SIZE, offset: OFFSET) {
    this.size = size

    this.scale = 1
    this.isZoom = false
    this.measureScroll(...offset)
  }

  measureSize(width: number, height: number, scale: number) {
    this.size = [width, height]
    this.scale = scale

    const isPortrait = width < height
    const isLandscape = height < width
    this.isPortrait = isPortrait
    this.isLandscape = isLandscape
  }
  measureScroll(top: number, right: number, bottom: number, left: number) {
    this.offset = [top, right, bottom, left]
    this.point = [left, top]
  }
}

export const ViewBox = new AreaBox([vp.width, vp.height], [0, 0, 0, 0])
export const ZoomBox = new AreaBox([vp.width, vp.height], [0, 0, 0, 0])
export const SafeAreaBox = new AreaBox([vp.width, vp.height], [0, 0, 0, 0])

function chkZoom() {
  const { width, scale } = window.visualViewport
  let { availHeight, availWidth, orientation } = window.screen
  if (orientation) {
  } else {
    if ('number' === typeof window.orientation && window.orientation) {
      availWidth = availHeight // iPhone landscape
    }
  }
  return 1 < scale || availWidth < Math.floor(width)
}

function ViewFollowZoom() {
  ViewBox.isZoom = ZoomBox.isZoom = chkZoom()
  // ズーム中であっても、orientation change に追いつく処理だけはする。
  if (ViewBox.isPortrait !== ZoomBox.isPortrait && ViewBox.isLandscape !== ZoomBox.isLandscape) {
    const [height, width] = ViewBox.size
    ViewBox.size = [width, height]
    ViewBox.isPortrait = ZoomBox.isPortrait
    ViewBox.isLandscape = ZoomBox.isPortrait
  }
  const [w1, h1] = ViewBox.size
  const [w2, h2] = ZoomBox.size
  if (h1 / w1 !== h2 / w2) {
    ViewBox.size = [w1, (h2 * w1) / w2]
  }
}

function Measure({ setHash, ratio, isDefaultSafeArea }: MeasureProp) {
  useViewportSize()
  const measureRef = useRef<HTMLDivElement & MeasureEntry>(null)

  if (__BROWSER__) {
    useEffect(onResize, ViewBox.size)
  }

  return <div id="safe-area-measure" ref={measureRef} />

  function onResize() {
    const css = window.getComputedStyle(measureRef.current!)
    let top = parseInt(css.marginTop)
    let right = parseInt(css.marginRight)
    let bottom = parseInt(css.marginBottom)
    let left = parseInt(css.marginLeft)

    const zeroSafety = MINIMUM_PIXEL_SIZE === Math.max(MINIMUM_PIXEL_SIZE, top, right, bottom, left)
    const [vw, vh] = ViewBox.size

    if (isDefaultSafeArea) {
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
    }

    top *= ratio
    right *= ratio
    bottom *= ratio
    left *= ratio

    const width = vw - left - right
    const height = vh - top - bottom

    const { style } = document.body
    style.setProperty('--safe-area-width', `${Math.floor(width)}px`)
    style.setProperty('--safe-area-height', `${Math.floor(height)}px`)

    style.setProperty('--safe-area-top', `${top}px`)
    style.setProperty('--safe-area-right', `${right}px`)
    style.setProperty('--safe-area-bottom', `${bottom}px`)
    style.setProperty('--safe-area-left', `${left}px`)

    SafeAreaBox.measureSize(width, height, 1)
    SafeAreaBox.measureScroll(top, right, bottom, left)
    setHash(width * 10000 + height + top + right + bottom + left)
  }
}

export function useSafeArea(
  ratio = 1.0,
  isDefaultSafeArea = true
): [typeof SafeAreaBox, typeof ViewBox, JSX.Element] {
  const [hash, setHash] = useState(0)
  const measure = <Measure setHash={setHash} ratio={ratio} isDefaultSafeArea={isDefaultSafeArea} />

  return [SafeAreaBox, ViewBox, measure]
}

export function useViewportScroll(): [typeof ViewBox, typeof ZoomBox] {
  const [hash, setHash] = useState(0)
  const { style } = document.body

  if (__BROWSER__) {
    useEffect(init, [])
    useEffect(setViewStyle, ViewBox.offset)
    useEffect(setZoomStyle, ZoomBox.offset)
  }

  return [ViewBox, ZoomBox]

  function init() {
    window.visualViewport.addEventListener('scroll', onScroll)
    onScroll()
    setViewStyle()
    setZoomStyle()

    return () => {
      window.visualViewport.removeEventListener('scroll', onScroll)
    }
  }

  function onScroll() {
    const { width, height, offsetLeft, offsetTop, pageLeft, pageTop } = window.visualViewport
    const [vw, vh] = ViewBox.size

    const top = Math.ceil(offsetTop)
    const right = Math.floor(vw - width - offsetLeft)
    const bottom = Math.floor(vh - height - offsetTop)
    const left = Math.ceil(offsetLeft)

    ZoomBox.measureScroll(top, right, bottom, left)
    if (!ZoomBox.isZoom) {
      const pageRight = -pageLeft
      const pageBottom = -pageTop
      ViewBox.measureScroll(pageTop, pageRight, pageBottom, pageLeft)
    }
    setHash(pageTop + pageLeft + offsetTop + offsetLeft)
  }

  function setViewStyle() {
    const [top, right, bottom, left] = ViewBox.offset
  }

  function setZoomStyle() {
    const [top, right, bottom, left] = ZoomBox.offset
    style.setProperty('--zoom-top', `${top}px`)
    style.setProperty('--zoom-right', `${right}px`)
    style.setProperty('--zoom-bottom', `${bottom}px`)
    style.setProperty('--zoom-left', `${left}px`)
  }
}

export function useViewportSize(): [typeof ViewBox, typeof ZoomBox] {
  const [hash, setHash] = useState(0)
  const { style } = document.body

  if (__BROWSER__) {
    useEffect(init, [])
    useEffect(setViewStyle, ViewBox.size)
    useEffect(setZoomStyle, ZoomBox.size)
  }

  return [ViewBox, ZoomBox]

  function init() {
    window.visualViewport.addEventListener('resize', onResize)
    onResize()
    setViewStyle()
    setZoomStyle()

    return () => {
      window.visualViewport.removeEventListener('resize', onResize)
    }
  }

  function onResize() {
    const { width, height, scale } = window.visualViewport
    ZoomBox.measureSize(width, height, scale)
    ViewFollowZoom()
    if (!ZoomBox.isZoom) {
      ViewBox.measureSize(width, height, 1)
    }
    setHash(width * 10000 + height)
  }

  function setViewStyle() {
    const [width, height] = ViewBox.size
    style.setProperty('--view-width', `${width}px`)
    style.setProperty('--view-height', `${height}px`)
  }

  function setZoomStyle() {
    const [width, height] = ZoomBox.size
    const { scale } = ZoomBox
    style.setProperty('--zoom-width', `${width}px`)
    style.setProperty('--zoom-height', `${height}px`)
    style.setProperty('--zoom-in', `${scale}`)
    style.setProperty('--zoom-out', `${1 / scale}`)
  }
}

export function Viewport({ min = 1.0, max = 1.0 }: ViewportProp) {
  let viewport_content = [
    'viewport-fit=cover',
    'width=device-width',
    'initial-scale=1.0',
    `minimum-scale=${min}`,
    ...(min < max
      ? [`maximum-scale=${max}`, 'user-scalable=yes']
      : [`maximum-scale=${max}`, 'user-scalable=no']),
  ]

  return (
    <Helmet>
      <meta name="viewport" content={viewport_content.join(',')} />
    </Helmet>
  )
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
    setIsOnline(window.navigator.onLine)
    requestAnimationFrame(() => {
      setIsOnline(window.navigator.onLine)
    })
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

export function useContextMenu(
  base: boolean,
  isShowContextMenu: boolean = false
): [boolean, (isMenu: boolean) => void] {
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
    setIsMenu(isShowContextMenu)
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

const ZoomBoxScaleContext = createContext<[number, boolean]>([ZoomBox.scale, ZoomBox.isZoom])
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
  return useContext(ZoomBoxScaleContext)
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
  const [_sbox, _vbox, measure] = useSafeArea(ratio, true)
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
              <ZoomBoxScaleContext.Provider value={[ZoomBox.scale, ZoomBox.isZoom]}>
                <ViewBoxSizeContext.Provider value={ViewBox.size}>
                  <SafeAreaSizeContext.Provider value={SafeAreaBox.size}>
                    <SafeAreaOffsetContext.Provider value={SafeAreaBox.offset}>
                      {children}
                    </SafeAreaOffsetContext.Provider>
                  </SafeAreaSizeContext.Provider>
                </ViewBoxSizeContext.Provider>
              </ZoomBoxScaleContext.Provider>
            </MenuContext.Provider>
          </KeyboardContext.Provider>
        </FullScreenContext.Provider>
      </SetterContext.Provider>
    </>
  )
}

export function internetOnline(): Promise<Event | undefined> {
  return new Promise((ok) => {
    if (window.navigator.onLine) {
      ok()
    } else {
      window.addEventListener('online', onOnline)
    }

    function onOnline(e: Event) {
      window.removeEventListener('online', onOnline)
      ok()
    }
  })
}
