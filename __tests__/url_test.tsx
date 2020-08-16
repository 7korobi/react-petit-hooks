import { render, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import React, { useEffect } from 'react'

import { Bits } from '../lib/bits'
import { usePushState, useLocalStorage } from '../lib/storage'

const TestBits = new Bits(['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const)
const data = {
  data_b: false,
  data_s: 'test string data',
  data_n: 123456789,
  bits: TestBits.data(TestBits.by(['a', 'c', 'e'])),
}

function TestData() {
  const [test, setTest] = usePushState(data)
  const [bkup, setBkup] = useLocalStorage('BKUP', data)
  useEffect(() => {
    setTest(data)
    setBkup(data)
  }, [])
  return (
    <p>
      <b>{test.data_b ? '〇' : '✖'}</b>
      <b>{test.data_s}</b>
      <b>{test.data_n}</b>
      <b>{test.bits.is?.a ? '〇' : '✖'}</b>
      <b>{test.bits.is?.b ? '〇' : '✖'}</b>
      <b>{test.bits.is?.c ? '〇' : '✖'}</b>
      <b>{test.bits.is?.d ? '〇' : '✖'}</b>
      <b>{test.bits.is?.e ? '〇' : '✖'}</b>
      <b>{test.bits.is?.f ? '〇' : '✖'}</b>
      <b>{test.bits.is?.g ? '〇' : '✖'}</b>
      <b>{location.href}</b>
    </p>
  )
}
test('basic value', () => {
  const c = render(<TestData />)
  expect(c.container).toMatchSnapshot()
  c.rerender(<TestData />)
  expect(c.container).toMatchSnapshot()
  c.unmount()
  expect(c.container).toMatchSnapshot()
  expect(data).toMatchSnapshot()
})
