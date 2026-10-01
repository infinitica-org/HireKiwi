import { afterEach, describe, expect, it } from 'vitest';
import {
  clearSkillVerifyDraft,
  readSkillVerifyDraft,
  writeSkillVerifyDraft,
} from './skill-verify-draft';

afterEach(() => window.sessionStorage.clear());

describe('skill-verify draft (S6-VV-162)', () => {
  it('round-trips answers per session and clears them', () => {
    writeSkillVerifyDraft('s-1', { 1: { selectedKey: 'B' }, 2: { text: 'because…' } });
    writeSkillVerifyDraft('s-2', { 1: { selectedKey: 'A' } });

    expect(readSkillVerifyDraft('s-1')).toEqual({
      1: { selectedKey: 'B' },
      2: { text: 'because…' },
    });
    clearSkillVerifyDraft('s-1');
    expect(readSkillVerifyDraft('s-1')).toEqual({});
    expect(readSkillVerifyDraft('s-2')).toEqual({ 1: { selectedKey: 'A' } });
  });

  it('treats a corrupt draft as empty instead of throwing', () => {
    window.sessionStorage.setItem('smart.skill-verify.draft.s-3', '{not json');
    expect(readSkillVerifyDraft('s-3')).toEqual({});
  });
});
