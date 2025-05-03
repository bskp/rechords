import { Mongo } from "meteor/mongo";

import { parse, HTMLElement } from "node-html-parser";
import slug from "slug";
import { Meteor } from "meteor/meteor";
import { parseRechordsDown } from "./parseRechordsDown";

const DATACHORD = "data-chord";

function isDefined<T>(a: T | null | undefined): a is T {
  return a !== null && a !== undefined;
}

export const rmd_version = 11;

export class Song {
  _id?: string;

  text!: string;

  title!: string;
  author!: string;

  tags: string[] = [];
  chords: string[] = [];
  html?: string;
  parsed_rmd_version?: number;

  title_!: string;
  author_!: string;

  last_editor?: string;

  revision_cache?: Revision[];
  has_video: boolean = false;

  constructor(doc: { text: string }) {
    Object.assign(this, doc);
  }

  getHtml() {
    this.validateField("html");
    return this.html!;
  }

  getChords() {
    this.validateField("chords");
    return this.chords!;
  }

  getTags() {
    this.validateField("tags");
    return this.tags!;
  }

  validateField(field: string) {
    if (field in this && this?.parsed_rmd_version == rmd_version) return;

    // A field is missing or bad parser version. Re-parse and store!
    this.parse(this.text);

    Meteor.call("saveSong", this, (error: any) => {
      if (error !== undefined) {
        console.log(error);
      }
    });
  }

  checkTag(needle: string) {
    for (const tag of this.getTags()) {
      if (!tag.toLowerCase().startsWith(needle.toLowerCase())) continue;

      let chunks = tag.split(":");
      if (chunks.length == 1) {
        // Tags without "value" (ie. colon)
        chunks = tag.split(needle);
        if (chunks[1] == "") return true;
      }
      return chunks.splice(1).join(":");
    }
    return null; // Tag not present
  }

  getTag(tag_name: string) {
    for (const tag of this.getTags()) {
      if (!tag.toLowerCase().startsWith(tag_name.toLowerCase())) continue;

      const chunks = tag.split(":");
      if (chunks.length == 1) {
        return undefined; // no colon in tag
      }
      return chunks.splice(1).join(":");
    }
    return undefined; // Tag not present
  }

  isEmpty() {
    return this.text.match(/^\s*$/) != null;
  }

  parse(md: string) {
    this.text = md;

    // Create HTML
    // only member that exist in the mongo db are published
    // to the outside.
    this.html = parseRechordsDown(md);
    this.title = "";
    this.author = "";

    this.tags = [];
    this.chords = [];

    // URL-compatible strings
    this.title_ = "";
    this.author_ = "";

    // this._id may be present or not, but is, most importantly: unaffected!

    // Set Metadata

    if (this.isEmpty()) return; // delete song upon next save.

    const dom = parse(this.html);

    const h1 = dom.getElementsByTagName("h1");
    if (h1.length > 0) {
      this.title = h1[0].textContent!;
    } else {
      this.title = "(Ohne Titel)";
    }
    this.title_ = slug(this.title, { lower: true });

    const h2 = dom.getElementsByTagName("h2");
    if (h2.length > 0) {
      this.author = h2[0].textContent!;
    } else {
      this.author = "-";
    }
    this.author_ = slug(this.author, { lower: true });

    this.has_video =
      dom
        .getElementsByTagName("pre")?.[0]
        ?.childNodes[0]?.rawText.includes("language-yt") ?? false;

    this.tags = RmdHelpers.collectTags(dom);
    this.chords = RmdHelpers.collectChords(dom);
    this.parsed_rmd_version = rmd_version;
  }

  getRevisions() {
    if (!isDefined(this.revision_cache)) {
      this.revision_cache = Revisions.find(
        { of: this._id },
        {
          sort: { timestamp: -1 },
        }
      ).fetch();
    }
    return this.revision_cache;
  }

  getRevision(steps: number) {
    return this.getRevisions()[steps];
  }
}

export interface Revision {
  text: string;
  of: string;
  _id: string;

  ip: string;
  timestamp: Date;
  editor?: string;
}

export interface Playlist {
  _id: string;
  ownerid: string;
  name: string;
  timestamp: Date;
  list: { songId: string; transpose?: number }[];
}

const Playlists = new Mongo.Collection<Playlist>("playlists");
const Revisions = new Mongo.Collection<Revision>("revisions");

const Songs = new Mongo.Collection<Song>("songs", {
  transform(doc) {
    return new Song(doc);
  },
});

export class RmdHelpers {
  static collectTags(dom: HTMLElement) {
    return Array.from(dom.getElementsByTagName("ul"))
      .filter((ul) => ul.getAttribute("class") == "tags")
      .flatMap((ul) => Array.from(ul.getElementsByTagName("li")))
      .map((li) =>
        Array.from(li.childNodes)
          .map((child) => child.textContent)
          .join(":")
      );
  }

  static collectChords(dom: HTMLElement) {
    return this.collectChordsDom(dom);
  }

  static collectChordsDom(dom: HTMLElement) {
    return Array.from(dom.getElementsByTagName("i"))
      .filter((chord_dom) => chord_dom.hasAttribute(DATACHORD))
      .map((chord_dom) => chord_dom.getAttribute(DATACHORD))
      .filter((c?: string): c is string => c !== null);
  }
}

export { Revisions, Playlists };

export default Songs;
