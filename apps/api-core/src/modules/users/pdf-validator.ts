import zlib from 'node:zlib';
import { RESUME_VALIDATION_MESSAGES } from '@hirekiwi/contracts';

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  /**
   * Extracted readable text — present whenever the PDF is structurally valid
   * and readable, even if the text is sparse. Callers use this for semantic
   * classification.
   */
  extractedText?: string;
}

/**
 * Validates that a buffer is a genuine, structurally sound, readable PDF.
 *
 * Responsibilities (deterministic only):
 *   1. Magic-bytes check  → ONLY_PDF_ALLOWED
 *   2. Structure check    → CORRUPTED_OR_UNREADABLE
 *   3. Text extraction    → CORRUPTED_OR_UNREADABLE when no text at all
 *
 * Returns { valid: true, extractedText } on success so the caller can run
 * semantic classification without re-parsing the buffer.
 */
export function validateAndExtractPdfResume(buffer: Buffer): PdfValidationResult {
  // 1. Magic bytes check
  if (buffer.byteLength < 32 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return { valid: false, error: RESUME_VALIDATION_MESSAGES.ONLY_PDF_ALLOWED };
  }

  // 2. Structural integrity check
  const latinStr = buffer.toString('latin1');
  const hasEof = latinStr.includes('%%EOF');
  const hasStreams = latinStr.includes('stream') && latinStr.includes('endstream');
  const hasObjects = latinStr.includes('obj') && latinStr.includes('endobj');

  if (!hasEof && !hasStreams && !hasObjects) {
    return { valid: false, error: RESUME_VALIDATION_MESSAGES.CORRUPTED_OR_UNREADABLE };
  }

  // 3. Text extraction — a structurally valid PDF that produces no readable
  //    text at all is treated as unreadable/corrupted.
  let extractedText = '';
  try {
    extractedText = extractPdfBufferText(buffer);
  } catch {
    return { valid: false, error: RESUME_VALIDATION_MESSAGES.CORRUPTED_OR_UNREADABLE };
  }

  if (!extractedText || extractedText.trim().length < 40) {
    return { valid: false, error: RESUME_VALIDATION_MESSAGES.CORRUPTED_OR_UNREADABLE };
  }

  // Structural validation passed — semantic classification is the caller's job.
  return { valid: true, extractedText };
}

function extractPdfBufferText(buffer: Buffer): string {
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const latinStr = buffer.toString('latin1');
  const cmapDict: Record<string, string> = {};
  const decompressedStreams: string[] = [];

  let pos = 0;
  while (pos < latinStr.length) {
    const streamIdx = latinStr.indexOf('stream', pos);
    if (streamIdx === -1) break;

    const endStreamIdx = latinStr.indexOf('endstream', streamIdx);
    if (endStreamIdx === -1) break;

    const dictSnippet = latinStr.slice(Math.max(0, streamIdx - 300), streamIdx);
    // Skip binary image streams (images never contain text operators or CMaps)
    const isImage = /\/Subtype\s*\/Image\b/i.test(dictSnippet);

    if (!isImage) {
      let startData = streamIdx + 6;
      if (latinStr[startData] === '\r') startData++;
      if (latinStr[startData] === '\n') startData++;

      const lenMatch = dictSnippet.match(/\/Length\s+(\d+)\b/);
      const declaredLen = lenMatch && lenMatch[1] ? parseInt(lenMatch[1], 10) : 0;

      const candidates: Uint8Array[] = [];
      if (declaredLen > 0 && startData + declaredLen <= bytes.length) {
        candidates.push(bytes.subarray(startData, startData + declaredLen));
      }
      candidates.push(bytes.subarray(startData, endStreamIdx));
      let trimEnd = endStreamIdx;
      if (latinStr[trimEnd - 1] === '\n') trimEnd--;
      if (latinStr[trimEnd - 1] === '\r') trimEnd--;
      if (trimEnd < endStreamIdx) {
        candidates.push(bytes.subarray(startData, trimEnd));
      }

      let decompressed: string | null = null;
      for (const cand of candidates) {
        let streamBytes = cand;
        const isAscii85 =
          dictSnippet.includes('85Decode') ||
          latinStr.slice(startData, startData + 10).includes('<~');

        if (isAscii85) {
          const asciiStr = Buffer.from(streamBytes).toString('latin1');
          streamBytes = new Uint8Array(decodeASCII85(asciiStr));
        }

        try {
          const buf = Buffer.from(
            streamBytes.buffer,
            streamBytes.byteOffset,
            streamBytes.byteLength,
          );
          decompressed = zlib.inflateSync(buf).toString('utf-8');
          break;
        } catch {
          try {
            const buf = Buffer.from(
              streamBytes.buffer,
              streamBytes.byteOffset,
              streamBytes.byteLength,
            );
            decompressed = zlib.inflateRawSync(buf).toString('utf-8');
            break;
          } catch {
            // try next candidate
          }
        }
      }

      if (decompressed) {
        decompressedStreams.push(decompressed);
      } else if (startData < endStreamIdx) {
        decompressedStreams.push(
          Buffer.from(bytes.subarray(startData, endStreamIdx)).toString('utf-8'),
        );
      }
    }
    pos = endStreamIdx + 9;
  }

  for (const decompressedStr of decompressedStreams) {
    if (decompressedStr.includes('/CIDInit') || decompressedStr.includes('begincmap')) {
      Object.assign(cmapDict, parseCMapStream(decompressedStr));
    }
  }

  let extractedText = '';

  for (const decompressedStr of decompressedStreams) {
    // 1. Tokenize PDF stream showing operators across the entire stream
    // Handles multiline [ ... ] TJ arrays, <hex> Tj, and (str) Tj / ' / "
    const tokens = [
      ...decompressedStr.matchAll(
        /<([0-9a-fA-F\s]+)>\s*T[jJ]|\[([\s\S]*?)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*(?:T[jJ]|['"])/g,
      ),
    ];

    for (const [, singleHex, tjArray, plainTj] of tokens) {
      if (singleHex) {
        extractedText += decodeHexToken(singleHex.replace(/\s+/g, ''), cmapDict) + ' ';
      } else if (tjArray) {
        // Sequentially extract tokens inside the TJ array to preserve natural reading order
        const subTokens = [...tjArray.matchAll(/<([0-9a-fA-F\s]+)>|\(((?:[^()\\]|\\.)*)\)/g)];
        for (const [, hex, str] of subTokens) {
          if (hex) {
            extractedText += decodeHexToken(hex.replace(/\s+/g, ''), cmapDict);
          } else if (str) {
            extractedText += unescapePdfString(str) + ' ';
          }
        }
        extractedText += ' ';
      } else if (plainTj) {
        extractedText += unescapePdfString(plainTj) + ' ';
      }
    }

    // 2. If no Tj/TJ tokens matched, attempt extracting all literal strings from the stream
    if (tokens.length === 0) {
      const literalStrings = [...decompressedStr.matchAll(/\(((?:[^()\\]|\\.)*)\)/g)];
      let streamLiteralText = '';
      for (const [, str] of literalStrings) {
        if (str && str.trim().length >= 2) {
          streamLiteralText += unescapePdfString(str) + ' ';
        }
      }
      if (streamLiteralText.trim().length >= 40) {
        extractedText += streamLiteralText + ' ';
      } else {
        const runs = extractPrintableRuns(decompressedStr);
        if (runs.length >= 40) {
          extractedText += runs + ' ';
        }
      }
    }
  }

  // 3. Fallback: if text is still too sparse, search printable runs in decompressed streams
  if (extractedText.trim().length < 40) {
    for (const decompressedStr of decompressedStreams) {
      const runs = extractPrintableRuns(decompressedStr);
      if (runs.length >= 40) {
        extractedText += runs + ' ';
      }
    }
  }

  if (extractedText.trim().length < 40) {
    const rawStrings = [...latinStr.matchAll(/\(((?:[^()\\]|\\.)*)\)/g)];
    for (const [, str] of rawStrings) {
      if (str && str.trim().length >= 3) {
        extractedText += unescapePdfString(str) + ' ';
      }
    }
  }

  return extractedText
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unescapePdfString(str: string): string {
  const unescaped = str
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\([()\\])/g, '$1');

  // Handle UTF-16 text (either BOM \xFE\xFF / \uFEFF / \uFFFD or interleaved null bytes)
  if (
    unescaped.charCodeAt(0) === 0xfeff ||
    (unescaped.length >= 2 &&
      unescaped.charCodeAt(0) === 0xfe &&
      unescaped.charCodeAt(1) === 0xff) ||
    (unescaped.includes('\x00') && unescaped.length >= 4)
  ) {
    const stripped = unescaped.replace(/^[\uFEFF\uFFFD]+/, '').replace(/^\xFE\xFF/, '');
    let decoded = '';
    for (let i = 0; i < stripped.length; i++) {
      const code = stripped.charCodeAt(i);
      if (code !== 0 && code >= 32 && code <= 126) {
        decoded += stripped[i];
      } else if (code === 0x2013 || code === 0x2014) {
        decoded += '-';
      }
    }
    if (decoded.length >= 2) {
      return decoded;
    }
  }

  return unescaped;
}

function decodeCMapTarget(toHex: string): string {
  if (toHex.length <= 4) {
    const code = parseInt(toHex, 16);
    if (code === 0x2022 || code === 0x2023 || code === 0x25cf) return ' ';
    if (code === 0x2013 || code === 0x2014) return '-';
    if (code === 0x2018 || code === 0x2019) return "'";
    if (code === 0x201c || code === 0x201d) return '"';
    if (code === 0x00a0) return ' ';
    if (code >= 32 && code <= 126) return String.fromCharCode(code);
    return ' ';
  }
  // Ligature or multi-character sequence (e.g. 00660069 for "fi")
  let out = '';
  for (let j = 0; j < toHex.length; j += 4) {
    const code = parseInt(toHex.slice(j, j + 4), 16);
    if (code >= 32 && code <= 126) {
      out += String.fromCharCode(code);
    } else if (code === 0x2013 || code === 0x2014) {
      out += '-';
    } else {
      out += ' ';
    }
  }
  return out;
}

function decodeHexToken(hexToken: string, cmapDict: Record<string, string>): string {
  let out = '';
  for (let i = 0; i < hexToken.length; i += 4) {
    const hex4 = hexToken
      .slice(i, i + 4)
      .padStart(4, '0')
      .toLowerCase();
    if (cmapDict[hex4]) {
      out += cmapDict[hex4];
      continue;
    }
    // Check 2-byte fallback if hexToken has 2 chars per glyph
    const hex2a = hexToken
      .slice(i, i + 2)
      .padStart(4, '0')
      .toLowerCase();
    const hex2b = hexToken
      .slice(i + 2, i + 4)
      .padStart(4, '0')
      .toLowerCase();
    if (cmapDict[hex2a] || cmapDict[hex2b]) {
      if (cmapDict[hex2a]) out += cmapDict[hex2a];
      if (cmapDict[hex2b]) out += cmapDict[hex2b];
      continue;
    }
    const val4 = parseInt(hex4, 16);
    if (val4 >= 32 && val4 <= 126) {
      out += String.fromCharCode(val4);
      continue;
    }
    const val2a = parseInt(hexToken.slice(i, i + 2), 16);
    const val2b = parseInt(hexToken.slice(i + 2, i + 4), 16);
    if (val2a >= 32 && val2a <= 126) out += String.fromCharCode(val2a);
    if (val2b >= 32 && val2b <= 126) out += String.fromCharCode(val2b);
  }
  return out;
}

function parseCMapStream(stream: string): Record<string, string> {
  const cmap: Record<string, string> = {};

  // 1. Single character mappings: <fromHex> <toHex>
  const charMatches = stream.matchAll(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g);
  for (const [, fromHex, toHex] of charMatches) {
    if (fromHex && toHex) {
      cmap[fromHex.padStart(4, '0').toLowerCase()] = decodeCMapTarget(toHex);
    }
  }

  // 2. Range mappings Format A: <startHex> <endHex> <startTargetHex>
  const rangeMatches = stream.matchAll(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g);
  for (const [, startHex, endHex, targetHex] of rangeMatches) {
    if (startHex && endHex && targetHex) {
      const start = parseInt(startHex, 16);
      const end = parseInt(endHex, 16);
      let target = parseInt(targetHex, 16);
      if (end >= start && end - start < 256) {
        for (let code = start; code <= end; code++, target++) {
          cmap[code.toString(16).padStart(4, '0').toLowerCase()] = decodeCMapTarget(
            target.toString(16).padStart(4, '0'),
          );
        }
      }
    }
  }

  // 3. Range mappings Format B: <startHex> <endHex> [ <targetHex1> <targetHex2> ... ]
  const rangeArrayMatches = stream.matchAll(
    /<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s*\[([\s\S]*?)\]/g,
  );
  for (const [, startHex, , arrayContent] of rangeArrayMatches) {
    if (startHex && arrayContent) {
      const start = parseInt(startHex, 16);
      const targets = [...arrayContent.matchAll(/<([0-9a-fA-F]+)>/g)];
      targets.forEach(([, targetHex], idx) => {
        if (targetHex) {
          cmap[(start + idx).toString(16).padStart(4, '0').toLowerCase()] =
            decodeCMapTarget(targetHex);
        }
      });
    }
  }

  return cmap;
}

function decodeASCII85(str: string): number[] {
  const clean = str.replace(/<~|~>|\s/g, '');
  const out: number[] = [];
  let count = 0;
  let val = 0;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charCodeAt(i);
    if (ch === 122 && count === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    if (ch < 33 || ch > 117) continue;
    val = val * 85 + (ch - 33);
    count++;
    if (count === 5) {
      out.push((val >>> 24) & 255, (val >>> 16) & 255, (val >>> 8) & 255, val & 255);
      val = 0;
      count = 0;
    }
  }
  if (count > 1) {
    for (let i = 0; i < 5 - count; i++) val = val * 85 + 84;
    for (let i = 0; i < count - 1; i++) out.push((val >>> (24 - i * 8)) & 255);
  }
  return out;
}

function extractPrintableRuns(text: string): string {
  const runs = text.match(/[A-Za-z0-9@.,:/\-_+()#]{4,}/g) ?? [];
  return runs.join(' ').trim();
}
