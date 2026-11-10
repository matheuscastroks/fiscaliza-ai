export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const formatPostalCode = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};
