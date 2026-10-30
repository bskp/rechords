import { Revision, Song } from "../api/collections";
import { Draft } from "./draftStorage";
import React, { Component } from "react";
import Source from "./Source";
import Drawer from "../ui/Drawer";
import moment from "moment";
import "moment/locale/de";
import { Meteor } from "meteor/meteor";

/** Marks the entry that comes from localStorage rather than from the server. */
export const DRAFT_ID = "__local_draft__";

/**
 * The subset of a `Revision` this browser needs. `Revision` satisfies it
 * structurally, so server revisions and the local draft go into one list.
 */
type Entry = {
  _id: string;
  text: string;
  timestamp?: Date;
  editor?: string;
};

type RevBrowserProps = {
  song: Song;
  draft?: Draft;
};

export default class RevBrowser extends React.Component<
  RevBrowserProps,
  { revision: Entry | undefined }
> {
  constructor(props: RevBrowserProps) {
    super(props);
    this.state = {
      revision: undefined,
    };
  }

  setRev = (rev: Entry) => {
    this.setState({
      revision: rev,
    });
  };

  /** Newest first, so the unsaved draft leads. */
  entries = (): Entry[] => {
    const revs: Revision[] = this.props.song.getRevisions();
    const draft = this.props.draft;

    if (!draft) return revs;

    return [
      { _id: DRAFT_ID, text: draft.text, timestamp: draft.savedAt },
      ...revs,
    ];
  };

  componentDidMount() {
    document.addEventListener("keyup", this.keyHandler, {});
  }

  componentWillUnmount() {
    document.removeEventListener("keyup", this.keyHandler);
  }

  keyHandler = (e) => {
    // Do not steal focus if on <input>
    if (e.target?.tagName == "INPUT") return;

    const rev = this.state?.revision;
    const revs = this.entries();

    const n = revs.length;

    if (n > 0) {
      if (e.key == "j" || e.key == "ArrowRight") {
        e.preventDefault();
        if (rev) {
          const idx = revs.findIndex((r) => rev?._id == r._id);
          if (idx != -1 && idx < n - 1) {
            this.setRev(revs[idx + 1]);
            return;
          }
        } else {
          this.setRev(revs[0]);
        }
      }

      if (e.key == "k" || e.key == "ArrowLeft") {
        e.preventDefault();
        if (rev) {
          const idx = revs.findIndex((r) => rev?._id == r._id);
          if (idx != -1 && idx > 0) {
            this.setRev(revs[idx - 1]);
            return;
          }
        } else {
          this.setRev(revs[n - 1]);
        }
      }
    }
  };

  render() {
    const revs = this.entries();
    const n = revs.length;

    const selected = this.state.revision;
    const ts = selected?.timestamp;

    let label = <span className="label">Wähle rechts eine Version aus!</span>;
    if (selected?._id === DRAFT_ID) {
      label = (
        <span className="label">
          Lokal gesichert{ts ? `, ${moment(ts).format("LLLL")}` : ""} — noch
          nicht abgeschickt
        </span>
      );
    } else if (ts) {
      label = (
        <span className="label">Version vom {moment(ts).format("LLLL")}</span>
      );
    }

    return (
      <>
        <Source
          md={this.state.revision?.text || ""}
          readOnly={true}
          className="revision-colors"
        >
          {label}
        </Source>
        <Drawer
          id="revs"
          className="revisions-colors"
          open={this.state.revision === undefined}
        >
          <h1>Versionen</h1>
          <ol>
            {revs.map((rev, idx) => (
              <RevLink
                rev={rev}
                idx={n - idx}
                key={rev._id}
                showRevision={this.setRev}
                active={rev._id == this.state.revision?._id}
              />
            ))}
          </ol>
          <p>
            Schneller:
            <br />
            <span className="keyboard">J</span>&nbsp;|&nbsp;
            <span className="keyboard">→</span>
            <br />
            <span className="keyboard">K</span>&nbsp;|&nbsp;
            <span className="keyboard">←</span>
          </p>
        </Drawer>
      </>
    );
  }
}

type RevLinkProps = {
  rev: Entry;
  idx: number;
  key: string;
  showRevision: (rev: Entry) => void;
  active: boolean;
};

class RevLink extends Component<RevLinkProps, never> {
  constructor(props: RevLinkProps) {
    super(props);
  }

  render() {
    const r = this.props.rev;
    const isDraft = r._id === DRAFT_ID;

    // Meteor.users.findOne(undefined) would return an arbitrary user, so the
    // draft — which has no editor — never asks.
    const who = isDraft
      ? "lokal "
      : (Meteor.users.findOne(r.editor)?.profile.name || "???") + " ";

    return (
      <li
        value={this.props.idx}
        onClick={() => {
          this.props.showRevision(r);
        }}
        className={[this.props.active ? "active" : "", isDraft ? "draft" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {who}
        {r.timestamp ? moment(r.timestamp).fromNow() : "ungesichert"}
      </li>
    );
  }
}
