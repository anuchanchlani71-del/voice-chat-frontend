import React from 'react';

export default function DataTable({ columns, data, keyField = "id", emptyComponent }) {
  if (!data || data.length === 0) {
    return emptyComponent || null;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width || 'auto'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row[keyField] || rowIndex}>
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    textAlign: col.align || 'left',
                    ...col.cellStyle
                  }}
                >
                  {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
