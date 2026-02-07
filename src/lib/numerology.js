function onlyDigits(str) {
  return (str.match(/\d/g) || []).map(Number);
}

function sumDigits(value) {
  return String(value)
    .split("")
    .map(Number)
    .reduce((total, current) => total + current, 0);
}

function reduceToSingle(value) {
  let current = value;
  while (current > 9) {
    current = sumDigits(current);
  }
  return current;
}

export function parseBirthday(raw) {
  const digits = onlyDigits(raw);
  if (digits.length !== 8) return null;

  const year = Number(digits.slice(0, 4).join(""));
  const month = Number(digits.slice(4, 6).join(""));
  const day = Number(digits.slice(6, 8).join(""));

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1000 || year > 2999) return null;

  return { digits, year, month, day };
}

export function normalizeInputValue(value) {
  const parsed = parseBirthday(value);
  if (!parsed) return value;
  return `${parsed.year}/${String(parsed.month).padStart(2, "0")}/${String(parsed.day).padStart(2, "0")}`;
}

function countDigits(digits) {
  const map = new Map();
  for (let number = 1; number <= 9; number += 1) map.set(number, 0);

  for (const digit of digits) {
    if (digit >= 1 && digit <= 9) {
      map.set(digit, map.get(digit) + 1);
    }
  }

  return map;
}

function collectVisibleDigits(circles, triangles, squareAt) {
  const digits = new Set();
  for (let number = 1; number <= 9; number += 1) {
    const hasCircle = circles.get(number) > 0;
    const hasTriangle = triangles.get(number) > 0;
    const hasSquare = squareAt === number;

    if (hasCircle || hasTriangle || hasSquare) {
      digits.add(number);
    }
  }

  return digits;
}

function collectLineDigits(visibleDigits, rawDigits) {
  const digits = new Set(visibleDigits);
  if (rawDigits.includes(0)) {
    digits.add(0);
  }
  return digits;
}

export function isLineActive(code, presentDigits) {
  return code.split("").every((digit) => presentDigits.has(Number(digit)));
}

export function calculateNumerology(raw) {
  const parsed = parseBirthday(raw);
  if (!parsed) return null;

  const firstTotal = parsed.digits.reduce((acc, n) => acc + n, 0);
  const secondTotal = sumDigits(firstTotal);
  const hasMasterNumber = secondTotal >= 10;
  const masterNumber = hasMasterNumber ? secondTotal : null;
  const lifeNumber = hasMasterNumber ? reduceToSingle(masterNumber) : secondTotal;
  const circles = countDigits(parsed.digits);
  const triangleDigits = hasMasterNumber
    ? [...String(firstTotal), ...String(masterNumber)]
    : [...String(firstTotal)];
  const triangles = countDigits(triangleDigits.map(Number));
  const squareAt = lifeNumber;
  // Only 1-9 digits that are visible in the 3x3 grid (circle/triangle/square).
  const visibleDigits = collectVisibleDigits(circles, triangles, squareAt);
  // Line checks use visible digits, plus 0 from raw birthday for the 1590 rule.
  const lineDigits = collectLineDigits(visibleDigits, parsed.digits);

  return {
    postnatal: firstTotal,
    master: masterNumber,
    life: lifeNumber,
    circles,
    triangles,
    squareAt,
    visibleDigits,
    lineDigits,
  };
}
