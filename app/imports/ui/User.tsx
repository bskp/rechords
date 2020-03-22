import * as React from 'react';

import { withRouter } from 'react-router-dom';
import Songs, { Revisions } from '../api/collections.js';

import "moment/locale/de";

Accounts.onResetPasswordLink((token, done) => {
    Accounts.resetPassword(token, )

});

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
        if (!this.props.revisionsLoading) {
            let user_revs = Revisions.find({editor: this.props.user._id}).fetch();
            let songs = new Set(user_revs.map( rev => rev.of ));

            stats = <p>Fleissig! Du hast <strong>{songs.size} Lieder</strong> insgesamt <strong>{user_revs.length} mal bearbeitet</strong>.</p>
        }

        let u = this.props.user;

        return (
            <div className="content" id="user">
                <h1>Benutzer</h1>
                <h2>{u.profile.name}<em>{this.state.msg}</em></h2>
                {stats}

                <form onSubmit={this.handleSubmit}>
                    <label>Name</label><input type="text" value={u.profile.name} onChange={this.updateName} placeholder="Name"/><br />
                    <label>Email-Adresse</label><input type="text" value={u.emails[0].address} onChange={this.updateEmail} placeholder="Email"/><br />
                    <br />
                    <label></label><input type="submit" value="Sichern" />
                </form>

                <a onClick={ e => Accounts.logout()} className="btn">Abmelden</a>
            </div>
        );
    }
}

export default withRouter(User);
