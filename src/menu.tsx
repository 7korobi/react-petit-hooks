import { useState, useReducer, useEffect } from 'react'
import { __BROWSER__ } from './device'
import { ZoomBox } from './browser'
import { Bits } from './bits'

const MenuLabels = ['Menu', 'MenuShow', 'MenuDeploy', 'MenuLock', 'Help'] as const
const MenuBits = new Bits(MenuLabels, {
  Timers: ['Menu', 'MenuLock'],
  Options: ['MenuLock', 'Help'],
  Menus: ['Menu', 'MenuShow', 'MenuDeploy'],
} as const)
const { posi: p, nega: n } = MenuBits

type ContextMenuHandler = {
  onTransitionEnd: () => void
}

type ContextMenuSet = (isOn: boolean) => void

export function useContextMenu(
  base: boolean,
  timeout: number = 5000,
  isShowContextMenu: boolean = false,
  isDebug: boolean = false
): [ReturnType<typeof MenuBits['data']>['is'], ContextMenuSet, ContextMenuSet, ContextMenuHandler] {
  const now = new Date().getTime()
  const [timer, setTimer] = useState<NodeJS.Timeout>(null as any)
  const [bits, setBits] = useState<number>(base ? MenuBits.posi.Menus : 0)
  const [menuAt, setIsMenu] = useReducer(reduceIsMenu, base ? now : 0)

  const sw = MenuBits.data(bits)
  const toggle = !sw.is.Menu && !ZoomBox.isZoom

  const { style } = document.body
  const bMenus = p.Menus & bits

  if (__BROWSER__) {
    useEffect(deploy, [])
    useEffect(onMenu, [bMenus])
    useEffect(onTimer, [menuAt])
  }

  return [sw.is, setIsMenu, setIsMenuLock, { onTransitionEnd }]

  function deny(e: { preventDefault: () => void }) {
    e.preventDefault()
    setIsMenu(isShowContextMenu)
  }

  function onToggle() {
    setIsMenu(toggle)
  }

  function setIsMenuLock(isLock: boolean) {
    sw.is.MenuLock = isLock
    setBits(sw.value)
  }

  function deploy() {
    document.addEventListener('contextmenu', deny)
    document.body.addEventListener('click', onToggle)
    return () => {
      document.removeEventListener('contextmenu', deny)
      document.body.removeEventListener('click', onToggle)
    }
  }

  function reduceIsMenu(state: number, action: boolean) {
    if (action) {
      if (ZoomBox.isZoom) {
        return 0
      }
    } else {
      return 0
    }

    return new Date().getTime() + timeout
  }

  function onTimer() {
    const val = bits & p.Timers
    if (val === p.Timers) {
      clearTimeout(timer)
      setTimer(null as any)
    }
    if (val === p.Menu) {
      clearTimeout(timer)
      setTimer(
        setTimeout(() => {
          setIsMenu(false)
          setTimer(null as any)
        }, menuAt - now)
      )
    }
  }

  function onMenu() {
    if (sw.is.Menu) {
      style.setProperty('--menu-event', 'auto')
    }
    if (!sw.is.Menu) {
      style.setProperty('--menu-event', 'none')
    }

    // opening sequence
    const bMenuDeploy = bits & p.Timers
    if (bMenuDeploy === p.Menu) {
      isDebug && console.log(`step 1op`)
      style.setProperty('--menu-opacity', '0')
      setBits((bits & n.MenuShow) | p.Menu | p.MenuDeploy)
    }
    if (bMenus === (p.Menu | p.MenuDeploy)) {
      isDebug && console.log(`step 2op`)
      requestAnimationFrame(() => {
        isDebug && console.log(`step 3op`)
        style.setProperty('--menu-opacity', '1')
        setBits(bits | p.MenuShow)
      })
    }
    if (bMenus === p.Menus) {
      isDebug && console.log(`step 4op`)
      style.setProperty('--menu-opacity', '1')
    }

    // closing sequence
    if (bMenus === (p.MenuDeploy | p.MenuShow)) {
      isDebug && console.log(`step 1ed`)
      style.setProperty('--menu-opacity', '0')
    }
    if (bMenus === p.MenuDeploy) {
      isDebug && console.log(`step 2ed`)
      setBits(bits & n.MenuDeploy)
    }
    if (bMenus === 0) {
      isDebug && console.log(`step 3ed`)
      style.setProperty('--menu-opacity', '0')
    }
  }

  function onTransitionEnd() {
    if (sw.is.Menu) {
      setBits(bits | p.MenuShow)
    } else {
      setBits(bits & n.MenuShow & n.Help)
    }
  }
}
