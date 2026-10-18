import { describe, it, expect } from 'vitest';
import { levels, bonusLevels } from './levels.js';
import { parseLevel } from './game.js';
import { fewestMoves } from './solver.js';

describe('levels', () => {
  it('has twenty levels', () => {
    expect(levels.length).toBe(20);
  });

  levels.forEach((rows, i) => {
    it(`level ${i + 1} has exactly one bloby and one hut`, () => {
      const text = rows.join('');
      expect(text.split('@').length - 1).toBe(1);
      expect(text.split('H').length - 1).toBe(1);
    });

    it(`level ${i + 1} is solvable`, () => {
      expect(fewestMoves(parseLevel(rows))).not.toBeNull();
    });
  });

  it('gets harder from level to level', () => {
    const lengths = levels.map((rows) => fewestMoves(parseLevel(rows)));
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i]).toBeGreaterThanOrEqual(lengths[i - 1]);
    }
  });
});

describe('bonus levels', () => {
  bonusLevels.forEach((rows, i) => {
    it(`bonus level ${i + 1} is solvable`, () => {
      expect(fewestMoves(parseLevel(rows))).not.toBeNull();
    });
  });
});
