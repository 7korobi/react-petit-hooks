const BITLIMIT = 31
const BITMASK = 2 ** 31 - 1

type Labels<T extends readonly string[]> = T[number][]
type BitsDic<T extends readonly string[], X> = {
  [key in T[number]]: X
}

export class BitsData<T extends readonly string[]> {
  value: number
  field: Bits<T>
  is: BitsDic<T, number>
  constructor(value: number, field: Bits<T>) {
    this.value = value
    this.field = field
    this.is = new Proxy(this, {
      get({ value, field }: BitsData<T>, label: T[number]) {
        return value & field.posi[label]
      },
      set(data: BitsData<T>, label: T[number], set: number | boolean | null) {
        const { value, field } = data
        let bits: number
        switch (set) {
          case null:
          case false:
            bits = 0
            break
          case true:
            bits = field.posi[label]
            break
          default:
            bits = field.posi[label] & (set << field.idx[label])
        }
        data.value = (value & field.nega[label]) | bits
        return true
      },
      has({ field }: BitsData<T>, label: T[number]) {
        return !!field.idx[label]
      },
    }) as any
  }
}

export class Bits<T extends readonly string[]> {
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

  data(n: number) {
    return new BitsData<T>(n, this)
  }

  to_str(n: number | BitsData<T>) {
    if (n instanceof BitsData) {
      n = n.value
    }
    return n.toString(36)
  }

  by_str(str: string | null | undefined): BitsData<T> {
    return this.data(str ? parseInt(str, 36) : 0)
  }

  to_url(n: number | BitsData<T>) {
    if (n instanceof BitsData) {
      n = n.value
    }
    return JSON.stringify(this.by(n))
  }

  static isSingle(x: number) {
    return 0 === (x & (x - 1))
  }

  static firstOff(x: number) {
    return x & (x - 1)
  }
  static firstOn(x: number) {
    return x | (x + 1)
  }

  static firstLinksOff(x: number) {
    return ((x | (x - 1)) + 1) & x
  }
  static firstLinksOn(x: number) {
    return ((x & (x + 1)) - 1) | x
  }

  static findBitOn(x: number) {
    return x & -x
  }
  static findBitOff(x: number) {
    return ~x & (x + 1)
  }

  static fillHeadsToOn(x: number) {
    return x | (x - 1)
  }

  static fillHeadsToOff(x: number) {
    return x & (x + 1)
  }

  static headsBitOff(x: number) {
    return ~x & (x - 1)
  }
  static headsBitOn(x: number) {
    return ~(~x | (x + 1))
  }

  static headsBitOffAndNextOn(x: number) {
    return x ^ (x - 1)
  }

  static snoob(x: number) {
    const minbit = x & -x
    const ripple = x + minbit
    const ones = ((x ^ ripple) >>> 2) / minbit
    return ripple | ones
  }

  static count(x: number) {
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
}
