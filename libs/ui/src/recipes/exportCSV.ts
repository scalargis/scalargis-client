/* =====================================================================
   exportCSV — replaces PrimeReact's DataTable.exportCSV() (41 call sites).

   Prime exposes export as an imperative method on the table ref. Mantine's
   datatable has no equivalent, and it shouldn't: serialising rows is not a
   table concern. This is a plain function over the same column definitions
   the grid renders, so what you export is what you see.
   ===================================================================== */

import { saveAs } from 'file-saver';

export interface ExportColumn<T> {
  /** Property key, or a dotted path into the record ('owner.name'). */
  accessor: string;
  /** Column heading. Falls back to the accessor. */
  title?: string;
  /** Cell → export value. Use when the on-screen render differs from raw data. */
  exportRender?: (record: T) => unknown;
}

export interface ExportCSVOptions {
  /** Written as-is; '.csv' is appended when missing. */
  filename?: string;
  /** Excel honours the list separator of its locale; pt-PT uses ';'. */
  separator?: string;
  /** Prepend a UTF-8 BOM so Excel reads accented characters correctly. */
  withBom?: boolean;
  includeHeader?: boolean;
}

/** Resolve 'a.b.c' against a record without throwing on a missing branch. */
function resolve(record: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc == null ? undefined : (acc as Record<string, unknown>)[key],
      record
    );
}

/** A value that parses as a plain (possibly signed, possibly pt-decimal)
 *  number. Such a value cannot carry a formula payload. */
const PLAIN_NUMBER = /^[+-]?\d+(?:[.,]\d+)?(?:[eE][+-]?\d+)?$/;

/**
 * RFC 4180 escaping. A field is quoted when it contains the separator, a
 * quote, or a newline; embedded quotes are doubled.
 *
 * The leading-character guard is not cosmetic: a value beginning with
 * = + - @ is executed as a formula when the file is opened in Excel or
 * Sheets (CSV injection). Prefixing a tab neutralises it while leaving the
 * text visually intact. Purely numeric values are exempt — a number cannot
 * carry a payload, and tab-prefixing would turn every negative number in
 * the export into text (this is a GIS platform: negative longitudes cover
 * all of continental Portugal).
 */
function escapeField(value: unknown, separator: string): string {
  if (value == null) return '';

  let text = value instanceof Date ? value.toISOString() : String(value);

  if (/^[=+\-@]/.test(text) && !PLAIN_NUMBER.test(text)) {
    text = `\t${text}`;
  }

  if (text.includes(separator) || text.includes('"') || /[\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCSV<T>(
  records: T[],
  columns: ExportColumn<T>[],
  { separator = ',', includeHeader = true }: ExportCSVOptions = {}
): string {
  const lines: string[] = [];

  if (includeHeader) {
    lines.push(
      columns.map((c) => escapeField(c.title ?? c.accessor, separator)).join(separator)
    );
  }

  for (const record of records) {
    lines.push(
      columns
        .map((c) =>
          escapeField(
            c.exportRender ? c.exportRender(record) : resolve(record, c.accessor),
            separator
          )
        )
        .join(separator)
    );
  }

  return lines.join('\r\n');
}

export function exportCSV<T>(
  records: T[],
  columns: ExportColumn<T>[],
  options: ExportCSVOptions = {}
): void {
  const { filename = 'export.csv', withBom = true } = options;
  const csv = toCSV(records, columns, options);

  // U+FEFF spelled explicitly — a literal BOM character in source is
  // invisible and one editor round-trip away from silently disappearing.
  const blob = new Blob([withBom ? String.fromCharCode(0xfeff) + csv : csv], {
    type: 'text/csv;charset=utf-8',
  });

  saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}
