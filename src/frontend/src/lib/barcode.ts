// Barcode encoding library — Code128B, Code39, EAN-13, UPC-A, EAN-8, ITF-14

// Code128 patterns: each string of 6 digits represents bar/space widths
const CODE128_PATTERNS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
];
const CODE128_STOP = "2331112";

export interface BarModule {
  width: number;
  isBar: boolean;
}

export function encodeCode128(value: string): BarModule[] | null {
  // Only Code128B (ASCII 32-127)
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c < 32 || c > 127) return null;
  }

  const modules: BarModule[] = [];

  const encodePattern = (patStr: string) => {
    for (let i = 0; i < patStr.length; i++) {
      modules.push({ width: Number.parseInt(patStr[i]), isBar: i % 2 === 0 });
    }
  };

  // Quiet zone
  modules.push({ width: 10, isBar: false });

  // START B = value 104
  encodePattern(CODE128_PATTERNS[104]);

  let checksum = 104;

  for (let i = 0; i < value.length; i++) {
    const charVal = value.charCodeAt(i) - 32; // Code128B: ASCII-32
    checksum += charVal * (i + 1);
    encodePattern(CODE128_PATTERNS[charVal]);
  }

  // Check character
  const checkChar = checksum % 103;
  encodePattern(CODE128_PATTERNS[checkChar]);

  // STOP
  encodePattern(CODE128_STOP);

  // Quiet zone
  modules.push({ width: 10, isBar: false });

  return modules;
}

// Code39 patterns: each character = 9 elements (5 bars, 4 spaces) narrow/wide
const CODE39_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%";
const CODE39_PATTERNS: Record<string, string> = {
  "0": "NnNwWnWnN",
  "1": "WnNwNnNnW",
  "2": "NnWwNnNnW",
  "3": "WnWwNnNnN",
  "4": "NnNwWnNnW",
  "5": "WnNwWnNnN",
  "6": "NnWwWnNnN",
  "7": "NnNwNnWnW",
  "8": "WnNwNnWnN",
  "9": "NnWwNnWnN",
  A: "WnNnNwNnW",
  B: "NnWnNwNnW",
  C: "WnWnNwNnN",
  D: "NnNnWwNnW",
  E: "WnNnWwNnN",
  F: "NnWnWwNnN",
  G: "NnNnNwWnW",
  H: "WnNnNwWnN",
  I: "NnWnNwWnN",
  J: "NnNnWwWnN",
  K: "WnNnNnNwW",
  L: "NnWnNnNwW",
  M: "WnWnNnNwN",
  N: "NnNnWnNwW",
  O: "WnNnWnNwN",
  P: "NnWnWnNwN",
  Q: "NnNnNnWwW",
  R: "WnNnNnWwN",
  S: "NnWnNnWwN",
  T: "NnNnWnWwN",
  U: "WwNnNnNnW",
  V: "NwWnNnNnW",
  W: "WwWnNnNnN",
  X: "NwNnWnNnW",
  Y: "WwNnWnNnN",
  Z: "NwWnWnNnN",
  "-": "NwNnNnWnW",
  ".": "WwNnNnWnN",
  " ": "NwWnNnWnN",
  $: "NwNwNwNnN",
  "/": "NwNwNnNwN",
  "+": "NwNnNwNwN",
  "%": "NnNwNwNwN",
  "*": "NwNnWnWnN",
};

export function encodeCode39(value: string): BarModule[] | null {
  const upper = value.toUpperCase();
  for (const ch of upper) {
    if (!CODE39_CHARS.includes(ch) && ch !== "*") return null;
  }

  const modules: BarModule[] = [];
  const N = 1; // narrow
  const W = 3; // wide
  const gap = 1; // inter-char gap (space)

  const encodeChar = (ch: string) => {
    const pattern = CODE39_PATTERNS[ch];
    if (!pattern) return;
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === "N" ? N : W;
      modules.push({ width: w, isBar: i % 2 === 0 });
    }
    // inter-char gap
    modules.push({ width: gap, isBar: false });
  };

  modules.push({ width: 10, isBar: false });
  encodeChar("*");
  for (const ch of upper) encodeChar(ch);
  encodeChar("*");
  modules.push({ width: 10, isBar: false });

  return modules;
}

// EAN-13 encoding tables
const EAN13_L: Record<string, string> = {
  "0": "0001101",
  "1": "0011001",
  "2": "0010011",
  "3": "0111101",
  "4": "0100011",
  "5": "0110001",
  "6": "0101111",
  "7": "0111011",
  "8": "0110111",
  "9": "0001011",
};
const EAN13_G: Record<string, string> = {
  "0": "0100111",
  "1": "0110011",
  "2": "0011011",
  "3": "0100001",
  "4": "0011101",
  "5": "0111001",
  "6": "0000101",
  "7": "0010001",
  "8": "0001001",
  "9": "0010111",
};
const EAN13_R: Record<string, string> = {
  "0": "1110010",
  "1": "1100110",
  "2": "1101100",
  "3": "1000010",
  "4": "1011100",
  "5": "1001110",
  "6": "1010000",
  "7": "1000100",
  "8": "1001000",
  "9": "1110100",
};
const EAN13_PARITY: Record<string, string> = {
  "0": "LLLLLL",
  "1": "LLGLGG",
  "2": "LLGGLG",
  "3": "LLGGGL",
  "4": "LGLLGG",
  "5": "LGGLLG",
  "6": "LGGGLL",
  "7": "LGLGLG",
  "8": "LGLGGL",
  "9": "LGGLGL",
};

export function bitsToModules(bits: string): BarModule[] {
  const mods: BarModule[] = [];
  let i = 0;
  while (i < bits.length) {
    const bit = bits[i];
    let count = 0;
    while (i < bits.length && bits[i] === bit) {
      count++;
      i++;
    }
    mods.push({ width: count, isBar: bit === "1" });
  }
  return mods;
}

export function encodeEAN13(value: string): BarModule[] | null {
  // Accept 12 or 13 digits
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    }
    digits += String((10 - (sum % 10)) % 10);
  }
  if (digits.length !== 13) return null;

  const first = digits[0];
  const parity = EAN13_PARITY[first];
  let bits = "000000000101"; // quiet + START

  for (let i = 0; i < 6; i++) {
    const enc = parity[i] === "L" ? EAN13_L : EAN13_G;
    bits += enc[digits[i + 1]];
  }
  bits += "01010"; // MIDDLE
  for (let i = 7; i < 13; i++) {
    bits += EAN13_R[digits[i]];
  }
  bits += "1010000000000"; // END + quiet

  return bitsToModules(bits);
}

export function encodeUPCA(value: string): BarModule[] | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += Number.parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1);
    }
    digits += String((10 - (sum % 10)) % 10);
  }
  if (digits.length !== 12) return null;
  // UPC-A = EAN-13 with leading 0
  return encodeEAN13(`0${digits}`);
}

// EAN-8: 7 or 8 digits, 4 L-code digits + 4 R-code digits
export function encodeEAN8(value: string): BarModule[] | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 7) {
    // Compute check digit: same algorithm as EAN-13 positions
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += Number.parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1);
    }
    digits += String((10 - (sum % 10)) % 10);
  }
  if (digits.length !== 8) return null;

  let bits = "0000000101"; // quiet(7) + START(101)
  for (let i = 0; i < 4; i++) {
    bits += EAN13_L[digits[i]];
  }
  bits += "01010"; // MIDDLE
  for (let i = 4; i < 8; i++) {
    bits += EAN13_R[digits[i]];
  }
  bits += "1010000000"; // END(101) + quiet(7)

  return bitsToModules(bits);
}

// ITF-14: Interleaved 2-of-5, 13 or 14 digits
const ITF_PATTERNS: Record<string, number[]> = {
  "0": [1, 1, 3, 3, 1],
  "1": [3, 1, 1, 1, 3],
  "2": [1, 3, 1, 1, 3],
  "3": [3, 3, 1, 1, 1],
  "4": [1, 1, 3, 1, 3],
  "5": [3, 1, 3, 1, 1],
  "6": [1, 3, 3, 1, 1],
  "7": [1, 1, 1, 3, 3],
  "8": [3, 1, 1, 3, 1],
  "9": [1, 3, 1, 3, 1],
};

export function encodeITF14(value: string): BarModule[] | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 13) {
    // Compute check digit: alternating ×1/×3 from right, rightmost (odd pos) ×3
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += Number.parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1);
    }
    digits += String((10 - (sum % 10)) % 10);
  }
  if (digits.length !== 14) return null;

  const modules: BarModule[] = [];

  // Quiet zone
  modules.push({ width: 10, isBar: false });

  // Start guard: bar=1, space=1, bar=1, space=1
  modules.push({ width: 1, isBar: true });
  modules.push({ width: 1, isBar: false });
  modules.push({ width: 1, isBar: true });
  modules.push({ width: 1, isBar: false });

  // Encode pairs of digits
  for (let p = 0; p < 14; p += 2) {
    const barPattern = ITF_PATTERNS[digits[p]];
    const spacePattern = ITF_PATTERNS[digits[p + 1]];
    if (!barPattern || !spacePattern) return null;
    // Interleave: 10 modules alternating bar/space
    for (let j = 0; j < 5; j++) {
      modules.push({ width: barPattern[j], isBar: true });
      modules.push({ width: spacePattern[j], isBar: false });
    }
  }

  // End guard: bar=3, space=1, bar=1
  modules.push({ width: 3, isBar: true });
  modules.push({ width: 1, isBar: false });
  modules.push({ width: 1, isBar: true });

  // Quiet zone
  modules.push({ width: 10, isBar: false });

  return modules;
}

export type BarcodeFormat =
  | "CODE128"
  | "CODE39"
  | "EAN13"
  | "UPCA"
  | "EAN8"
  | "ITF14";

export function encodeBarcode(
  value: string,
  format: BarcodeFormat,
): BarModule[] | null {
  switch (format) {
    case "CODE128":
      return encodeCode128(value);
    case "CODE39":
      return encodeCode39(value);
    case "EAN13":
      return encodeEAN13(value);
    case "UPCA":
      return encodeUPCA(value);
    case "EAN8":
      return encodeEAN8(value);
    case "ITF14":
      return encodeITF14(value);
    default:
      return null;
  }
}

export function modulesToSVG(modules: BarModule[], height = 80): string {
  const totalWidth = modules.reduce((s, m) => s + m.width, 0);
  let x = 0;
  let rects = "";
  for (const m of modules) {
    if (m.isBar) {
      rects += `<rect x="${x}" y="0" width="${m.width}" height="${height}" fill="black"/>`;
    }
    x += m.width;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">${rects}</svg>`;
}
