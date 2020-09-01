import UAParser from 'ua-parser-js'

export const __SPEC__ = 'undefined' === typeof window
export const __BROWSER__ = !__SPEC__

const ua = ((UAParser as unknown) as () => IUAParser.IResult)()
let isIOS = false
let isAndroid = false
let isMacSafari = false

switch (ua.engine.name) {
  case 'Webkit':
    isIOS = true
    break
}

switch (ua.os.name) {
  case 'Mac OS':
    isMacSafari = true
    break
  case 'Android':
    isAndroid = true
    break
}

export { isIOS, isAndroid, isMacSafari }
