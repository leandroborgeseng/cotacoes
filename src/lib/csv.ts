function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function toCsv(rows: string[][]): string {
  const lines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return lines.join("\r\n");
}
