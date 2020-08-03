import { Bits, debug } from '../lib/storage'

type IBits<T extends string> = { [P in T]: boolean }

const testLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const
type ITestLabels = typeof testLabels[number]
const TestBits = Bits.assign<ITestLabels>(testLabels)

test('basic value', () => {
  const testBits: IBits<ITestLabels> = TestBits.by(['a', 'c', 'e']) as any
  expect(TestBits.prototype).toMatchSnapshot()
  expect(testBits).toMatchSnapshot()
  expect(testBits.g).toMatchSnapshot()
  expect(testBits.f).toMatchSnapshot()
  expect(testBits.e).toMatchSnapshot()
  expect(testBits.d).toMatchSnapshot()
  expect(testBits.c).toMatchSnapshot()
  expect(testBits.b).toMatchSnapshot()
  expect(testBits.a).toMatchSnapshot()
})

function mapObject<K extends string>(obj: { [P in K]: boolean }): { [P in K]: boolean } {
  class Bare {}
  const o = (new Bare() as unknown) as { [P in K]: boolean }
  Object.keys(obj).forEach((key) => {
    o[key] = true
  })
  return o
}

const nameLengths = mapObject({
  firstName: true,
  lastName: true,
})

const r: Record<1 | 2, boolean> = { 1: true, 2: true }
