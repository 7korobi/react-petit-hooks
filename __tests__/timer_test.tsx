import { render, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import React from 'react'
import format from 'date-fns/format'
import locale from 'date-fns/locale/ja'

import { useRelativeTick } from '../lib/timer'

test('after gap', () => {
  let test_now = new Date().getTime() + 60000
  const c = render(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 35000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 50000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 35000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 59 * 60000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 23 * 3600000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 6 * 24 * 3600000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 7 * 24 * 3600000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()
})

test('before gap', () => {
  let test_now = new Date().getTime() + 60020
  const c = render(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 35000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 50000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 35000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 59 * 60000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 23 * 3600000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 6 * 24 * 3600000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()

  test_now -= 7 * 24 * 3600000
  c.rerender(<TestData since={test_now} />)
  expect(c.container).toMatchSnapshot()
})

function TestData({ since }: { since: number }) {
  const [text] = useRelativeTick(since, {
    limit: '2d',
    format: (since) => format(since, 'yyyy/MM/dd(EE)頃', { locale }),
  })
  return <>{text}</>
}
