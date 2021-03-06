import React from 'react'
import { useState } from 'react'
import { Bits } from './bits'
import { BitsN } from './bits-n'

export function useBits<T extends string, U extends string>(bits: Bits<T, U>, init: number) {
  const [value, set] = useState(init)

  return [value, set, ChkBtn] as const
  function ChkBtn({
    className = '',
    as,
    children,
  }: {
    className?: string
    as: (value: number, calc: Bits<T, U>) => number
    children: React.ReactNode | React.ReactNode[]
  }) {
    const active = value === as(value, bits) ? 'active' : ''
    const args = {
      onClick,
      children,
      className: `${className} ${active}`,
    }
    return <a {...args} />
    function onClick() {
      set(as(value, bits))
    }
  }
}

export function useBitsN<T extends string, U extends string>(bits: BitsN<T, U>, init: bigint) {
  const [value, set] = useState(init)

  return [value, set, ChkBtn] as const
  function ChkBtn({
    className = '',
    as,
    children,
  }: {
    className?: string
    as: (value: bigint, calc: BitsN<T, U>) => bigint
    children: React.ReactNode | React.ReactNode[]
  }) {
    const active = value === as(value, bits) ? 'active' : ''
    const args = {
      onClick,
      children,
      className: `${className} ${active}`,
    }
    return <a {...args} />
    function onClick() {
      set(as(value, bits))
    }
  }
}
