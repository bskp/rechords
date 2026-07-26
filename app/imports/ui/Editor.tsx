import * as React from "react";
import { FC, MouseEventHandler, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UnsavedChangesPrompt } from "./UnsavedChangesPrompt";
import { clearDraft, readDraft, writeDraft } from "./draftStorage";
import Source from "./Source";
import RevBrowser from "./RevBrowser";
import Preview from "./Preview";
import Drawer from "./Drawer";
import { Song } from "../api/collections";
import { Meteor } from "meteor/meteor";
import { navigateTo, View } from "../api/helpers";
import { convertToHoelibuSyntax } from "../api/ascii-importer";

enum SaveState {
  UNSAVED,
  SUCCESS,
  FAILED,
}

type EditorProps = { song: Song };

const Editor: FC<EditorProps> = (props: EditorProps) => {
  const songId = props.song._id;
  const mdServer = props.song.text;

  // Read once per mount: a draft left behind by an earlier editing session.
  const [restoredDraft] = useState(() => readDraft(songId));

  const [md, setMd] = useState(restoredDraft?.text ?? mdServer);
  const [revisionsTab, setRevisionsTab] = useState(false);
  const [dirty, setDirty] = useState(
    restoredDraft !== undefined && restoredDraft.text !== mdServer,
  );
  const [saved, setSaved] = useState(SaveState.UNSAVED);
  const [draftSavedAt, setDraftSavedAt] = useState(restoredDraft?.savedAt);

  const navigate = useNavigate();

  // Mirror the editor content so it outlives the tab. Once the content matches
  // the server again there is nothing left to recover, so drop the draft.
  useEffect(() => {
    if (dirty) {
      setDraftSavedAt(writeDraft(songId, md));
    } else {
      clearDraft(songId);
      setDraftSavedAt(undefined);
    }
  }, [songId, md, dirty]);

  // The draft always mirrors the buffer, so this is what RevBrowser lists
  // next to the server-side revisions.
  const draft = dirty ? { text: md, savedAt: draftSavedAt } : undefined;

  const handleContextMenu: MouseEventHandler = (event) => {
    if (revisionsTab) {
      toggleRevTab();
      event.preventDefault();
      return;
    }
    props.song.parse(md);
    Meteor.call("saveSong", props.song, (error: any, isValid: boolean) => {
      if (error !== undefined) {
        console.error(error);
      } else {
        if (isValid) {
          clearDraft(songId);
          setDirty(false);
          setSaved(SaveState.SUCCESS);
        } else {
          setSaved(SaveState.FAILED);
        }
      }
    });
    event.preventDefault();
  };
  // need to wait a rendering cycle, otherwise
  // RouterPrompt will read the old state
  useEffect(() => {
    if (saved == SaveState.SUCCESS) {
      navigateTo(navigate, View.view, props.song);
    } else if (saved == SaveState.FAILED) {
      navigateTo(navigate, View.home);
    }
  }, [saved]);

  const handlePaste = (text: string) => {
    return convertToHoelibuSyntax(text);
  };

  const update = (md_: string) => {
    setMd(md_);
    setDirty(md_ != mdServer);
  };

  const toggleRevTab = () => {
    setRevisionsTab(!revisionsTab);
  };

  {
    const revs = props.song.getRevisions();

    const prompt = <UnsavedChangesPrompt when={dirty} />;

    if (!revisionsTab) {
      const versions =
        revs.length > 0 || draft ? (
          <Drawer id="revs" className="revision-colors" onClick={toggleRevTab}>
            <h1>Verlauf</h1>
            <p>
              Es existieren {revs.length} Versionen
              {draft ? " sowie deine lokal gesicherte Fassung" : ""}. Klicke, um
              diese zu durchstöbern!
            </p>
          </Drawer>
        ) : undefined;

      const dirtyLabel = dirty ? (
        <span id="dirty" title="Ungesicherte Änderungen"></span>
      ) : undefined;

      // Bearbeiten mit Echtzeit-Vorschau
      return (
        <div id="editor" onContextMenu={handleContextMenu}>
          <Drawer onClick={handleContextMenu} className="list-colors">
            <h1>
              sichern
              <br />
              &amp; zurück
            </h1>
            <p>Schneller: Rechtsklick!</p>
          </Drawer>

          {dirtyLabel}
          <Preview md={md} song={props.song} updateHandler={update} />
          <Source
            md={md}
            updateHandler={update}
            className="source-colors"
            onPasteInterceptor={handlePaste}
          />

          {versions}
          {prompt}
        </div>
      );
    } else {
      // Versionen vergleichen
      return (
        <div id="editor" onContextMenu={handleContextMenu}>
          <Drawer className="chordsheet-colors" onClick={toggleRevTab}>
            <h1>zurück</h1>
            <p>…und weiterbearbeiten!</p>
          </Drawer>

          <Source md={md} updateHandler={update} className="source-colors">
            <span className="label">Version in Bearbeitung</span>
          </Source>
          <RevBrowser song={props.song} draft={draft} />
          {prompt}
        </div>
      );
    }
  }
};

export default Editor;
