/**
 * Shared TTS utilities used by both client-side and server-side generation.
 */

import type { TTSProviderId } from './types';
import type { Action, SpeechAction } from '@/lib/types/action';
import { createLogger } from '@/lib/logger';

const log = createLogger('TTS');

// Pronunciation map: words TTS mispronounces → phonetic spelling
const TTS_PRONUNCIATIONS: [RegExp, string][] = [
  [/24\/7\/365/g, '24 7 365'],
  [/24\/7/g, '24 7'],
  // Numbers with k/K suffix → spoken form (e.g. "17k" → "17 thousand")
  [/(\d+(?:\.\d+)?)K\+/gi, '$1 thousand plus'],
  [/(\d+(?:\.\d+)?)K/gi, '$1 thousand'],
  // Large numbers with commas → remove commas so TTS reads them correctly
  [/(\d{1,3}),(\d{3}),(\d{3})/g, '$1$2$3'],
  [/(\d{1,3}),(\d{3})/g, '$1$2'],
  // tx/s and tx/sec → "transactions per second"
  [/\btx\/s\b/gi, 'transactions per second'],
  [/\btx\/sec\b/gi, 'transactions per second'],
  // Hash/number symbol before digits → "number"
  [/#(\d)/g, 'number $1'],
  [/\bDeFi\b/gi, 'Dee Fie'],
  [/\bNFTs\b/g, 'en eff tees'],
  [/\bNFT\b/g, 'en eff tee'],
  [/\bXRPLs\b/g, 'X-R-P-L'],
  [/\bXRPL\b/g, 'X-R-P-L'],
  [/\bXRP\b/g, 'X-R-P'],
  [/\bDAOs\b/g, 'dows'],
  [/\bDAO\b/g, 'dow'],
  [/\bDEXes\b/g, 'dexes'],
  [/\bdexes\b/g, 'dexes'],
  [/\bDEX\b/g, 'decks'],
  [/\bCEXes\b/g, 'C-E-Xes'],
  [/\bCEX\b/g, 'C-E-X'],
  [/\bAMMs\b/g, 'A-M-Ms'],
  [/\bAMM\b/g, 'A-M-M'],
  [/\bMEV\b/g, 'M-E-V'],
  [/\bRSI\b/g, 'R-S-I'],
  [/\bEVM\b/g, 'E-V-M'],
  [/\bUTXO\b/g, 'U-T-X-O'],
  [/\bTVL\b/g, 'T-V-L'],
  [/\bBIP\b/g, 'B-I-P'],
  [/\bODL\b/g, 'O-D-L'],
  [/\bRPCA\b/g, 'R-P-C-A'],
  [/\bAPY\b/g, 'A-P-Y'],
  [/\bAPR\b/g, 'A-P-R'],
  [/\bBitunix\b/g, 'Bit-you-nix'],
  [/\bHODL\b/g, 'hoddle'],
  [/\bMACD\b/g, 'mac D'],
];

/**
 * Sanitize text before passing to TTS:
 * - Strip emoji characters (browser TTS reads them as descriptions)
 * - Strip HTML tags
 * - Fix orphan periods and double spaces left by HTML stripping
 * - Apply pronunciation corrections for crypto acronyms
 */
export function sanitizeSpeechText(text: string): string {
  let t = text;
  // Replace ellipsis (typed or unicode) with a comma pause before stripping anything else
  t = t.replace(/\.{3,}|…/g, ', ');
  // Remove all emoji using the Unicode Emoji property — catches every emoji universally
  t = t.replace(/\p{Emoji}/gu, '');
  // Strip variation selectors left behind after emoji removal
  t = t.replace(/[︀-️\u{E0100}-\u{E01EF}]/gu, '');
  // Strip HTML tags
  t = t.replace(/<[^>]*>/g, ' ');
  // Remove orphan periods preceded by whitespace (artifact of emoji/tag removal)
  t = t.replace(/\s+\./g, '.');
  // Collapse multiple spaces/newlines
  t = t.replace(/\s{2,}/g, ' ').trim();
  // Apply pronunciation corrections
  for (const [pattern, replacement] of TTS_PRONUNCIATIONS) {
    t = t.replace(pattern, replacement);
  }
  return t;
}

/** Provider-specific max text length limits. */
export const TTS_MAX_TEXT_LENGTH: Partial<Record<TTSProviderId, number>> = {
  'glm-tts': 1024,
};

/**
 * Split long text into chunks that respect sentence boundaries.
 * Tries splitting at sentence-ending punctuation first, then clause-level
 * punctuation, and finally hard-splits at maxLength as a last resort.
 */
export function splitLongSpeechText(text: string, maxLength: number): string[] {
  const normalized = text.trim();
  if (!normalized || normalized.length <= maxLength) return [normalized];

  const units = normalized
    .split(/(?<=[。！？!?；;：:\n])/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const pushChunk = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) chunks.push(trimmed);
  };

  const appendUnit = (unit: string) => {
    if (!current) {
      current = unit;
      return;
    }
    if ((current + unit).length <= maxLength) {
      current += unit;
      return;
    }
    pushChunk(current);
    current = unit;
  };

  const hardSplitUnit = (unit: string) => {
    const parts = unit.split(/(?<=[，,、])/u).filter(Boolean);
    if (parts.length > 1) {
      for (const part of parts) {
        if (part.length <= maxLength) appendUnit(part);
        else hardSplitUnit(part);
      }
      return;
    }

    let start = 0;
    while (start < unit.length) {
      appendUnit(unit.slice(start, start + maxLength));
      start += maxLength;
    }
  };

  for (const unit of units.length > 0 ? units : [normalized]) {
    if (unit.length <= maxLength) appendUnit(unit);
    else hardSplitUnit(unit);
  }

  pushChunk(current);
  return chunks;
}

/**
 * Split long speech actions into multiple shorter actions so each stays
 * within the TTS provider's text length limit. Each sub-action gets its
 * own independent audio file — no byte concatenation needed.
 */
export function splitLongSpeechActions(actions: Action[], providerId: TTSProviderId): Action[] {
  const maxLength = TTS_MAX_TEXT_LENGTH[providerId];
  if (!maxLength) return actions;

  let didSplit = false;
  const nextActions: Action[] = actions.flatMap((action) => {
    if (action.type !== 'speech' || !action.text || action.text.length <= maxLength)
      return [action];

    const chunks = splitLongSpeechText(action.text, maxLength);
    if (chunks.length <= 1) return [action];
    didSplit = true;
    const { audioId: _audioId, ...baseAction } = action as SpeechAction;

    log.info(
      `Split speech for ${providerId}: action=${action.id}, len=${action.text.length}, chunks=${chunks.length}`,
    );
    return chunks.map((chunk, i) => ({
      ...baseAction,
      id: `${action.id}_tts_${i + 1}`,
      text: chunk,
    }));
  });
  return didSplit ? nextActions : actions;
}
