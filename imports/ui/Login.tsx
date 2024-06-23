import { Meteor } from 'meteor/meteor';
import * as React from 'react';

import {ReactSVG} from "react-svg";


export default class Login extends React.Component<any, { one: string, two: string, three: string, four: string, msg: string }> {
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
    const field = e.target.id;
    const value = e.target.value;
    this.setState((state, props) => {
      state[field] = value;
      return state;
    });
  };

  handleSubmit = () => {
    Meteor.loginWithPassword( this.state.one.toLowerCase(), 
      this.state.two.toLowerCase() + '-' + this.state.three.toLowerCase() + '-' + this.state.four.toLowerCase(),
      (err: Meteor.Error) => {
        if (!err) {
          this.setState({msg: 'eingeloggt!'});
        }
        else {
          let msg = err.message;
          if (err.reason == 'Incorrect password') {msg = 'Mindestens ein geheimes Wort ist falsch!';}
          if (err.reason == 'User not found') {msg = 'Das erste geheime Wort ist falsch!';}
          this.setState({ msg: msg });
        }
      }
    );

  };

  handleKey = (e : React.KeyboardEvent<HTMLInputElement>) => {

    this.setState({msg: ''});

    const id = e.currentTarget.id;

    const tab = (target : HTMLInputElement) => {
      target.focus();
      target.select();
    };

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

  };

  componentDidMount() {
    this.one.current.focus();
  }

  render() {

    let status = this.state.msg;
    if (Meteor.loggingIn()) status = 'Melde an…';

    return (
      <section className="content" id="home">
        <ReactSVG src='svg/header6.svg' />

        <p>Das Lieder-Wiki für Jublanerinnen und Jublaner. Logge dich erst mal ein mit…</p>
        <div className="fourWords">
          <input id="one" ref={this.one} type="text" onKeyDown={this.handleKey} onChange={this.handleChange} placeholder="deinen"/>
          <input id="two" ref={this.two} type="text" onKeyDown={this.handleKey} onChange={this.handleChange} placeholder="vier"/>
          <input id="three" ref={this.three} type="text" onKeyDown={this.handleKey} onChange={this.handleChange} placeholder="geheimen"/>
          <input id="four" ref={this.four} type="text" onKeyDown={this.handleKey} onChange={this.handleChange} placeholder="Wörtern"/>
        </div>
        <p>Du hast keinen Zugang? Frage deine Scharleitung oder schreibe eine Mail an <a href="mailto:hoelibu@posteo.ch">hoelibu@posteo.ch</a> und du kriegst einen.</p>
        <p>{status}&#8203;</p>
      </section>
    );   
  }
}
