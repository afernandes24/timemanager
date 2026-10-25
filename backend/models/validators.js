// Wspólne funkcje walidujące format danych przesyłanych z frontendu
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/;

const isDate = (value) => typeof value === "string" && DATE_RE.test(value) && !isNaN(Date.parse(value));
const isTime = (value) => typeof value === "string" && TIME_RE.test(value);
const isTimestamp = (value) => typeof value === "string" && TIMESTAMP_RE.test(value);
const isNonEmptyText = (value, max = 255) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

// "HH:MM[:SS]" -> liczba minut od północy
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

module.exports = { isDate, isTime, isTimestamp, isNonEmptyText, toMinutes, has };
