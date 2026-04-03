function escapeCsv(value) {
  const text = value ?? '';
  const str = typeof text === 'string' ? text : String(text);
  if (/[\r\n",]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function downloadCsv({ columns, data, filename }) {
  const header = columns.map((col) => col.label).join(',');
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      return escapeCsv(col.format ? col.format(value) : value);
    }).join(',')
  );

  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCsvText(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(current);
      current = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    if (char === '\n') {
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

export function parseCsv(text, columns) {
  const rows = parseCsvText(text.trim());

  if (!rows.length) {
    return [];
  }

  const dataRows = rows.slice(1).map((row) => {
    const entry = {};

    columns.forEach((column, index) => {
      const rawValue = row[index] ?? '';
      const value = column.parse ? column.parse(rawValue) : rawValue;
      entry[column.key] = value;
    });

    return entry;
  });

  return dataRows;
}
