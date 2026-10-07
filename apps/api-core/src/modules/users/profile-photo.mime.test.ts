import { describe, expect, it } from 'vitest';

import {
  isAllowedProfilePhotoMimeType,
  normalizeProfilePhotoMimeType,
} from './profile-photo.mime.js';

describe('normalizeProfilePhotoMimeType', () => {
  it('keeps supported mime types', () => {
    expect(normalizeProfilePhotoMimeType('a.png', 'image/png')).toBe('image/png');
  });

  it('infers jpeg from extension when mime is missing', () => {
    expect(normalizeProfilePhotoMimeType('avatar.jpg', 'application/octet-stream')).toBe(
      'image/jpeg',
    );
  });

  it('maps image/jpg alias to image/jpeg', () => {
    expect(normalizeProfilePhotoMimeType('a.jpg', 'image/jpg')).toBe('image/jpeg');
  });

  it('does not map webp extension to image/webp', () => {
    expect(normalizeProfilePhotoMimeType('photo.webp', 'application/octet-stream')).toBe(
      'application/octet-stream',
    );
  });
});

describe('isAllowedProfilePhotoMimeType', () => {
  it('accepts normalized jpeg', () => {
    expect(isAllowedProfilePhotoMimeType('image/jpeg')).toBe(true);
  });

  it('accepts png', () => {
    expect(isAllowedProfilePhotoMimeType('image/png')).toBe(true);
  });

  it('rejects gif', () => {
    expect(isAllowedProfilePhotoMimeType('image/gif')).toBe(false);
  });

  it('rejects webp', () => {
    expect(isAllowedProfilePhotoMimeType('image/webp')).toBe(false);
  });
});
