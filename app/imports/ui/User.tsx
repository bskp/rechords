import * as React from 'react';

import { withRouter, Link } from 'react-router-dom';
import Songs, { Revisions, Song } from '../api/collections.js';

import "moment/locale/de";

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

        if (!admin) {
            stats = <p>Du darfst Lieder <strong>ankucken</strong>, aber <strong>nicht bearbeiten</strong>.</p>
        }
        else if (!this.props.revisionsLoading) {
            let user_revs = Revisions.find({editor: this.props.user._id}).fetch();
            song_ids = Array.from(new Set(user_revs.map( rev => rev.of )));
            stats = <p>Fleissig! Du hast <strong>{song_ids.length} Lieder</strong> insgesamt <strong>{user_revs.length} mal bearbeitet</strong>.</p>
        }

        let darlings = u.profile.darlings?.map ( id => {
            let s = Songs.findOne(id);
            return s ? <li key={'sl' + s._id}><Link to={'/view/' + s.author_ + '/' + s.title_}>{s.title}</Link></li> : undefined;
        });

        if (darlings === undefined || darlings.length == 0) {
            darlings = <>
                <li>Du hast noch keine Lieblingslieder!</li>
                <li>Klick in der Liederliste links beim ausgewählten Lied auf den <strong>roten Punkt</strong>, um dir dieses zu merken.</li>
            </>
        }

        const song_links = song_ids.map( ( id ) => {
            let s = Songs.findOne(id);
            return s ? <li key={'sl' + s._id}><Link to={'/view/' + s.author_ + '/' + s.title_}>{s.title}</Link></li> : undefined;
        });

        return (
            <div className="content" id="user">
                <h1>Benutzer</h1>
                <h2>{u.profile.name}<em>{this.state.msg}</em></h2>


                <p>
                <a onClick={ e => Accounts.logout()} className="btn">Abmelden</a>
                <Link to="progress" className="btn">Lieder-Übersicht</Link>
                { admin ? <Link to="users" className="btn">Benutzerverwaltung</Link> : undefined}
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

                <h2>Einstellungen</h2>

                <form onSubmit={this.handleSubmit}>
                    <label>Name</label><input type="text" value={u.profile.name} onChange={this.updateName} placeholder="Name"/><br />
                    <label>Email-Adresse</label><input type="text" value={u.emails[0].address} onChange={this.updateEmail} placeholder="Email"/><br />
                    <br />
                    <label></label><input type="submit" value="Sichern" />
                </form>

            </div>
        );
    }
}

export default withRouter(User);
