const BITLIMIT = 31
const BITMASK = 2 ** 31 - 1

type Labels<T extends readonly string[]> = T[number][]
type BitsDic<T extends readonly string[], X> = {
  [key in T[number]]: X
}

export class BitsData<T extends readonly string[]> extends Array {
  0: number
  1: BitsShadow<T>
  constructor(value: number, shadow: BitsShadow<T>) {
    super(2)
    this[0] = value
    this[1] = shadow
  }
}

export class BitsShadow<T extends readonly string[]> {
  labels: T
  mask: number
  posi: BitsDic<T, number>
  nega: BitsDic<T, number>
  idx: BitsDic<T, number>

  constructor(labels: T) {
    if (BITLIMIT < labels.length) {
      throw new Error('too much bits.')
    }
    this.labels = labels
    this.mask = 0
    this.posi = {} as any
    this.nega = {} as any
    this.idx = {} as any
    labels.forEach((label: T[number]) => {
      this.posi[label] = this.idx[label] = 0
      this.nega[label] = BITMASK
    })
    labels.forEach((label: T[number], idx) => {
      const posi = 2 ** idx
      const nega = BITMASK & ~posi
      this.mask |= posi
      this.posi[label] |= posi
      this.nega[label] &= nega
      this.idx[label] || (this.idx[label] = idx)
    })
  }

  by(src: T | Labels<T>): number
  by(src: number): Labels<T>
  by(src: T | Labels<T> | number): Labels<T> | number {
    if ('number' === typeof src) {
      const labels: Labels<T> = []
      this.labels.forEach((label: T[number]) => {
        if (src & this.posi[label]) {
          labels.push(label)
        }
      })
      return labels
    } else {
      let n = 0
      src.forEach((label: T[number]) => {
        n |= (this.posi[label] || 0) as number
      })
      return n
    }
  }

  is(n: number): [BitsData<T>, BitsDic<T, number>] {
    const o: BitsData<T> = new BitsData<T>(n, this)
    const proxy = new Proxy(o, {
      get([value, shadow], label: T[number]) {
        return value & shadow.posi[label]
      },
      set(data, label: T[number], set: number | boolean | null) {
        const [value, shadow] = data
        let bits: number
        switch (set) {
          case null:
          case false:
            bits = 0
            break
          case true:
            bits = shadow.posi[label]
            break
          default:
            bits = shadow.posi[label] & (set << shadow.idx[label])
        }
        data[0] = value & shadow.nega[label] | bits
        return true
      },
      has([value, shadow], label: T[number]) {
        return !!shadow.idx[label]
      },
    }) as any
    return [o, proxy]
  }

  isOneBit(x: number) {
    return 0 === (x & (x - 1))
  }

  firstOut(x: number) {
    return x & (x - 1)
  }
  firstIn(x: number) {
    return x | (x + 1)
  }

  firstLinksOut(x: number) {
    return ((x | (x - 1)) + 1) & x
  }
  firstLinksIn(x: number) {
    return ((x & (x + 1)) - 1) | x
  }

  findBitOn(x: number) {
    return x & -x
  }
  findBitOff(x: number) {
    return ~x & (x + 1)
  }

  fillHeadsToOn(x: number) {
    return x | (x - 1)
  }

  fillHeadsToOff(x: number) {
    return x & (x + 1)
  }

  headsBitOff(x: number) {
    return ~x & (x - 1)
  }
  headsBitOn(x: number) {
    return ~(~x | (x + 1))
  }

  headsBitOffAndNextOn(x: number) {
    return x ^ (x - 1)
  }

  snoob(x: number) {
    const minbit = x & -x
    const ripple = x + minbit
    const ones = ((x ^ ripple) >>> 2) / minbit
    return ripple | ones
  }

  count(x: number) {
    let n
    n = (x >>> 1) & 0x77777777
    x = x - n
    n = (n >>> 1) & 0x77777777
    x = x - n
    n = (n >>> 1) & 0x77777777
    x = x - n
    x = (x + (x >>> 4)) & 0x0f0f0f0f
    x = x * 0x01010101
    return x >>> 24
  }

  reverse(x: number) {

  }
}

export function Bits<T extends readonly string[]>(labels: T) {
  return new BitsShadow(labels)
}
