import * as React from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import Table from './Table';
import Drawer from './Drawer';
import { withRouter } from 'react-router-dom';

import * as moment from 'moment';
import "moment/locale/de";

function Select( {options, ...rest} ) {
    
    const option_elements = options.map( data => {
        return <option value={data.value} key={data.value} >{data.label}</option>
    });

    return <select {...rest}>{option_elements}</select>
}


const roles = [
    { value: 'user', label: 'Betrachter' },
    { value: 'admin', label: 'Mitarbeiter' },
];

class EditUser extends React.Component<{ user? : Meteor.User }, { user : Meteor.User, secret : string, msg : string }> {

    constructor(props) {
        super(props);
        this.state = {
            user: this.props.user,
            secret: '',
            msg: ''
        }
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

    updateRole = (e : React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (this.state.user?._id == Meteor.userId() && val == 'user') {
            this.setState({
                msg: 'Du kannst dir nicht selbst Rechte wegnehmen!'
            });
            return;
        }

        this.setState( prevState => ({ user: { ...prevState.user,
                profile: { ...prevState.user.profile,
                    role: val
                }
            },
            msg: ''
        }));
    }

    updateSecret = (e : React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            secret: e.target.value,
            msg: ''
        });
    }

    handleSubmit = (e : React.FormEvent<HTMLFormElement>) => {
        Meteor.call('saveUser', this.state.user, this.state.secret, (error) => {
            console.log(error);

            this.setState({
                msg: error == undefined ? 'gesichert.' : error?.details || error?.message || 'Es ist ein Fehler aufgetreten.',
                secret: ''
            });
        });

        e.preventDefault();
    }

    render() {
        const u = this.state.user;

        if (u === undefined) return null;

        return (
            <>
                <h2>Bearbeite "{u.profile.name || 'Neuer Benutzer'}"<em>{this.state.msg}</em></h2>
                <form onSubmit={this.handleSubmit} className="row">
                    <input type="text" value={u.profile.name} onChange={this.updateName} placeholder="Name"/>
                    <input type="text" value={u.emails[0].address} onChange={this.updateEmail} placeholder="Email"/>
                    <input type="text" value={this.state.secret} placeholder="vier neue geheime Wörter" onChange={this.updateSecret} />
                    <Select options={roles} value={u.profile.role} onChange={this.updateRole} />
                    <input type="submit" value="Sichern"/>
                </form>
            </>
        )
    }

}


function mark(checkOutput) {
    if (checkOutput === true) return '✔︎';
    return checkOutput;
}

class Users extends React.Component<{ users : Array<Meteor.User>}, { user : Meteor.User }> {

    constructor(props) {
        super(props);
        this.state = {
            user: undefined
        }
    }

    newUser = () => {
        this.setState({
            user: {
                username: '',
                emails: [ { address: '', verified: false} ],
                createdAt: new Date().getTime(),

                profile: {
                    role: 'user',
                    name: '',
                }
            }
        });
    }

    private columns = [
        {
            Header: 'Name',
            accessor: 'profile.name',
        },
        {
            Header: 'Email-Adresse',
            accessor: (u : Meteor.User) => u.emails[0].address,
        },
        {
            Header: '1. Wort',
            accessor: 'username',
        },
        {
            Header: 'Rechte',
            accessor: 'profile.role',
        },
        /*
        {
            Header: 'Verifiziert',
            accessor: (u : Meteor.User) => mark(u.emails[0].verified)
        },
        */
        {
            Header: 'Erstellt am',
            accessor: (u : Meteor.User) => u.createdAt,
            Cell: ({ cell: { value } }) => String(value && moment(value).format('L')),
        },
        {
            Header: '',
            id: 'edit',
            Cell: ({row: {original: u}}) => {
                return <a onClick={ () => { this.setState( {user: u} ) } }>
                    <img src="/icons/edit.svg" />
                </a>;
            },
        },
    ]

    render() {

        let id = this.state.user?._id;
        if (id === undefined && this.state.user !== undefined) id = 'draft';


        return (
            <div className="content" id="users">
                <h1>Alle</h1>
                <h2>Benutzer</h2>
                <Table columns={this.columns} data={this.props.users} />
                <a onClick={this.newUser} className="btn">Hinzufügen</a>
                <EditUser user={this.state.user} key={id} />
            </div>
        );
    }
}

export default withRouter(withTracker(props => {
    return {
        users: Meteor.users.find().fetch()
    };
})(Users));
