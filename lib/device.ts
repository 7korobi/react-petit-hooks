export const __SPEC__ = "undefined" === typeof window
export const __BROWSER__ = !__SPEC__
export const __TEST__ = __SPEC__ || "localhost" === location.hostname
