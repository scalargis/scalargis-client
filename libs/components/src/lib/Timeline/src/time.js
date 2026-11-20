const DAY = 86400000;
const durationPattern = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

export function parseDuration(value) {
  const match = typeof value === 'string' && value.match(durationPattern);
  if (!match) return null;
  const [years, months, weeks, days, hours, minutes, seconds] = match.slice(1).map(v => Number(v || 0));
  const result = { months: years * 12 + months, ms: ((weeks * 7 + days) * 24 * 3600 + hours * 3600 + minutes * 60 + seconds) * 1000 };
  return result.months || result.ms ? result : null;
}

export function durationSeconds(value) {
  const duration = parseDuration(value);
  return duration ? (duration.months * 30 * DAY + duration.ms) / 1000 : 0;
}

export function addDuration(value, duration, count = 1) {
  const parsed = parseDuration(duration);
  const date = new Date(value);
  if (!parsed || !Number.isFinite(date.getTime())) return NaN;
  if (parsed.months) {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + parsed.months * count);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  }
  return date.getTime() + parsed.ms * count;
}

export function timestamp(value) {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return value;
  if (value === 'current' || value === 'now') return Date.now();
  const text = String(value).trim();
  return Date.parse(/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?$/.test(text) ? text + 'Z' : text);
}

export function iso(value) {
  return new Date(value).toISOString().replace(/\.000Z$/, 'Z');
}

export function parseDimension(dimension) {
  const ranges = [];
  const dates = [];
  const raw = Array.isArray(dimension?.values) ? dimension.values.join(',') : String(dimension?.values || '');
  for (const segment of raw.split(',').map(s => s.trim()).filter(Boolean)) {
    const parts = segment.split('/').map(s => s.trim());
    if (parts.length === 1) {
      const date = timestamp(parts[0]);
      if (Number.isFinite(date)) dates.push(date);
    } else {
      const start = timestamp(parts[0]);
      const end = parts.length === 2 ? Date.now() : timestamp(parts[1]);
      const step = parts.at(-1);
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && parseDuration(step)) {
        ranges.push({ start, end, step });
      }
    }
  }
  if (!ranges.length && !dates.length) return null;
  const starts = [...dates, ...ranges.map(r => r.start)];
  const ends = [...dates, ...ranges.map(r => r.end)];
  return {
    ...dimension,
    ranges,
    dates: [...new Set(dates)].sort((a, b) => a - b),
    min: starts.reduce((a, b) => Math.min(a, b), Infinity),
    max: ends.reduce((a, b) => Math.max(a, b), -Infinity),
    step: ranges.map(r => r.step).sort((a, b) => durationSeconds(a) - durationSeconds(b))[0] || null,
    nearestValue: ![false, 0, '0', 'false'].includes(dimension?.nearestValue),
  };
}

export function unionDimensions(dimensions) {
  const valid = dimensions.filter(Boolean);
  if (!valid.length) return null;
  return {
    ranges: valid.flatMap(d => d.ranges),
    dates: [...new Set(valid.flatMap(d => d.dates))].sort((a, b) => a - b),
    min: Math.min(...valid.map(d => d.min)),
    max: Math.max(...valid.map(d => d.max)),
    step: valid.map(d => d.step).filter(Boolean).sort((a, b) => durationSeconds(a) - durationSeconds(b))[0] || null,
    nearestValue: valid.every(d => d.nearestValue),
  };
}

function rangeIndex(range, target) {
  const duration = parseDuration(range.step);
  if (!duration.months) return Math.max(0, Math.floor((target - range.start) / duration.ms));
  let lo = 0;
  let hi = 1;
  while (addDuration(range.start, range.step, hi) <= target && hi < 1000000) hi *= 2;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (addDuration(range.start, range.step, mid) <= target) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function snapDate(target, dimension, mode = dimension?.nearestValue ? 0 : -1) {
  if (!dimension || !Number.isFinite(target)) return null;
  const bounded = Math.max(dimension.min, Math.min(dimension.max, target));
  const candidates = dimension.dates.filter(d => d >= dimension.min && d <= dimension.max);
  for (const range of dimension.ranges) {
    const first = Math.max(range.start, dimension.min);
    const last = Math.min(range.end, dimension.max);
    if (first > last) continue;
    const index = rangeIndex(range, Math.max(first, Math.min(last, bounded)));
    for (const i of [index, index + 1]) {
      const value = addDuration(range.start, range.step, i);
      if (value >= first && value <= last) candidates.push(value);
    }
  }
  if (!candidates.length) return null;
  const directional = candidates.filter(d => mode < 0 ? d <= bounded : mode > 0 ? d >= bounded : true);
  const choices = directional.length ? directional : candidates;
  return choices.reduce((best, d) => Math.abs(d - bounded) < Math.abs(best - bounded) ? d : best);
}

export function clampDate(value, dimension) {
  return dimension && Number.isFinite(value) ? Math.max(dimension.min, Math.min(dimension.max, value)) : null;
}

export function selectDate(value, dimension, step, dateOnly = false) {
  if (!step) return snapDate(value, dimension, dateOnly ? 1 : undefined);
  let aligned = snapStepPeriod(value, step);
  if (dateOnly && aligned < value) aligned = addDuration(aligned, step);
  return clampDate(aligned, dimension);
}

export function stepDate(current, dimension, step, direction) {
  if (!dimension || current == null) return current;
  const target = step ? addDuration(current, step, direction) : current + direction;
  if (step) return clampDate(target, dimension);
  let next = snapDate(target, dimension, direction);
  if (next === current && !step) next = snapDate(current + direction, dimension, direction);
  return next;
}

export function snapStepPeriod(value, step) {
  const duration = parseDuration(step);
  if (!duration) return value;
  const date = new Date(value);
  if (duration.months) {
    const month = date.getUTCFullYear() * 12 + date.getUTCMonth();
    const aligned = Math.floor(month / duration.months) * duration.months;
    return Date.UTC(Math.floor(aligned / 12), aligned % 12, 1);
  }
  return Math.floor(value / duration.ms) * duration.ms;
}

function referenceDate(value) {
  const now = Date.now();
  const today = Math.floor(now / DAY) * DAY;
  if (value === 'today') return today;
  if (value === 'tomorrow') return today + DAY;
  if (value === 'yesterday') return today - DAY;
  if (value === 'now' || !value) return now;
  if (value.startsWith('-P')) return addDuration(now, value.slice(1), -1);
  if (value.startsWith('P')) return addDuration(now, value);
  return timestamp(value);
}

export function initialNow(dimension, step, now = Date.now()) {
  const upper = Math.min(now, dimension.max);
  const aligned = snapStepPeriod(upper, step);
  if (aligned >= dimension.min) return aligned;
  const first = snapStepPeriod(dimension.min, step);
  const next = first < dimension.min ? addDuration(first, step) : first;
  return Number.isFinite(next) && next <= dimension.max ? next : dimension.min;
}

export function initialDate(dimension, config = {}, selectedStep) {
  if (!dimension) return null;
  const selected = config.selectedIndex;
  if (selected === 'first') return snapDate(dimension.min, dimension, 1);
  if (selected === 'last') return snapDate(dimension.max, dimension, -1);
  if (selected === 'now') return initialNow(dimension, selectedStep || dimension.step);
  if (Number.isInteger(selected)) {
    if (!dimension.ranges.length) return dimension.dates[Math.max(0, Math.min(dimension.dates.length - 1, selected - 1))];
    return snapDate(addDuration(dimension.min, dimension.step, Math.max(0, selected - 1)), dimension);
  }
  if (config.value) return snapDate(referenceDate(config.value), dimension);
  return snapDate(dimension.max, dimension, -1);
}

export function restrictDimension(dimension, config = {}) {
  if (!dimension) return null;
  let { min, max } = dimension;
  const reference = snapDate(referenceDate(config.value), dimension);
  if (config.interval?.length === 2) {
    min = Math.max(min, timestamp(config.interval[0]));
    max = Math.min(max, timestamp(config.interval[1]));
  } else if (config.steps != null) {
    const steps = Array.isArray(config.steps) ? config.steps : [config.steps, config.steps];
    if (steps.length === 2 && steps.every(n => Number.isInteger(n) && n >= 0)) {
      if (dimension.step) {
        min = Math.max(min, addDuration(reference, dimension.step, -steps[0]));
        max = Math.min(max, addDuration(reference, dimension.step, steps[1]));
      } else {
        const i = dimension.dates.indexOf(reference);
        min = dimension.dates[Math.max(0, i - steps[0])];
        max = dimension.dates[Math.min(dimension.dates.length - 1, i + steps[1])];
      }
    }
  } else if (config.delta) {
    const delta = Array.isArray(config.delta) ? config.delta : [config.delta, config.delta];
    if (delta.length === 2 && delta.every(parseDuration)) {
      min = Math.max(min, addDuration(reference, delta[0], -1));
      max = Math.min(max, addDuration(reference, delta[1]));
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return null;
  const result = { ...dimension, min, max, dates: dimension.dates.filter(d => d >= min && d <= max) };
  const first = snapDate(min, result, 1);
  const last = snapDate(max, result, -1);
  return first == null || last == null ? null : { ...result, min: first, max: last };
}

export function localInput(value, hasTime = true) {
  if (value == null) return '';
  const date = new Date(value);
  const pad = number => String(number).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return hasTime ? `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` : day;
}

export function parseLocalInput(value, current) {
  if (!value) return NaN;
  if (current != null && localInput(current).startsWith(value)) return current;
  const date = new Date(value.length === 10 ? value + 'T00:00:00' : value);
  const result = date.getTime();
  return Number.isFinite(result) && localInput(result).startsWith(value) ? result : NaN;
}

export function formatDate(value, format) {
  const date = new Date(value);
  const values = {
    yyyy: date.getFullYear(), mm: date.getMonth() + 1, dd: date.getDate(),
    h: date.getHours(), m: date.getMinutes(), s: date.getSeconds(),
  };
  return format ? format.replace(/\{(yyyy|mm|dd|h|m|s)\}/g, (_, key) => String(values[key]).padStart(2, '0')) : iso(value);
}
