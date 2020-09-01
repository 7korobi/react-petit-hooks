type Point = [number, number]
type Size = [number, number]

export type PointerExtra = {
  type: 'mouse' | 'touch' | 'pen' | null
  isDown: boolean
  isHover: boolean
  isActive: boolean
  isPrimary: boolean
}

export type PointerData = [HTMLElement, Size, Point, PointerExtra]
export type PointerAction = (
  target: HTMLElement,
  [width, height]: Size,
  [left, top]: Point,
  state: PointerExtra
) => void

function report(move: PointerAction, data: PointerData) {
  move(...data)
}

export function MouseState(): [
  PointerExtra,
  (
    move: PointerAction
  ) => {
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: (e: React.MouseEvent) => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseEnter: (e: React.MouseEvent) => void
    onMouseLeave: (e: React.MouseEvent) => void
  }
] {
  let state = {
    type: 'mouse' as 'mouse',
    isDown: false,
    isHover: false,
    isActive: true,
    isPrimary: true,
  }
  return [state, onMouse]
  function onMouse(move: PointerAction) {
    return { onMouseMove, onMouseUp, onMouseDown, onMouseEnter, onMouseLeave }

    function onMouseMove(e: React.MouseEvent) {
      report(move, reduce(e))
    }
    function onMouseDown(e: React.MouseEvent) {
      state.isDown = true
      report(move, reduce(e))
    }
    function onMouseUp(e: React.MouseEvent) {
      state.isDown = false
      report(move, reduce(e))
    }

    function onMouseEnter(e: React.MouseEvent) {
      state.isHover = true
      report(move, reduce(e))
    }
    function onMouseLeave(e: React.MouseEvent) {
      state.isHover = false
      report(move, reduce(e))
    }

    function reduceOnPage(e: React.MouseEvent): PointerData {
      const { target } = (e as unknown) as { target: HTMLElement }
      const rect = target.getBoundingClientRect()
      const left = e.nativeEvent.pageX
      const top = e.nativeEvent.pageY

      return [target, [rect.width, rect.height], [left, top], state]
    }

    function reduce(e: React.MouseEvent): PointerData {
      const { target } = (e as unknown) as { target: HTMLElement }
      const rect = target.getBoundingClientRect()
      const left = e.nativeEvent.offsetX
      const top = e.nativeEvent.offsetY

      return [target, [rect.width, rect.height], [left, top], state]
    }
  }
}

export function TouchState(): [
  PointerExtra,
  (
    move: PointerAction
  ) => {
    onTouchMove: (e: React.TouchEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onTouchCancel: (e: React.TouchEvent) => void
  }
] {
  let state = {
    type: 'touch' as 'touch',
    isDown: false,
    isHover: false,
    isActive: true,
    isPrimary: true,
  }
  return [state, onTouch]
  function onTouch(move: PointerAction) {
    return { onTouchMove, onTouchStart, onTouchEnd, onTouchCancel }

    function onTouchMove(e: React.TouchEvent) {
      report(move, reduce(e))
    }
    function onTouchStart(e: React.TouchEvent) {
      state.isDown = state.isHover = true
      report(move, reduce(e))
    }
    function onTouchEnd(e: React.TouchEvent) {
      state.isDown = state.isHover = false
      report(move, reduce(e))
    }
    function onTouchCancel(e: React.TouchEvent) {
      state.isDown = state.isHover = false
      report(move, reduce(e))
    }

    function reduceOnPage(e: React.TouchEvent): PointerData {
      const { target } = (e as unknown) as { target: HTMLElement }
      const rect = target.getBoundingClientRect()
      const left = e.changedTouches[0] && e.changedTouches[0].pageX
      const top = e.changedTouches[0] && e.changedTouches[0].pageY

      return [target, [rect.width, rect.height], [left, top], state]
    }
    function reduce(e: React.TouchEvent): PointerData {
      const { target } = (e as unknown) as { target: HTMLElement }
      const rect = target.getBoundingClientRect()
      const left = e.changedTouches[0] && e.changedTouches[0].pageX - rect.left
      const top = e.changedTouches[0] && e.changedTouches[0].pageY - rect.top

      return [target, [rect.width, rect.height], [left, top], state]
    }
  }
}

export function PointerState(): [
  PointerExtra,
  (
    move: PointerAction
  ) => {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => void
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void
    onPointerOut: (e: React.PointerEvent<HTMLElement>) => void
  }
] {
  let state = {
    type: null,
    isDown: false,
    isHover: false,
    isActive: true,
    isPrimary: true,
  }
  return [state, onPointer]
  function onPointer(move: PointerAction) {
    return {
      onPointerMove,
      onPointerUp,
      onPointerDown,
      onPointerEnter,
      onPointerLeave,
      onPointerCancel,
      onPointerOut,
    }

    function onPointerMove(e: React.PointerEvent<HTMLElement>) {
      state.isActive = true
      report(move, reduce(e))
    }

    function onPointerDown(e: React.PointerEvent<HTMLElement>) {
      state.isDown = true
      state.isHover = true
      report(move, reduce(e))
    }
    function onPointerUp(e: React.PointerEvent<HTMLElement>) {
      state.isDown = false
      report(move, reduce(e))
    }

    function onPointerEnter(e: React.PointerEvent<HTMLElement>) {
      state.isHover = true
      report(move, reduce(e))
    }
    function onPointerLeave(e: React.PointerEvent<HTMLElement>) {
      state.isHover = false
      report(move, reduce(e))
    }

    function onPointerOut(e: React.PointerEvent<HTMLElement>) {
      state.isDown = false
      state.isHover = false
      report(move, reduce(e))
    }
    function onPointerCancel(e: React.PointerEvent<HTMLElement>) {
      state.isDown = false
      state.isHover = false
      report(move, reduce(e))
    }

    function reduceOnPage(e: React.PointerEvent<HTMLElement>): PointerData {
      const { isPrimary, pointerType } = e
      const { target } = (e as unknown) as { target: HTMLElement }
      const rect = target.getBoundingClientRect()
      const type = pointerType
      const left = e.nativeEvent.pageX
      const top = e.nativeEvent.pageY

      return [target, [rect.width, rect.height], [left, top], state]
    }

    function reduce(e: React.PointerEvent<HTMLElement>): PointerData {
      const { isPrimary, pointerType } = e
      const { target } = (e as unknown) as { target: HTMLElement }
      const rect = target.getBoundingClientRect()
      const type = pointerType
      const left = e.nativeEvent.offsetX
      const top = e.nativeEvent.offsetY

      return [target, [rect.width, rect.height], [left, top], state]
    }
  }
}
