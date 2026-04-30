export function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getSeason(date = new Date()) {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "春季";
  if (month >= 6 && month <= 8) return "夏季";
  if (month >= 9 && month <= 11) return "秋季";
  return "冬季";
}

export function formatTime(date = new Date()) {
  return `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
}
