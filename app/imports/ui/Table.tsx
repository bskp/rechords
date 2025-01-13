import * as React from "react";
import { Column, useSortBy, useTable } from "react-table";

declare module "react-table" {
  // This is annoying
  // Types for the plugins can only be added globally
  type ColumnInstance<D> = UseSortByColumnProps<D>;
}

const Table = <T extends object>({
  columns,
  data,
}: {
  columns: Column<T>[];
  data: T[];
}) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable<T>(
      {
        columns,
        data,
      },
      useSortBy,
    );

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                // Add the sorting props to control sorting. For this example
                // we can add them into the header props
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render("Header")}
                  {/* Add a sort direction indicator */}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? " ^" : " v") : ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
    </>
  );
};

export default Table;
