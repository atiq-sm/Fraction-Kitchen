import { RNG } from './RNG';

export interface MathProblem {
  question: string;
  answer: number;
  choices: number[];
  type: 'addition' | 'subtraction' | 'multiplication';
}

export class MathProblemGenerator {
  private rng: RNG;

  constructor(seed: number) {
    this.rng = new RNG(seed);
  }

  generateAddition(difficulty: number): MathProblem {
    const range = this.rangeForDifficulty(difficulty);
    const a = this.rng.int(range.min, range.max);
    const b = this.rng.int(range.min, range.max);
    const answer = a + b;

    return {
      question: `${a} + ${b}`,
      answer,
      choices: this.generateChoices(answer, difficulty),
      type: 'addition',
    };
  }

  generateSubtraction(difficulty: number): MathProblem {
    const range = this.rangeForDifficulty(difficulty);
    let a = this.rng.int(range.min, range.max);
    let b = this.rng.int(range.min, range.max);
    if (b > a) [a, b] = [b, a];
    const answer = a - b;

    return {
      question: `${a} − ${b}`,
      answer,
      choices: this.generateChoices(answer, difficulty),
      type: 'subtraction',
    };
  }

  generateMultiplication(difficulty: number): MathProblem {
    const maxA = difficulty <= 2 ? 9 : difficulty <= 3 ? 12 : 15;
    const maxB = difficulty <= 2 ? 9 : difficulty <= 3 ? 12 : 12;
    const a = this.rng.int(2, maxA);
    const b = this.rng.int(2, maxB);
    const answer = a * b;

    return {
      question: `${a} × ${b}`,
      answer,
      choices: this.generateChoices(answer, difficulty),
      type: 'multiplication',
    };
  }

  generateMixed(difficulty: number): MathProblem {
    const type = this.rng.int(0, 2);
    switch (type) {
      case 0:
        return this.generateAddition(difficulty);
      case 1:
        return this.generateSubtraction(difficulty);
      default:
        return this.generateMultiplication(difficulty);
    }
  }

  generateBatch(
    type: 'addition' | 'subtraction' | 'multiplication' | 'mixed',
    count: number,
    difficulty: number,
  ): MathProblem[] {
    const problems: MathProblem[] = [];
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'addition':
          problems.push(this.generateAddition(difficulty));
          break;
        case 'subtraction':
          problems.push(this.generateSubtraction(difficulty));
          break;
        case 'multiplication':
          problems.push(this.generateMultiplication(difficulty));
          break;
        case 'mixed':
          problems.push(this.generateMixed(difficulty));
          break;
      }
    }
    return problems;
  }

  private rangeForDifficulty(d: number): { min: number; max: number } {
    switch (d) {
      case 1:
        return { min: 1, max: 9 };
      case 2:
        return { min: 5, max: 50 };
      case 3:
        return { min: 10, max: 99 };
      case 4:
        return { min: 20, max: 150 };
      default:
        return { min: 50, max: 300 };
    }
  }

  private generateChoices(correct: number, difficulty: number): number[] {
    const choices = new Set<number>([correct]);
    const spread = Math.max(5, Math.ceil(correct * 0.2) + difficulty * 2);

    while (choices.size < 4) {
      const offset = this.rng.int(1, spread) * (this.rng.float() > 0.5 ? 1 : -1);
      const wrong = correct + offset;
      if (wrong >= 0 && wrong !== correct) {
        choices.add(wrong);
      }
    }

    // Shuffle
    const arr = [...choices];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.rng.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
