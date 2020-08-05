import UAParser from 'ua-parser-js'

export const __SPEC__ = 'undefined' === typeof window
export const __BROWSER__ = !__SPEC__
export const __TEST__ = __SPEC__ || 'localhost' === location.hostname

const ua = ((UAParser as unknown) as () => IUAParser.IResult)()
let isIOS = false
let isAndroid = false
let isMacSafari = false

switch (ua.engine.name) {
  case 'Webkit':
    isIOS = true
    if ('Mac OS' === ua.os.name) {
      isMacSafari = true
    }
    break
  case 'Blink':
    isAndroid = true
    break
}

export { isIOS, isAndroid, isMacSafari }
