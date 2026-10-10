import { describe, expect, it } from 'vitest';
import { personNamesMatch } from './person-name-match.js';

describe('personNamesMatch', () => {
  it.each([
    ['VISHAL V.', 'Vishal V'],
    ['Vishal V.', 'vishal v'],
    ['V Vishal', 'Vishal V'],
    ['Vishal Venkatesan', 'Vishal V'],
    ['Vishal Kumar Venkatesan', 'Vishal Venkatesan'],
    ['José Álvarez', 'Jose Alvarez'],
    ['Vishal', 'vishal'],
  ])('matches %s ~ %s', (credentialName, accountName) => {
    expect(personNamesMatch(credentialName, accountName)).toBe(true);
  });

  it.each([
    ['Priya Sharma', 'Vishal V'],
    ['Vishal Kumar', 'Vishal V'],
    ['Vishal', 'Vishal V'],
    ['V V', 'Vishal Venkatesan'],
    ['', 'Vishal V'],
    ['Vishal V', '   '],
  ])('rejects %s ~ %s', (credentialName, accountName) => {
    expect(personNamesMatch(credentialName, accountName)).toBe(false);
  });
});
