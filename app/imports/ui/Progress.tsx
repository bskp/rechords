import * as React from 'react';
import { Song } from '../api/collections';
import Table from './Table';

import { NavLink } from "react-router-dom";

import * as moment from 'moment';
import "moment/locale/de";

function Progress(props) {

    function mark(checkOutput) {
        if (checkOutput === true) return '✔︎';
        return checkOutput;
    }

    const users = new Map();

    Meteor.users.find().forEach( (u: Meteor.User) => {
        users.set(u._id, u.profile.name);
    });

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
                accessor: (s: Song) => {
                    if (s.getRevision(0) == undefined) return undefined;
                    let ago = 0;
                    // Skip "ghost versions" triggered by parser version updates.
                    while (s.text == s.getRevision(ago).text && s.getRevision(ago + 1)) {
                        ago++;
                    }
                    return s.getRevision(ago) && s.getRevision(ago).timestamp.getTime();
                },
                Cell: ({ cell: { value } }) => String(value && moment(value).format('L')),
            },
            {
                Header: '…von',
                id: 'editor',
                accessor: (s: Song) => {
                    if (s.last_editor) {
                        return users.get(s.last_editor);
                    }
                    return '';
                }
            },
            {
                Header: 'Versionen',
                id: 'revisions',
                accessor: (s : Song) => s.getRevisions().length,
            },
        ],
        []
    )

    let songs : Array<Song> = props.songs.filter((s: Song) => !s.checkTag('privat') && !s.title.startsWith('!'))

    for (let song of songs) {
        // fills each instance's revisions-cache. This is required, as each DB access from within 
        // the Table component has to be memoized.
        song.getRevisions();  
    }

    const data = React.useMemo(() => songs, [])

    return (
        <>
            <div className="content" id="progress">
                <h1>Fortschritt</h1>
                <h2>Lieder</h2>
                <Table columns={columns} data={data} />
            </div>
        </>
    );
}

export default Progress