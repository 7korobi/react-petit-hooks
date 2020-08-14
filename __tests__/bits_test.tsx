import { Bits, BitsShadow } from '../lib/bits'

const TestLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const
const ShowLabels = [
  'pin',
  'toc',
  'toc',
  'potof',
  'current',
  'search',
  'magnify',
  'side',
  'link',
  'mention',
] as const

const TestBits = Bits(TestLabels)
const ShowBits = Bits(ShowLabels)

test('basic value', () => {
  const testValue = TestBits.by(TestLabels)
  const [testAccu,testBits] = TestBits.is(testValue)
  expect(TestBits).toMatchSnapshot()
  expect(TestLabels).toEqual(TestBits.by(testValue))

  expect(testAccu).toMatchSnapshot()
  expect(testBits.g).toMatchSnapshot()
  expect(testBits.f).toMatchSnapshot()
  expect(testBits.e).toMatchSnapshot()
  expect(testBits.d).toMatchSnapshot()
  expect(testBits.c).toMatchSnapshot()
  expect(testBits.b).toMatchSnapshot()
  expect(testBits.a).toMatchSnapshot()
})

test('showlabel value', () => {
  const testValue = ShowBits.by(ShowLabels)
  const [testAccu,testBits] = ShowBits.is(testValue)
  expect(ShowBits).toMatchSnapshot()
  expect(ShowLabels).toEqual(ShowBits.by(testValue))

  expect(testAccu).toMatchSnapshot()
  expect(testBits.pin).toMatchSnapshot()
  expect(testBits.toc).toMatchSnapshot()
  expect(testBits.potof).toMatchSnapshot()
  expect(testBits.current).toMatchSnapshot()
  expect(testBits.search).toMatchSnapshot()
  expect(testBits.magnify).toMatchSnapshot()
  expect(testBits.side).toMatchSnapshot()
  expect(testBits.link).toMatchSnapshot()
  expect(testBits.mention).toMatchSnapshot()
  expect((testBits as any).other).toMatchSnapshot()
})

test('field calc', () => {
  expect(true).toEqual(ShowBits.isOneBit(0b100000))
  expect(false).toEqual(ShowBits.isOneBit(0b100100))
  expect(0b01100).toEqual(ShowBits.firstOut(0b01110))
  expect(0b01110).toEqual(ShowBits.firstOut(0b01111))
  expect(0b01101).toEqual(ShowBits.firstIn(0b01100))
  expect(0b00111).toEqual(ShowBits.firstIn(0b00011))
  expect(0b00010).toEqual(ShowBits.findBitOn(0b01110))
  expect(0b00010).toEqual(ShowBits.findBitOn(0b11110))
  expect(0b00001).toEqual(ShowBits.findBitOff(0b01100))
  expect(0b00100).toEqual(ShowBits.findBitOff(0b10011))
  expect(0b01111).toEqual(ShowBits.fillHeadsToOn(0b01100))
  expect(0b10011).toEqual(ShowBits.fillHeadsToOn(0b10011))
  expect(0b01100).toEqual(ShowBits.fillHeadsToOff(0b01100))
  expect(0b10000).toEqual(ShowBits.fillHeadsToOff(0b10011))
  expect(0b00000).toEqual(ShowBits.headsBitOn(0b01100))
  expect(0b00011).toEqual(ShowBits.headsBitOn(0b10011))
  expect(0b00011).toEqual(ShowBits.headsBitOff(0b01100))
  expect(0b00000).toEqual(ShowBits.headsBitOff(0b10011))
  expect(0b00111).toEqual(ShowBits.headsBitOffAndNextOn(0b01100))
  expect(0b00001).toEqual(ShowBits.headsBitOffAndNextOn(0b10011))

  expect(0b00010).toEqual(ShowBits.snoob(0b00001))
  expect(0b00110).toEqual(ShowBits.snoob(0b00101))

  expect(4).toEqual(ShowBits.count(0b110110))
  expect(3).toEqual(ShowBits.count(0b101100))
  expect(2).toEqual(ShowBits.count(0b000110))
})
