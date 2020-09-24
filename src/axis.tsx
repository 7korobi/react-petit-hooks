import { createContext, useContext, useState, useEffect } from 'react'
import React from 'react'

import { __BROWSER__ } from './device'

export type GeoLocationHook = [[GeoAxis, GeoAxis], MksAxis, CompassAxis, MksAxis, number]
export type DeviceOrientationHook = [[CompassAxis, GeoAxis, GeoAxis], boolean, number]
export type DeviceMotionHook = [
  [AccelAxis, AccelAxis, AccelAxis],
  [AccelAxis, AccelAxis, AccelAxis],
  [AccelAxis, AccelAxis, AccelAxis],
  [RotateAxis, RotateAxis, RotateAxis],
  number,
  number
]

type ProviderProp = {
  children: React.ReactNode | React.ReactNode[]
}

export class Axis {
  values: [number | null, number | null]
  label: string | null
  interval: number

  constructor(public min: number, public max: number, public minus: string, public plus: string) {
    this.interval = 0
    this.values = [null, null]
    this.label = null
  }

  getLabel(): string | null {
    return null
  }

  capture(newVal: number | null, interval: number) {
    this.interval = interval
    this.values = [newVal, this.values[0]]
    this.label = this.getLabel()
  }
}

export class AccelAxis extends Axis {
  getLabel() {
    const [n] = this.values
    if (null === n) {
      return null
    }
    if (n! < -4) {
      return this.minus
    }
    if (4 < n!) {
      return this.plus
    }
    if (this.minus === this.label && n! < -1) {
      return this.minus
    }
    if (this.plus === this.label && 1 < n!) {
      return this.plus
    }
    return ''
  }
}

export class RotateAxis extends Axis {
  getLabel() {
    const [n] = this.values
    if (null === n) {
      return null
    }
    if (n < -140) {
      return this.minus
    }
    if (140 < n) {
      return this.plus
    }
    if (this.minus === this.label && n < -30) {
      return this.minus
    }
    if (this.plus === this.label && 30 < n) {
      return this.plus
    }
    return ''
  }
}

export class CompassAxis extends Axis {
  getLabel() {
    const [n] = this.values
    if (null === n) {
      return null
    }
    const n1 = Math.floor(n)
    const n2 = Math.floor((n * 60) % 60)
    const n3 = Math.floor((n * 3600) % 60)

    return `${n1}°${n2}′${n3}″`
  }
}

export class GeoAxis extends Axis {
  getLabel() {
    let [n] = this.values
    let mark = this.plus

    if (null === n) {
      return null
    }
    if (n <= 0) {
      n = -n
      mark = this.minus
    }
    const n1 = Math.floor(n)
    const n2 = Math.floor((n * 60) % 60)
    const n3 = Math.floor((n * 3600) % 60)
    const n4 = Math.floor((n * 216000) % 60)
    const n5 = Math.floor((n * 12960000) % 60)
    return `${n1}°${n2}′${n3}″${n4}‴${n5}⁗${mark}`
  }
}

export class MksAxis extends Axis {
  getLabel() {
    let [n] = this.values
    let mark = this.plus

    if (null === n) {
      return null
    }
    if (n < 0) {
      n = -n
      mark = this.minus
    }
    const n1 = Math.floor(n)
    const n2 = Math.floor((n * 100) % 100)
    return `${mark}${n1}ｍ${n2}㎝`
  }
}

// 運動座標系
const axAxis = new AccelAxis(-10, 10, '右', '左') // m/s2
const ayAxis = new AccelAxis(-10, 10, '上', '下') // m/s2
const azAxis = new AccelAxis(-10, 10, '表', '裏') // m/s2

const mxAxis = new AccelAxis(-10, 10, '右', '左') // m/s2
const myAxis = new AccelAxis(-10, 10, '上', '下') // m/s2
const mzAxis = new AccelAxis(-10, 10, '表', '裏') // m/s2

const gxAxis = new AccelAxis(-10, 10, '右', '左') // m/s2
const gyAxis = new AccelAxis(-10, 10, '上', '下') // m/s2
const gzAxis = new AccelAxis(-10, 10, '表', '裏') // m/s2

const arAxis = new RotateAxis(-360, 360, '俯下', '仰上') // degree/s
const brAxis = new RotateAxis(-360, 360, '左折', '右折') // degree/s
const grAxis = new RotateAxis(-360, 360, '左巻', '右巻') // degree/s

const altitudeAxis = new MksAxis(0, 10, '-', '') // m
const speedAxis = new MksAxis(0, 10, '-', '') // m/s

// 地球座標系
const aAxis = new CompassAxis(0, 360, '-', '') // degree
const bAxis = new GeoAxis(-180, 180, '左折', '右折') // degree
const gAxis = new GeoAxis(-90, 90, '左巻', '右巻') // degree

const latitudeAxis = new GeoAxis(-180, 180, 'E', 'W')
const longitudeAxis = new GeoAxis(-90, 90, 'N', 'S')

const headingAxis = new CompassAxis(0, 360, '-', '') // degree

export function useDeviceOrientation(): DeviceOrientationHook {
  const [[now, absolute], setNow] = useState([0, true])

  if (__BROWSER__) {
    useEffect(() => {
      if (DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission().then((ps) => {
          if ('granted' === ps) {
            window.addEventListener('deviceorientation', onOrientation)
          }
        })
      } else {
        window.addEventListener('deviceorientation', onOrientation)
      }
      return () => {
        window.addEventListener('deviceorientation', onOrientation)
      }
    }, [])
  }

  return [[aAxis, bAxis, gAxis], absolute, now]

  function onOrientation({ alpha, beta, gamma, absolute }: DeviceOrientationEvent) {
    const time = new Date().getTime()
    const interval = time - now
    aAxis.capture(alpha, interval)
    bAxis.capture(beta, interval)
    gAxis.capture(gamma, interval)
    setNow([time, absolute])
  }
}

export function useDeviceMotion(): DeviceMotionHook {
  const [[now, interval], setNow] = useState<[number, number]>([0, 0])

  if (__BROWSER__) {
    useEffect(() => {
      if (DeviceMotionEvent.requestPermission) {
        DeviceMotionEvent.requestPermission().then((ps) => {
          if ('granted' === ps) {
            window.addEventListener('devicemotion', onMotion)
          }
        })
      } else {
        window.addEventListener('devicemotion', onMotion)
      }
      return () => {
        window.addEventListener('devicemotion', onMotion)
      }
    }, [])
  }

  return [
    [axAxis, ayAxis, azAxis],
    [gxAxis, gyAxis, gzAxis],
    [mxAxis, myAxis, mzAxis],
    [arAxis, brAxis, grAxis],
    interval,
    now,
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

    axAxis.capture(ax, interval)
    ayAxis.capture(ay, interval)
    azAxis.capture(az, interval)
    mxAxis.capture(mx, interval)
    myAxis.capture(my, interval)
    mzAxis.capture(mz, interval)
    gxAxis.capture(mx! - ax!, interval)
    gyAxis.capture(my! - ay!, interval)
    gzAxis.capture(mz! - az!, interval)
    arAxis.capture(alpha, interval)
    brAxis.capture(beta, interval)
    grAxis.capture(gamma, interval)
    setNow([new Date().getTime(), interval])
  }
}

export function useGeoLocation(options?: PositionOptions): GeoLocationHook {
  const [now, setNow] = useState(0)

  if (__BROWSER__) {
    if (!(navigator && navigator.geolocation)) {
      return [[latitudeAxis, longitudeAxis], altitudeAxis, headingAxis, speedAxis, now]
    }

    useEffect(() => {
      const watch_id = navigator.geolocation.watchPosition(
        onPosition,
        ({ code }) => {
          console.log(`error watchPosition = ${code}`)
        },
        options
      )
      return () => {
        navigator.geolocation.clearWatch(watch_id)
      }
    }, [])
  }

  return [[latitudeAxis, longitudeAxis], altitudeAxis, headingAxis, speedAxis, now]

  function onPosition({ coords, timestamp }: Position) {
    const { latitude, longitude, altitude, heading, speed } = coords
    const interval = timestamp - now

    latitudeAxis.capture(latitude, interval)
    longitudeAxis.capture(longitude, interval)

    altitudeAxis.capture(altitude, interval)
    headingAxis.capture(heading, interval)
    speedAxis.capture(speed, interval)
    setNow(timestamp)
  }
}

const GeoLocationContext = createContext<GeoLocationHook | null>(null)
const DeviceMotionContext = createContext<DeviceMotionHook | null>(null)
const DeviceOrientationContext = createContext<DeviceOrientationHook | null>(null)

export function useGeo() {
  return useContext(GeoLocationContext)
}
export function useMotion() {
  return useContext(DeviceMotionContext)
}
export function useOrientation() {
  return useContext(DeviceOrientationContext)
}

export function DeviceMotionProvider({ children }: ProviderProp) {
  const motion = useDeviceMotion()
  return <DeviceMotionContext.Provider value={motion}>{children}</DeviceMotionContext.Provider>
}

export function DeviceOrientationProvider({ children }: ProviderProp) {
  const orientation = useDeviceOrientation()
  return (
    <DeviceOrientationContext.Provider value={orientation}>
      {children}
    </DeviceOrientationContext.Provider>
  )
}

export function GeoProvider({ children }: ProviderProp) {
  const pos = useGeoLocation({
    enableHighAccuracy: true,
    maximumAge: 60 * 1000,
    timeout: 10 * 1000,
  })

  return <GeoLocationContext.Provider value={pos}>{children}</GeoLocationContext.Provider>
}
