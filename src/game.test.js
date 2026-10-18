import { describe, it, expect } from 'vitest';
import { parseLevel, move, isWon } from './game.js';

describe('parseLevel', () => {
  it('reads walls, boxes, bloby and the hut', () => {
    const state = parseLevel(['#####', '#@BH#', '#####']);
    expect(state.width).toBe(5);
    expect(state.height).toBe(3);
    expect(state.bloby).toEqual({ x: 1, y: 1 });
    expect(state.hut).toEqual({ x: 3, y: 1 });
    expect(state.boxes).toEqual([{ x: 2, y: 1 }]);
    expect(state.walls.has('0,0')).toBe(true);
    expect(state.walls.has('1,1')).toBe(false);
  });
});

describe('move', () => {
  it('moves bloby onto an empty field', () => {
    const state = parseLevel(['@ H']);
    expect(move(state, 'right').bloby).toEqual({ x: 1, y: 0 });
  });

  it('does not move bloby into a wall', () => {
    const state = parseLevel(['@#H']);
    expect(move(state, 'right')).toBe(state);
  });

  it('does not move bloby off the board', () => {
    const state = parseLevel(['@ H']);
    expect(move(state, 'left')).toBe(state);
  });

  it('pushes a box onto a free field', () => {
    const state = parseLevel(['@B H']);
    const next = move(state, 'right');
    expect(next.bloby).toEqual({ x: 1, y: 0 });
    expect(next.boxes).toEqual([{ x: 2, y: 0 }]);
  });

  it('does not push a box into a wall', () => {
    const state = parseLevel(['@B#H']);
    expect(move(state, 'right')).toBe(state);
  });

  it('does not push two boxes at once', () => {
    const state = parseLevel(['@BB H']);
    expect(move(state, 'right')).toBe(state);
  });

  it('does not push a box onto the hut', () => {
    const state = parseLevel(['@BH']);
    expect(move(state, 'right')).toBe(state);
  });

  it('counts moves', () => {
    const state = parseLevel(['@  H']);
    expect(move(move(state, 'right'), 'right').moves).toBe(2);
  });

  it('leaves the original state untouched', () => {
    const state = parseLevel(['@B H']);
    move(state, 'right');
    expect(state.bloby).toEqual({ x: 0, y: 0 });
    expect(state.boxes).toEqual([{ x: 1, y: 0 }]);
  });
});

describe('isWon', () => {
  it('is true once bloby reaches the hut', () => {
    const state = parseLevel(['@H']);
    expect(isWon(state)).toBe(false);
    expect(isWon(move(state, 'right'))).toBe(true);
  });
});
