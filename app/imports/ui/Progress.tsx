import * as React from 'react';
import { Song } from '../api/collections';
import { useTable, useSortBy } from 'react-table'
import { NavLink } from "react-router-dom";

import List from './List';

import * as moment from 'moment';
import "moment/locale/de";

function Table({ columns, data }) {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable(
        {
            columns,
            data,
        },
        useSortBy
    )

    return (
        <>
            <table {...getTableProps()}>
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                // Add the sorting props to control sorting. For this example
                                // we can add them into the header props
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render('Header')}
                                    {/* Add a sort direction indicator */}
                                    <span>
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? ' ^'
                                                : ' v'
                                            : ''}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map(
                        (row, i) => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => {
                                        return (
                                            <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                        )
                                    })}
                                </tr>
                            )
                        }
                    )}
                </tbody>
            </table>
            <br />
        </>
    )
}

function Progress(props) {

    function mark(checkOutput) {
        if (checkOutput === true) return '✔︎';
        return checkOutput;
    }

    const columns = React.useMemo(
        () => [
            {
                Header: 'Titel',
                accessor: 'title',
                Cell: ({row: {original: s}}) => {
                    return <NavLink to={`/view/${s.author_}/${s.title_}`} >{s.title}</NavLink>
                },
            },
            {
                Header: 'Autor',
                accessor: 'author',
            },
            {
                Header: 'Stimmen',
                id: 'votes',
                accessor: (s) => mark(s.checkTag('+')),
            },
            {
                Header: 'WIP',
                id: 'wip',
                accessor: (s) => mark(s.checkTag('wip')),
            },
            {
                Header: 'Fini',
                id: 'fini',
                accessor: (s) => mark(s.checkTag('fini')),
            },
            {
                Header: 'Frage',
                id: 'frage',
                accessor: (s) => mark(s.checkTag('frage')),
            },
            {
                Header: 'Check',
                id: 'check',
                accessor: (s) => mark(s.checkTag('check')),
            },
            {
                Header: 'Zul. geändert',
                id: 'change',
                accessor: (s: Song) => s.getRevision(0) && s.getRevision(0).timestamp.getTime(),
                Cell: ({ cell: { value } }) => String(value && moment(value).format('L')),
            },
            {
                Header: 'Versionen',
                id: 'revisions',
                accessor: (s) => s.getRevisions().count(),
            },
        ],
        []
    )

    let songs = props.songs.filter((s: Song) => !s.checkTag('privat') && !s.title.startsWith('!'))
    const data = React.useMemo(() => songs, [])

    return (
        <>
            <div id="body">
                <List songs={props.songs} open={open} />
                <div className="content" id="progress">
                    <h1>Lieder-Fortschritt</h1>
                    <Table columns={columns} data={data} />
                </div>
            </div>
        </>
    );
}

export default Progress