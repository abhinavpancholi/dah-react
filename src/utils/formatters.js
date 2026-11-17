/**
 * DAH Dashboard — Number / display formatters
 * Mirrors WCD formatters + Indian digit grouping.
 */

/**
 * Format number with Indian-style commas (e.g. 1,49,500 · 14,00,000 · 86,800)
 */
export function formatIndian(num) {
  if (num == null || isNaN(num)) return "—";
  // Handle decimals
  const n = Number(num);
  const isNeg = n < 0;
  const abs = Math.abs(n);
  const parts = abs.toString().split(".");
  let intPart = parts[0];
  const decPart = parts[1] || "";

  // Indian grouping: first 3 digits from right, then groups of 2
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const groups = [];
    for (let i = rest.length; i > 0; i -= 2) {
      groups.unshift(rest.slice(Math.max(0, i - 2), i));
    }
    intPart = groups.join(",") + "," + last3;
  }

  let result = intPart;
  if (decPart) result += "." + decPart;
  return isNeg ? "-" + result : result;
}

/**
 * Format number with Indian grouping and fixed decimal places
 */
export function formatIndianFixed(num, decimals = 0) {
  if (num == null || isNaN(num)) return "—";
  const n = Number(num);
  const fixed = n.toFixed(decimals);
  const parts = fixed.split(".");
  const intFormatted = formatIndian(parseInt(parts[0], 10));
  if (intFormatted === "—") return "—";
  if (decimals > 0 && parts[1]) {
    return intFormatted + "." + parts[1];
  }
  return intFormatted;
}

/**
 * Format a label value according to labelFormat spec
 */
export function formatLabel(value, labelFormat) {
  if (value == null || isNaN(value)) return "";
  switch (labelFormat) {
    case "integer":
      return formatIndian(Math.round(value));
    case "1dec":
      return formatIndianFixed(value, 1);
    case "2dec":
      return formatIndianFixed(value, 2);
    case "intpct":
      return Math.round(value) + "%";
    case "2decpct":
      return Number(value).toFixed(2) + "%";
    default:
      return formatIndian(Math.round(value));
  }
}

/**
 * Shorten FY label
 */
export function shortenFY(fy) {
  if (!fy) return "";
  return fy;
}
