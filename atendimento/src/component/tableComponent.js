import React from 'react';

const TableComponent = ({ columns, data, renderActions, emptyMessage, formatCellValue }) => {
  return (
    <table className="table-auto w-full bg-white shadow-md rounded-lg overflow-hidden">
      <thead className="bg-[#001e50] text-white">
        <tr>
          {columns.map((col, index) => (
            <th key={index} className="p-3 text-left">
              {col.label}
            </th>
          ))}
          {renderActions && <th className="p-3 text-left">Ações</th>}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-100">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="p-3">
                  {formatCellValue ? formatCellValue(col.key, item[col.key], item) : item[col.key]}
                </td>
              ))}
              {renderActions && (
                <td className="p-3 flex space-x-2">{renderActions(item)}</td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length + (renderActions ? 1 : 0)} className="p-4 text-center text-gray-500">
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default TableComponent;
