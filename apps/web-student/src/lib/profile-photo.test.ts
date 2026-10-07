import { describe, expect, it } from 'vitest';
import {
  PROFILE_PHOTO_MAX_BYTES,
  profilePhotoDisplayUrl,
  validateProfilePhotoFile,
  validateProfilePhotoImage,
} from './profile-photo';

function file(type: string, sizeBytes: number, name = 'photo.png'): File {
  return { type, size: sizeBytes, name } as File;
}

function makeImage(width: number, height: number): ImageData {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData;
}

function fillRect(
  image: ImageData,
  x0: number,
  y0: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      const i = (y * image.width + x) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = 255;
    }
  }
}

describe('validateProfilePhotoFile', () => {
  it('accepts supported image types within the size limit', () => {
    expect(validateProfilePhotoFile(file('image/png', PROFILE_PHOTO_MAX_BYTES))).toBeNull();
    expect(validateProfilePhotoFile(file('image/jpeg', 1024))).toBeNull();
  });

  it('rejects unsupported mime types', () => {
    expect(validateProfilePhotoFile(file('image/gif', 1024, 'animation.gif'))).toMatch(
      /JPEG and PNG/i,
    );
  });

  it('rejects webp format explicitly', () => {
    expect(validateProfilePhotoFile(file('image/webp', 1024, 'avatar.webp'))).toMatch(
      /JPEG and PNG/i,
    );
  });

  it('rejects files larger than 2MB', () => {
    expect(validateProfilePhotoFile(file('image/jpeg', PROFILE_PHOTO_MAX_BYTES + 1))).toMatch(
      /2MB/i,
    );
  });

  it('accepts common extensions when the browser omits mime type', () => {
    expect(validateProfilePhotoFile(file('', 1024, 'avatar.jpg'))).toBeNull();
    expect(validateProfilePhotoFile(file('', 1024, 'avatar.png'))).toBeNull();
  });
});

describe('profilePhotoDisplayUrl', () => {
  it('appends a cache-busting query parameter', () => {
    expect(profilePhotoDisplayUrl('https://cdn.example/photo.jpg', 123)).toBe(
      'https://cdn.example/photo.jpg?v=123',
    );
  });
});

describe('validateProfilePhotoImage', () => {
  it('rejects file when file validation fails before decoding', async () => {
    const result = await validateProfilePhotoImage(file('image/webp', 1024, 'test.webp'));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/JPEG and PNG/i);
  });

  it('returns error when image loader returns null', async () => {
    const result = await validateProfilePhotoImage(file('image/jpeg', 1024, 'corrupt.jpg'), {
      imageLoader: async () => null,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Could not read image data/i);
  });

  it('detects a valid single face', async () => {
    const validImage = makeImage(80, 60);
    fillRect(validImage, 28, 12, 24, 32, 210, 160, 130);

    const result = await validateProfilePhotoImage(file('image/jpeg', 1024, 'face.jpg'), {
      imageLoader: async () => validImage,
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.faceCheck?.faceCount).toBe(1);
    expect(result.faceCheck?.ok).toBe(true);
  });

  it('rejects when no face is found', async () => {
    const blankImage = makeImage(80, 60);

    const result = await validateProfilePhotoImage(file('image/png', 1024, 'blank.png'), {
      imageLoader: async () => blankImage,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/couldn't detect a clear face/i);
    expect(result.faceCheck?.faceCount).toBe(0);
  });

  it('rejects when multiple faces are detected', async () => {
    const multiImage = makeImage(80, 60);
    fillRect(multiImage, 10, 12, 16, 24, 210, 160, 130);
    fillRect(multiImage, 50, 12, 16, 24, 210, 160, 130);

    const result = await validateProfilePhotoImage(file('image/jpeg', 1024, 'group.jpg'), {
      imageLoader: async () => multiImage,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Multiple faces detected/i);
  });

  it('rejects when face is off-center or clipped', async () => {
    const offCenterImage = makeImage(80, 60);
    fillRect(offCenterImage, 0, 8, 14, 40, 210, 160, 130);

    const result = await validateProfilePhotoImage(file('image/jpeg', 1024, 'offcenter.jpg'), {
      imageLoader: async () => offCenterImage,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/centered and clearly visible/i);
  });
});
