import { Bits } from '../lib/bits'

const TestBits = new Bits(['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const)
const ShowBits = new Bits([
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
] as const)

test('standard use case', ()=> {
  const data = ShowBits.by(15)
})

test('basic value', () => {
  const testValue = TestBits.by(TestBits.labels)
  const testBits = TestBits.data(testValue)
  expect(TestBits).toMatchSnapshot()
  expect(TestBits.labels).toEqual(TestBits.by(testValue))

  expect(testBits).toMatchSnapshot()
  expect(testBits.is.g).toMatchSnapshot()
  expect(testBits.is.f).toMatchSnapshot()
  expect(testBits.is.e).toMatchSnapshot()
  expect(testBits.is.d).toMatchSnapshot()
  expect(testBits.is.c).toMatchSnapshot()
  expect(testBits.is.b).toMatchSnapshot()
  expect(testBits.is.a).toMatchSnapshot()
})

test('showlabel value', () => {
  const testValue = ShowBits.by(ShowBits.labels)
  const testBits = ShowBits.data(testValue)
  expect(ShowBits).toMatchSnapshot()
  expect(ShowBits.labels).toEqual(ShowBits.by(testValue))

  expect(testBits).toMatchSnapshot()
  expect(testBits.is.pin).toMatchSnapshot()
  expect(testBits.is.toc).toMatchSnapshot()
  expect(testBits.is.potof).toMatchSnapshot()
  expect(testBits.is.current).toMatchSnapshot()
  expect(testBits.is.search).toMatchSnapshot()
  expect(testBits.is.magnify).toMatchSnapshot()
  expect(testBits.is.side).toMatchSnapshot()
  expect(testBits.is.link).toMatchSnapshot()
  expect(testBits.is.mention).toMatchSnapshot()
  expect((testBits.is as any).other).toMatchSnapshot()
})

test('field calc', () => {
  expect(true).toEqual(Bits.isSingle(0b100000))
  expect(false).toEqual(Bits.isSingle(0b100100))
  expect(0b01100).toEqual(Bits.firstOff(0b01110))
  expect(0b01110).toEqual(Bits.firstOff(0b01111))
  expect(0b01101).toEqual(Bits.firstOn(0b01100))
  expect(0b00111).toEqual(Bits.firstOn(0b00011))
  expect(0b00010).toEqual(Bits.findBitOn(0b01110))
  expect(0b00010).toEqual(Bits.findBitOn(0b11110))
  expect(0b00001).toEqual(Bits.findBitOff(0b01100))
  expect(0b00100).toEqual(Bits.findBitOff(0b10011))
  expect(0b01111).toEqual(Bits.fillHeadsToOn(0b01100))
  expect(0b10011).toEqual(Bits.fillHeadsToOn(0b10011))
  expect(0b01100).toEqual(Bits.fillHeadsToOff(0b01100))
  expect(0b10000).toEqual(Bits.fillHeadsToOff(0b10011))
  expect(0b00000).toEqual(Bits.headsBitOn(0b01100))
  expect(0b00011).toEqual(Bits.headsBitOn(0b10011))
  expect(0b00011).toEqual(Bits.headsBitOff(0b01100))
  expect(0b00000).toEqual(Bits.headsBitOff(0b10011))
  expect(0b00111).toEqual(Bits.headsBitOffAndNextOn(0b01100))
  expect(0b00001).toEqual(Bits.headsBitOffAndNextOn(0b10011))

  expect(0b00010).toEqual(Bits.snoob(0b00001))
  expect(0b00110).toEqual(Bits.snoob(0b00101))

  expect(4).toEqual(Bits.count(0b110110))
  expect(3).toEqual(Bits.count(0b101100))
  expect(2).toEqual(Bits.count(0b000110))
})
