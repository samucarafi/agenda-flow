export function getBrazilianPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
}

export function isValidBrazilianPhone(value: string) {
  const digits = getBrazilianPhoneDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function formatBrazilianPhone(value: string) {
  const digits = getBrazilianPhoneDigits(value);
  if (!digits) return "";
  if (digits.length < 3) return `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  const localPartLength = digits.length === 11 ? 5 : 4;
  if (!subscriber) return `(${areaCode})`;
  if (subscriber.length <= localPartLength) return `(${areaCode}) ${subscriber}`;

  return `(${areaCode}) ${subscriber.slice(0, localPartLength)}-${subscriber.slice(localPartLength)}`;
}
