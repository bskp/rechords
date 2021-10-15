import * as React from 'react';

import {withRouter, Link} from 'react-router-dom';
import Songs, { Revisions, Song } from '../api/collections';

import "moment/locale/de";

import { Select } from './Users';
import {routePath, View} from "../api/helpers";

class User extends React.Component<{ user : Meteor.User, revisionsLoading : boolean}, { user : Meteor.User, msg : string}> {

    constructor(props) {
        super(props);
        this.state = {
            user: this.props.user,
            msg: ''
        };
    }

    updateName = (e : React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        this.setState( prevState => ({ user: { ...prevState.user,
                profile: { ...prevState.user.profile,
                    name: val
                }
            },
            msg: ''
        }));
    }

    updateEmail = (e : React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        this.setState( prevState => ({ user: { ...prevState.user,
                emails: [
                    { address: val, verified: false }
                ]
            },
            msg: ''
        }));
    }

    updateTheme = (e : React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        this.setState( prevState => ({ user: { ...prevState.user,
                profile: { ...prevState.user.profile,
                    theme: val
                }
            },
            msg: ''
        }));
    }

    handleSubmit = (e : React.FormEvent<HTMLFormElement>) => {
        Meteor.call('saveUser', this.state.user, '', (error) => {
            console.log(error);

            this.setState({
                msg: error == undefined ? 'gesichert.' : error?.details || error?.message || 'Es ist ein Fehler aufgetreten.',
            });
        });

        e.preventDefault();
    }


    render() {
        let stats = <p>Lade…</p>;
        let song_ids = [];

        const u = this.state.user;
        const admin = this.props.user.profile.role == 'admin';
        const writer = this.props.user.profile.role == 'writer' || admin;

        if (!writer) {
            stats = <p>Du darfst Lieder <strong>ankucken</strong>, aber <strong>nicht bearbeiten</strong>
            . Schreibe eine Mail an <a href="mailto:hoelibu@posteo.ch">hoelibu@posteo.ch</a>
            , wenn du Lieder eintragen oder verbessern willst, und wir erstellen dir einen Mitarbeits-Account!</p>
        }
        else if (!this.props.revisionsLoading) {
            let user_revs = Revisions.find({editor: this.props.user._id}).fetch();
            song_ids = Array.from(new Set(user_revs.map( rev => rev.of )));
            stats = <p>Fleissig! Du hast <strong>{song_ids.length} Lieder</strong> insgesamt <strong>{user_revs.length} mal bearbeitet</strong>.</p>
        }

        let darlings = u.profile.darlings?.map ( id => {
            let s = Songs.findOne(id);
            return s ? <li key={'sl' + s._id}><Link to={routePath(View.view, s)}>{s.title}</Link></li> : undefined;
        });

        if (darlings === undefined || darlings.length == 0) {
            darlings = <>
                <li>Du hast noch keine Lieblingslieder!</li>
                <li>Klick in der Liederliste links beim ausgewählten Lied auf den <strong>roten Punkt</strong>, um dir dieses zu merken.</li>
            </>
        }

        // Statistiken
        let stats_text = <p>Zähle nach…</p>
        if (!this.props.revisionsLoading) {

            let count = 0;
            let fini = 0;
            let checked = 0;
            let revs = 0;
            let words = 0;
            let authors = new Set();

            Songs.find().forEach( (song : Song) => {
                if (song.checkTag('privat')) return;
                authors.add(song.author);
                count += 1;
                revs += song.getRevisions().length;
                words += song.text.split(' ').length;

                if (song.checkTag('fini')) fini += 1;
                if (song.checkTag('check')) checked += 1;
            });

            stats_text = <p>
                Das Hölibu umfasst <strong>{count} Lieder</strong> von <strong>{authors.size} Autoren
                </strong>. Klingt nach wenig? Nun, das sind immerhin <strong>{words} Wörter</strong>
                , und wir haben <strong>{revs}-Mal bearbeitet</strong>, um dahin zu kommen!
                Es gibt noch bitz Arbeit: <strong>{fini} Lieder</strong> sind zur Zeit als "fertig" markiert
                , und <strong>{checked}</strong> davon sind korrigiert worden.</p>
        }


        const song_links = song_ids.map( ( id ) => {
            let s = Songs.findOne(id);
            return s ? <li key={'sl' + s._id}><Link to={routePath(View.view, s)}>{s.title}</Link></li> : undefined;
        });

        const options = [
            { value: 'auto', label: 'Automatisch'},
            { value: 'bright', label: 'Tag'},
            { value: 'dark', label: 'Nacht'}
        ];

        return (
            <div className="content" id="user">
                <h1>Benutzer</h1>
                <h2>{u.profile.name}<em>{this.state.msg}</em></h2>


                <p>
                <Link to="/" className="btn">Begrüssungs-Seite</Link>
                <Link to="progress" className="btn">Lieder-Übersicht</Link>
                { admin ? <Link to="users" className="btn">Benutzerverwaltung</Link> : undefined}
                <a onClick={ e => Accounts.logout()} className="btn">Abmelden</a>
                </p>
                <br />

                <h2>Lieblingslieder</h2>
                <ul>
                    {darlings}
                </ul>
                <p>Der "Liebling-Punkt" kann nur bei dem Lied vergeben oder weggenommen werden, dass gerade ausgewählt ist.</p>

                <h2>Bearbeitete Lieder</h2>
                {stats}

                <ul>
                    {song_links}
                </ul>

                <h2>Statistik</h2>
                {stats_text}


                <h2>Einstellungen</h2>

                <form onSubmit={this.handleSubmit}>
                    <label>Name</label><input type="text" value={u.profile.name} onChange={this.updateName} placeholder="Name"/><br />
                    <label>Email-Adresse</label><input type="text" value={u.emails[0].address} onChange={this.updateEmail} placeholder="Email"/><br />
                    <label>Farbschema</label><Select value={u.profile?.theme ?? 'auto'} options={options} onChange={this.updateTheme} />
                    <br />
                    <br />
                    <label></label><input type="submit" value="Sichern" />
                </form>

            </div>
        );
    }
}

export default withRouter(User);
