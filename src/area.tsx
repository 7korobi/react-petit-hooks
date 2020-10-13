import { useRef, useEffect, useState } from 'react'
import React from 'react'

import { SIZE, POINT, OFFSET } from './util'
import { __BROWSER__, isIOS, isRadius } from './device'

import * as css from '../css/browser.css'

type SIZE_WITH_SCALE = [number, number, number]

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

  constructor([width, height, scale]: SIZE_WITH_SCALE, offset: OFFSET) {
    this.size = [width * scale, height * scale]

    this.scale = 1
    this.isZoom = false
    this.measureSize(width, height, 1)
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

const bootSize: SIZE_WITH_SCALE = [vp.width, vp.height, vp.scale]
const bootOffset: OFFSET = [0, 0, 0, 0]

export const ViewBox = new AreaBox(bootSize, bootOffset)
export const ZoomBox = new AreaBox(bootSize, bootOffset)
export const SafeAreaBox = new AreaBox(bootSize, bootOffset)

function chkZoom() {
  const { height, width, scale } = window.visualViewport

  if (!isIOS) {
    return 1 < scale
  }

  // iOSのピンチは、操作中にズーム範囲を超えることがある。
  // iOSなので window.screen.availWidth はデバイスサイズ。
  // 1.0倍未満への縮小操作の検知にこの値との比較を使う。
  let { availHeight, availWidth } = window.screen
  if (
    (width < height && availWidth < availHeight) ||
    (width > height && availWidth > availHeight)
  ) {
  } else {
    availWidth = availHeight // swaped landscape.
  }
  return 1 < scale || availWidth < Math.floor(width)
}

function ViewFollowZoom() {
  ViewBox.isZoom = ZoomBox.isZoom = chkZoom()
  // ズーム中であってもなくても、orientation change に追いつく処理だけはする。
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

  return <div className={css.safeAreaMeasure} ref={measureRef} />

  function onResize() {
    const css = window.getComputedStyle(measureRef.current!)
    let top = parseInt(css.marginTop)
    let right = parseInt(css.marginRight)
    let bottom = parseInt(css.marginBottom)
    let left = parseInt(css.marginLeft)

    const zeroSafety = MINIMUM_PIXEL_SIZE === Math.max(MINIMUM_PIXEL_SIZE, top, right, bottom, left)
    const [vw, vh] = ViewBox.size

    if (isDefaultSafeArea) {
      if (isRadius && !isIOS) {
        if (vh < vw && zeroSafety) {
          left = right = SAFE_WIDTH
        }
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

  return <meta name="viewport" content={viewport_content.join(',')} />
}
