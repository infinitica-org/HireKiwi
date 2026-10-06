/**
 * S6-VV-162 (#613 F2): a per-session copy of skill-verify answers in sessionStorage, so a refresh,
 * crash or dropped connection between saves doesn't lose what the student typed. Server answers
 * load first and this draft overlays them, because it is never older than the last save.
 */
export type SkillVerifyAnswers = Record<number, { selectedKey?: string; text?: string }>;

const draftKey = (sessionId: string) => `smart.skill-verify.draft.${sessionId}`;

export function readSkillVerifyDraft(sessionId: string): SkillVerifyAnswers {
  try {
    const raw = window.sessionStorage.getItem(draftKey(sessionId));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as SkillVerifyAnswers) : {};
  } catch {
    return {};
  }
}

export function writeSkillVerifyDraft(sessionId: string, answers: SkillVerifyAnswers): void {
  try {
    window.sessionStorage.setItem(draftKey(sessionId), JSON.stringify(answers));
  } catch {
    // Storage full or blocked: the server autosave still runs.
  }
}

export function clearSkillVerifyDraft(sessionId: string): void {
  try {
    window.sessionStorage.removeItem(draftKey(sessionId));
  } catch {
    // Nothing to clean up.
  }
}
