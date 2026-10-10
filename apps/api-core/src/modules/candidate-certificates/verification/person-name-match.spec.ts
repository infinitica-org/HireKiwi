import { describe, expect, it } from 'vitest';
import { personNamesMatch, textContainsPersonName } from './person-name-match.js';

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

describe('textContainsPersonName', () => {
  it.each([
    ['Certificate awarded to VISHAL V. for completing', 'Vishal V'],
    ['awarded to V Vishal on 2024-05-01', 'Vishal V'],
    ['José Álvarez completed', 'Jose Alvarez'],
  ])('finds the name in %s', (text, name) => {
    expect(textContainsPersonName(text, name)).toBe(true);
  });

  it.each([
    ['Certificate awarded to Vishal Varma', 'Vishal V'],
    ['Vishal completed the course V2', 'Vishal V'],
    ['anything', ''],
  ])('does not find it in %s', (text, name) => {
    expect(textContainsPersonName(text, name)).toBe(false);
  });
});
