import { useEffect, useState, useReducer } from "react"
import { __BROWSER__ } from "./device"


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
      addEventListener(type: "resize" | "scroll", cb: (e: Event) => void): void
      removeEventListener(
        type: "resize" | "scroll",
        cb: (e: Event) => void
      ): void
    }
  }
}

type SIZE = [number, number]

const vp = __BROWSER__
  ? window.visualViewport
  : { width: 0, height: 0, scale: 1 }

export const ViewBox: { size: SIZE; scale: number } = {
  size: [vp.width, vp.height],
  scale: vp.scale,
}

export function useInternet(): [boolean] {
  const [isOnline, setIsOnline] = useState(true)

  if (__BROWSER__) {
    useEffect(() => {
      window.addEventListener("offline", network_state)
      window.addEventListener("online", network_state)
      return () => {
        window.removeEventListener("offline", network_state)
        window.removeEventListener("online", network_state)
      }
    }, [])
  }
  return [isOnline]

  function network_state() {
    setIsOnline(window.navigator.onLine)
  }
}

export function useVisible(): [boolean] {
  const [isVisible, setIsVisible] = useState(true)

  if (__BROWSER__) {
    useEffect(() => {
      document.addEventListener("visibilitychange", visible_state)
      return () => {
        document.removeEventListener("visibilitychange", visible_state)
      }
    }, [])
  }
  return [isVisible]

  function visible_state() {
    setIsVisible("hidden" !== document.visibilityState)
  }
}

export function useKeyboard(): [] {
  if (__BROWSER__) {
    useEffect(() => {
      document.addEventListener("keyup", keyboard)
      return () => {
        document.removeEventListener("keyup", keyboard)
      }
    }, [])
  }

  return []
  function keyboard(e: KeyboardEvent) {
    console.log(e)
  }
}

export function useContextMenu(): [boolean, (isMenu: boolean) => void] {
  const [isMenu, setIsMenu] = useState(true)

  if (__BROWSER__) {
    useEffect(() => {
      const { style } = document.body
      if (isMenu) {
        style.setProperty("--menu-display", "block")
      } else {
        style.setProperty("--menu-display", "none")
      }
    }, [isMenu])

    useEffect(() => {
      document.addEventListener("contextmenu", deny)
      return () => {
        document.removeEventListener("contextmenu", deny)
      }
    }, [])
  }

  return [isMenu, setIsMenu]

  function deny(e: { preventDefault: () => void }) {
    e.preventDefault()
    setIsMenu(true)
  }
}

export function useViewport(): [number, number, number] {
  const [width, setWidth] = useState<number>(ViewBox.size[0])
  const [height, setHeight] = useState<number>(ViewBox.size[1])
  const [scale, setScale] = useState<number>(ViewBox.scale)

  if (__BROWSER__) {
    useEffect(() => {
      resize()
      window.visualViewport.addEventListener("resize", resize)
      window.addEventListener("orientationChange", resize)

      return () => {
        window.visualViewport.removeEventListener("resize", resize)
        window.addEventListener("orientationChange", resize)
      }
    }, [])
  }

  return [width, height, scale]

  function resize() {
    const { style } = document.body
    const { scale, width, height } = window.visualViewport
    ViewBox.scale = scale

    setScale(scale)
    if (scale === 1) {
      style.setProperty("--view-width", `${width}px`)
      style.setProperty("--view-height", `${height}px`)

      ViewBox.size = [width, height]
      setWidth(width)
      setHeight(height)
    }
  }
}

interface Axis {
  label(n: number | null, oldVal?: string): string | null
}

class AccelAxis implements Axis {
  constructor(
    public min: number,
    public max: number,
    public minus: string,
    public plus: string
  ) {}
  label(n: number | null, oldVal: string) {
    if (null === n) {
      return null
    }
    if (n < -4) {
      return this.minus
    }
    if (4 < n) {
      return this.plus
    }
    if (oldVal === this.minus && n < -1) {
      return this.minus
    }
    if (oldVal === this.plus && 1 < n) {
      return this.plus
    }
    return ""
  }
}
class RotateAxis implements Axis {
  constructor(
    public min: number,
    public max: number,
    public minus: string,
    public plus: string
  ) {}
  label(n: number | null, oldVal: string) {
    if (null === n) {
      return null
    }
    if (n < -140) {
      return this.minus
    }
    if (140 < n) {
      return this.plus
    }
    if (oldVal === this.minus && n < -30) {
      return this.minus
    }
    if (oldVal === this.plus && 30 < n) {
      return this.plus
    }
    return ""
  }
}
class CompassAxis implements Axis {
  constructor(public min: number, public max: number) {}
  label(n: number | null) {
    if (null === n) {
      return null
    }
    const n1 = Math.floor(n)
    const n2 = Math.floor((n * 60) % 60)
    const n3 = Math.floor((n * 3600) % 60)

    return `${n1}°${n2}′${n3}″`
  }
}
class GeoAxis implements Axis {
  constructor(
    public min: number,
    public max: number,
    public minus: string,
    public plus: string
  ) {}
  label(n: number | null) {
    if (null === n) {
      return null
    }
    const n1 = Math.floor(n)
    const n2 = Math.floor((n * 60) % 60)
    const n3 = Math.floor((n * 3600) % 60)
    const n4 = Math.floor((n * 216000) % 60)
    const n5 = Math.floor((n * 12960000) % 60)

    const mark = n < 0 ? this.minus : this.plus
    return `${n1}°${n2}′${n3}″${n4}‴${n5}⁗${mark}`
  }
}
class MksAxis implements Axis {
  constructor(public min: number, public max: number) {}
  label(n: number | null) {
    if (null === n) {
      return null
    }
    const n1 = Math.floor(n)
    const n2 = Math.floor((n * 100) % 100)
    return `${n1}ｍ${n2}㎝`
  }
}

// 運動座標系
const xAxis = new AccelAxis(-10, 10, "右", "左") // m/s2
const yAxis = new AccelAxis(-10, 10, "上", "下") // m/s2
const zAxis = new AccelAxis(-10, 10, "表", "裏") // m/s2

const arAxis = new RotateAxis(-360, 360, "俯下", "仰上") // degree/s
const brAxis = new RotateAxis(-360, 360, "左折", "右折") // degree/s
const grAxis = new RotateAxis(-360, 360, "左巻", "右巻") // degree/s

const altAxis = new MksAxis(0, 10) // m
const spdAxis = new MksAxis(0, 10) // m/s

// 地球座標系
const aAxis = new CompassAxis(0, 360) // degree
const bAxis = new GeoAxis(-180, 180, "左折", "右折") // degree
const gAxis = new GeoAxis(-90, 90, "左巻", "右巻") // degree

const latAxis = new GeoAxis(-180, 180, "E", "W")
const lonAxis = new GeoAxis(-90, 90, "N", "S")

const headAxis = new CompassAxis(0, 360) // degree

export function useDeviceOrientation<U>(
  rotate: (oldVal: U, newVal: number | null, axis: CompassAxis | RotateAxis) => U
): [[U, U, U], boolean] {
  const [alpha, setAlpha] = useReducer<typeof chkRotate>(
    chkRotate,
    rotate(null!, null, aAxis)
  )
  const [beta, setBeta] = useReducer<typeof chkRotate>(
    chkRotate,
    rotate(null!, null, bAxis)
  )
  const [gamma, setGamma] = useReducer<typeof chkRotate>(
    chkRotate,
    rotate(null!, null, gAxis)
  )
  const [absolute, setAbsolute] = useState(true)

  if (__BROWSER__) {
    useEffect(() => {
      if (DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission().then((ps) => {
          if ("granted" === ps) {
            window.addEventListener("deviceorientation", onOrientation)
          }
        })
      } else {
        window.addEventListener("deviceorientation", onOrientation)
      }
      return () => {
        window.addEventListener("deviceorientation", onOrientation)
      }
    }, [])
  }

  return [[alpha, beta, gamma], absolute]

  function onOrientation({
    alpha,
    beta,
    gamma,
    absolute,
  }: DeviceOrientationEvent) {
    setAlpha([alpha!, aAxis])
    setBeta([beta!, bAxis])
    setGamma([gamma!, gAxis])
    setAbsolute(absolute)
  }

  function chkRotate(
    oldVal: U,
    [newVal, axis]: [number | null, CompassAxis | RotateAxis]
  ): U {
    return rotate(oldVal, newVal, axis)
  }
}

export function useDeviceMotion<T, U>(
  motion: (oldVal: T, newVal: number | null, axis: AccelAxis) => T,
  rotate: (oldVal: U, newVal: number | null, axis: RotateAxis) => U
): [[T, T, T], [T, T, T], [T, T, T], [U, U, U], number] {
  const [ax, setAx] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, xAxis)
  )
  const [ay, setAy] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, yAxis)
  )
  const [az, setAz] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, zAxis)
  )

  const [gx, setGx] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, xAxis)
  )
  const [gy, setGy] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, yAxis)
  )
  const [gz, setGz] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, zAxis)
  )

  const [mx, setMx] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, xAxis)
  )
  const [my, setMy] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, yAxis)
  )
  const [mz, setMz] = useReducer<typeof chkMotion>(
    chkMotion,
    motion(null!, null, zAxis)
  )

  const [alpha, setAlpha] = useReducer<typeof chkRotate>(
    chkRotate,
    rotate(null!, null, arAxis)
  )
  const [beta, setBeta] = useReducer<typeof chkRotate>(
    chkRotate,
    rotate(null!, null, brAxis)
  )
  const [gamma, setGamma] = useReducer<typeof chkRotate>(
    chkRotate,
    rotate(null!, null, grAxis)
  )
  const [interval, setInterval] = useState(0)

  if (__BROWSER__) {
    useEffect(() => {
      if (DeviceMotionEvent.requestPermission) {
        DeviceMotionEvent.requestPermission().then((ps) => {
          if ("granted" === ps) {
            window.addEventListener("devicemotion", onMotion)
          }
        })
      } else {
        window.addEventListener("devicemotion", onMotion)
      }
      return () => {
        window.addEventListener("devicemotion", onMotion)
      }
    }, [])
  }

  return [
    [ax, ay, az],
    [gx, gy, gz],
    [mx, my, mz],
    [alpha, beta, gamma],
    interval,
  ]

  function onMotion({
    interval,
    acceleration,
    accelerationIncludingGravity,
    rotationRate,
  }: DeviceMotionEvent) {
    const { x: ax, y: ay, z: az } = acceleration!
    const { x: mx, y: my, z: mz } = accelerationIncludingGravity!
    const { alpha, beta, gamma } = rotationRate!
    setAx([ax!, xAxis])
    setAy([ay!, yAxis])
    setAz([az!, zAxis])
    setMx([mx!, xAxis])
    setMy([my!, yAxis])
    setMz([mz!, zAxis])
    setGx([mx! - ax!, xAxis])
    setGy([my! - ay!, yAxis])
    setGz([mz! - az!, zAxis])
    setAlpha([alpha!, arAxis])
    setBeta([beta!, brAxis])
    setGamma([gamma!, grAxis])
    setInterval(interval)
  }

  function chkMotion(oldVal: T, [newVal, axis]: [number | null, AccelAxis]): T {
    return motion(oldVal, newVal, axis)
  }
  function chkRotate(
    oldVal: U,
    [newVal, axis]: [number | null, RotateAxis]
  ): U {
    return rotate(oldVal, newVal, axis)
  }
}

export function useGeoLocation<T, U>(
  geo: (oldVal: T, newVal: number | null, axis: GeoAxis | CompassAxis) => T,
  mks: (oldVal: U, newVal: number | null, axis: MksAxis) => U
): [[T, T], U, T, U] {
  const [latitude, setLatitude] = useReducer<typeof chkGeo>(
    chkGeo,
    geo(null!, null, latAxis)
  )
  const [longitude, setLongitude] = useReducer<typeof chkGeo>(
    chkGeo,
    geo(null!, null, lonAxis)
  )
  const [heading, setHeading] = useReducer<typeof chkCompass>(
    chkCompass,
    geo(null!, null, headAxis)
  )

  const [altitude, setAltitude] = useReducer<typeof chkMks>(
    chkMks,
    mks(null!, null, altAxis)
  )
  const [speed, setSpeed] = useReducer<typeof chkMks>(
    chkMks,
    mks(null!, null, spdAxis)
  )

  if (__BROWSER__) {
    if (!navigator?.geolocation) {
      return [[latitude, longitude], altitude, heading, speed]
    }

    useEffect(() => {
      const watch_id = navigator.geolocation.watchPosition(
        onPosition,
        ({ code }) => {
          console.log(`error watchPosition = ${code}`)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60 * 1000,
          timeout: 10 * 1000,
        }
      )
      return () => {
        navigator.geolocation.clearWatch(watch_id)
      }
    }, [])
  }

  return [[latitude, longitude], altitude, heading, speed]

  function onPosition({ coords, timestamp }: Position) {
    let { latitude, longitude, altitude, heading, speed } = coords
    setLongitude([longitude, lonAxis])
    setLatitude([latitude, latAxis])
    if (altitude !== null) setAltitude([altitude, altAxis])
    if (heading !== null) setHeading([heading, headAxis])
    if (speed !== null) setSpeed([speed, spdAxis])
  }
  function chkCompass(
    oldVal: T,
    [newVal, axis]: [number | null, CompassAxis]
  ): T {
    return geo(oldVal, newVal, axis)
  }
  function chkGeo(oldVal: T, [newVal, axis]: [number | null, GeoAxis]): T {
    return geo(oldVal, newVal, axis)
  }
  function chkMks(oldVal: U, [newVal, axis]: [number | null, MksAxis]): U {
    return mks(oldVal, newVal, axis)
  }
}
