export const generateId = (length: number = 8): string => {
  length = Math.floor(length);
  if (length < 1) {
    length = 0;
  }
  length = Math.min(length, 100);
  if (length === 0) {
    return "";
  }
  // Updated to only include uppercase letters and numbers
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomValues[i] % characters.length);
  }
  return result;
};
