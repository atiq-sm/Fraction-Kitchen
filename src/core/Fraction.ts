export class Fraction {
  readonly num: number;
  readonly den: number;

  constructor(num: number, den: number) {
    if (den === 0) throw new Error('Denominator cannot be zero');

    if (num === 0) {
      this.num = 0;
      this.den = 1;
      return;
    }

    const sign = Math.sign(num) * Math.sign(den);
    const absNum = Math.abs(num);
    const absDen = Math.abs(den);
    const g = Fraction.gcd(absNum, absDen);

    this.num = sign * (absNum / g);
    this.den = absDen / g;
  }

  static zero(): Fraction {
    return new Fraction(0, 1);
  }

  static fromInt(n: number): Fraction {
    return new Fraction(n, 1);
  }

  add(o: Fraction): Fraction {
    return new Fraction(this.num * o.den + o.num * this.den, this.den * o.den);
  }

  subtract(o: Fraction): Fraction {
    return new Fraction(this.num * o.den - o.num * this.den, this.den * o.den);
  }

  equals(o: Fraction): boolean {
    return this.num === o.num && this.den === o.den;
  }

  compare(o: Fraction): -1 | 0 | 1 {
    const diff = this.num * o.den - o.num * this.den;
    if (diff < 0) return -1;
    if (diff > 0) return 1;
    return 0;
  }

  value(): number {
    return this.num / this.den;
  }

  simplify(): Fraction {
    return new Fraction(this.num, this.den);
  }

  toString(): string {
    if (this.den === 1) return `${this.num}`;
    return `${this.num}/${this.den}`;
  }

  toMixedString(): string {
    if (this.den === 1) return `${this.num}`;
    const absNum = Math.abs(this.num);
    if (absNum < this.den) return this.toString();
    const whole = Math.floor(absNum / this.den);
    const remainder = absNum % this.den;
    const sign = this.num < 0 ? '-' : '';
    if (remainder === 0) return `${sign}${whole}`;
    return `${sign}${whole} ${remainder}/${this.den}`;
  }

  isWhole(): boolean {
    return this.den === 1;
  }

  isZero(): boolean {
    return this.num === 0;
  }

  private static gcd(a: number, b: number): number {
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }
}
