import { Meteor } from "meteor/meteor";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

import { ReactSVG } from "react-svg";

export const Login: React.FC = () => {
  const oneR = useRef<HTMLInputElement>(null);
  const twoR = useRef<HTMLInputElement>(null);
  const threeR = useRef<HTMLInputElement>(null);
  const fourR = useRef<HTMLInputElement>(null);

  const [msg, setMsg] = useState("");
  const [one, setOne] = useState("");
  const [two, setTwo] = useState("");
  const [three, setThree] = useState("");
  const [four, setFour] = useState("");

  const handleSubmit = () => {
    Meteor.loginWithPassword(
      one.toLowerCase(),
      two.toLowerCase() + "-" + three.toLowerCase() + "-" + four.toLowerCase(),
      (err: Meteor.Error) => {
        if (!err) {
          setMsg("eingeloggt!");
        } else {
          let msg = err.message;
          if (err.reason == "Incorrect password") {
            msg = "Mindestens ein geheimes Wort ist falsch!";
          }
          if (err.reason == "User not found") {
            msg = "Das erste geheime Wort ist falsch!";
          }
          setMsg(msg);
        }
      }
    );
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setMsg("");

    const id = e.currentTarget.id;

    const tab = (target: HTMLInputElement) => {
      target.focus();
      target.select();
    };

    if (e.key == "Enter") {
      handleSubmit();
      e.preventDefault();
    } else if (e.key == " ") {
      if (id == "one") tab(twoR.current);
      if (id == "two") tab(threeR.current);
      if (id == "three") tab(fourR.current);
      if (id == "four") handleSubmit();
      e.preventDefault();
    } else if (e.currentTarget.value == "" && e.key == "Backspace") {
      if (id == "two") oneR.current.focus();
      if (id == "three") twoR.current.focus();
      if (id == "four") threeR.current.focus();
      e.preventDefault();
    }
  };

  useEffect(() => oneR.current.focus(), []);

  let status = msg;
  if (Meteor.loggingIn()) status = "Melde an…";

  return (
    <section className="content" id="home">
      <ReactSVG src="/svg/header.svg" />

      <p>
        Das Lieder-Wiki für Jublanerinnen und Jublaner. Logge dich erst mal ein
        mit…
      </p>
      <div className="fourWords">
        <input
          id="one"
          ref={oneR}
          type="text"
          onKeyDown={handleKey}
          onChange={(e) => setOne(e.target.value)}
          placeholder="deinen"
        />
        <input
          id="two"
          ref={twoR}
          type="text"
          onKeyDown={handleKey}
          onChange={(e) => setTwo(e.target.value)}
          placeholder="vier"
        />
        <input
          id="three"
          ref={threeR}
          type="text"
          onKeyDown={handleKey}
          onChange={(e) => setThree(e.target.value)}
          placeholder="geheimen"
        />
        <input
          id="four"
          ref={fourR}
          type="text"
          onKeyDown={handleKey}
          onChange={(e) => setFour(e.target.value)}
          placeholder="Wörtern"
        />
      </div>
      <p>
        Du hast keinen Zugang? Frage deine Scharleitung oder schreibe eine Mail
        an <a href="mailto:hoelibu@posteo.ch">hoelibu@posteo.ch</a> und du
        kriegst einen.
      </p>
      <p>{status}&#8203;</p>
    </section>
  );
};
