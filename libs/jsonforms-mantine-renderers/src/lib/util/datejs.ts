import dayjs from 'dayjs';
import customParsing from 'dayjs/plugin/customParseFormat';

// Required for the custom save formats in the date, time and date-time cells.
dayjs.extend(customParsing);

/**
 * JSONForms data string (in `saveFormat`) → the value string a @mantine/dates
 * input expects (`mantineFormat`: 'YYYY-MM-DD' for DateInput,
 * 'YYYY-MM-DD HH:mm:ss' for DateTimePicker). Unparseable data renders as
 * empty rather than crashing the form — same tolerance as the Prime cells.
 */
export const toMantineDateValue = (
  data: unknown,
  saveFormat: string,
  mantineFormat: string
): string | null => {
  if (!data || typeof data !== 'string') return null;
  const parsed = dayjs(data, saveFormat);
  return parsed.isValid() ? parsed.format(mantineFormat) : null;
};

/** Mantine dates value string → JSONForms data string (in `saveFormat`). */
export const fromMantineDateValue = (
  value: string | null,
  saveFormat: string,
  mantineFormat: string
): string | undefined => {
  if (!value) return undefined;
  const parsed = dayjs(value, mantineFormat);
  return parsed.isValid() ? parsed.format(saveFormat) : undefined;
};
