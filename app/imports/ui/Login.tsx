import * as React from "react";
import * as DocumentTitle from 'react-document-title';


export default class Login extends React.Component<{}, { one: string, two: string, three: string, four: string, msg: string }> {
    private one = React.createRef<HTMLInputElement>();
    private two = React.createRef<HTMLInputElement>();
    private three = React.createRef<HTMLInputElement>();
    private four = React.createRef<HTMLInputElement>();

    constructor(props) {
        super(props);
        this.state = {
           one: '',
           two: '',
           three: '',
           four: '',
           msg: ''
        };
    }

    handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        let field = e.target.id;
        let value = e.target.value;
        this.setState((state, props) => {
            state[field] = value;
            return state;
        })
    }

    handleSubmit = () => {
        Meteor.loginWithPassword(this.state.one, this.state.two + '-' + this.state.three + '-' + this.state.four, (err) => {
            if (!err) {
                this.setState({msg: 'eingeloggt!'});
            }
            else this.setState({msg: err.message});
        });

    }

    handleKey = (e : React.KeyboardEvent<HTMLInputElement>) => {

        this.setState({msg: ''});

        let id = e.currentTarget.id;

        const tab = (target : HTMLInputElement) => {
            target.focus();
            target.select();
        }

        if (e.key == 'Enter') {
            this.handleSubmit();
            e.preventDefault();
        }
        else if (e.key == ' ') {
            if (id == 'one') tab(this.two.current);
            if (id == 'two') tab(this.three.current);
            if (id == 'three') tab(this.four.current);
            if (id == 'four') this.handleSubmit();
            e.preventDefault();
        }
        else if (e.currentTarget.value == '' && e.key == 'Backspace') {
            if (id == 'two') this.one.current.focus();
            if (id == 'three') this.two.current.focus();
            if (id == 'four') this.three.current.focus();
            e.preventDefault();
        }

    }

    componentDidMount() {
        this.one.current.focus();
    }

    render() {

        let status = this.state.msg;
        if (Meteor.loggingIn()) status = 'melde an…';

        return (
            <div id="body">
                <DocumentTitle title="Hölibu" />

                <div id="login"> 

                    <section className="content">
                        <p>Melde dich an mit…</p>
                        <input id="one" ref={this.one} type="text" onKeyDown={this.handleKey} onChange={this.handleChange} placeholder="deinen"/>
                        <input id="two" ref={this.two} type="text" onKeyDown={this.handleKey} onChange={this.handleChange} placeholder="vier"/>
                        <input id="three" ref={this.three} type="text" onKeyDown={this.handleKey} onChange={this.handleChange} placeholder="geheimen"/>
                        <input id="four" ref={this.four} type="text" onKeyDown={this.handleKey} onChange={this.handleChange} placeholder="Wörtern"/>
                        <p>{status}&#8203;</p>
                        </section>

                </div>
            </div>
        )
    }
}