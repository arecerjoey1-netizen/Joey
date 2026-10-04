/**
 * Real-time spelling correction & predictive text engine
 */

const DICTIONARY: Record<string, string> = {
  teh: 'the',
  taht: 'that',
  thier: 'their',
  ther: 'there',
  recieve: 'receive',
  recieved: 'received',
  seperate: 'separate',
  definately: 'definitely',
  occured: 'occurred',
  untill: 'until',
  tommorow: 'tomorrow',
  tomorow: 'tomorrow',
  alot: 'a lot',
  wierd: 'weird',
  beleive: 'believe',
  acheive: 'achieve',
  goverment: 'government',
  enviroment: 'environment',
  untilll: 'until',
  accommodate: 'accommodate',
  accomodate: 'accommodate',
  neccessary: 'necessary',
  necesary: 'necessary',
  wich: 'which',
  whould: 'would',
  shoud: 'should',
  coud: 'could',
  dont: "don't",
  cant: "can't",
  wont: "won't",
  isnt: "isn't",
  arent: "aren't",
  didnt: "didn't",
  doesnt: "doesn't",
  hasnt: "hasn't",
  havent: "haven't",
  youre: "you're",
  theyre: "they're",
  weve: "we've",
  im: "I'm",
  ive: "I've",
  id: "I'd",
  ill: "I'll",
  ur: 'your',
  u: 'you',
  r: 'are',
  plz: 'please',
  pls: 'please',
  thx: 'thanks',
  omw: 'on my way',
  idk: "I don't know",
  brb: 'be right back',
  tbh: 'to be honest',
  imo: 'in my opinion',
  secuity: 'security',
  encryted: 'encrypted',
  whatspp: 'WhatsApp',
};

export interface CorrectionResult {
  hasCorrection: boolean;
  correctedWord: string;
  originalWord: string;
}

export function checkWordSpelling(rawWord: string): CorrectionResult {
  const cleanWord = rawWord.toLowerCase().replace(/[^a-z']/g, '');
  if (!cleanWord) {
    return { hasCorrection: false, correctedWord: rawWord, originalWord: rawWord };
  }

  if (DICTIONARY[cleanWord]) {
    let replacement = DICTIONARY[cleanWord];
    // Preserve initial capitalization
    if (rawWord[0] === rawWord[0].toUpperCase() && rawWord[0] !== rawWord[0].toLowerCase()) {
      replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return {
      hasCorrection: true,
      correctedWord: replacement,
      originalWord: rawWord,
    };
  }

  return { hasCorrection: false, correctedWord: rawWord, originalWord: rawWord };
}

/**
 * Autocorrect a whole string or the last word typed before space
 */
export function autoCorrectText(text: string): {
  newText: string;
  replaced: boolean;
  suggestedWord?: string;
} {
  const tokens = text.split(' ');
  let replaced = false;
  let suggested = '';

  const newTokens = tokens.map((token, index) => {
    // Only check tokens with characters
    if (token.trim().length === 0) return token;
    const res = checkWordSpelling(token);
    if (res.hasCorrection) {
      replaced = true;
      suggested = res.correctedWord;
      return res.correctedWord;
    }
    return token;
  });

  return {
    newText: newTokens.join(' '),
    replaced,
    suggestedWord: suggested || undefined,
  };
}

/**
 * Get suggestions for the active word being typed
 */
export function getActiveWordSuggestions(text: string): string[] {
  const words = text.split(/\s+/);
  const current = words[words.length - 1]?.toLowerCase() || '';
  if (!current || current.length < 2) return [];

  const suggestions: string[] = [];
  if (DICTIONARY[current]) {
    suggestions.push(DICTIONARY[current]);
  }

  // Common prefix matches
  const commonCompletions = [
    'encrypted',
    'document',
    'security',
    'voice',
    'disappearing',
    'message',
    'tomorrow',
    'definitely',
    'meeting',
    'conference',
    'workspace',
    'important',
  ];

  for (const word of commonCompletions) {
    if (word.startsWith(current) && word !== current && !suggestions.includes(word)) {
      suggestions.push(word);
    }
    if (suggestions.length >= 3) break;
  }

  return suggestions;
}
