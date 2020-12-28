import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import React from 'react'

import { useContextMenu } from './menu'
import { OFFSET, SIZE } from './util'
import { __BROWSER__ } from './device'
import {
  ZoomBox,
  ViewBox,
  SafeAreaBox,
  useSafeArea,
  useViewportSize,
  useViewportScroll,
} from './area'

export * from './area'
export * from './axis'

type BrowserProviderProp = {
  ratio: number
  children: React.ReactNode | React.ReactNode[]
}

type SetterContextProp = {
  setIsMenu?(isMenu: boolean): void
  setFullScreen?(ref: React.RefObject<Element> | null): Promise<Element | null>
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

const MenuContext = createContext({
  isMenu: true,
  isMenuShow: true,
  isOnline: true,
  isVisible: true,
})
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
  const [b, setIsMenu, handler] = useContextMenu(true, 3000)

  return (
    <>
      {measure}
      <SetterContext.Provider value={{ setIsMenu, setFullScreen }}>
        <FullScreenContext.Provider value={fullscreenElement}>
          <KeyboardContext.Provider value={key}>
            <MenuContext.Provider
              value={{ isMenu: b.Menu, isMenuShow: b.MenuShow, isOnline, isVisible }}
            >
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

export function internetOnline(): Promise<void> {
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
