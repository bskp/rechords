import * as React from "react";
import { withTracker } from "meteor/react-meteor-data";
import { ErrorBoundary } from "react-error-boundary";

import Songs, { Song } from "../api/collections";

import List from "./Songlist/List";
import Viewer from "./Viewer";
import Editor from "./Editor";
import Progress from "./Progress";
import Users from "./Users";
import User from "./User";
import { Login } from "./Login";
import Hallo from "./Hallo";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import TrackingDocumentTitle from "./TrackingDocumentTitle";
import { Meteor } from "meteor/meteor";
import { Printer } from "/imports/ui/Printer";
import { Button } from "/imports/ui/Button";
import { ReactSVG } from "react-svg";
import { useContext } from "react";
import classnames from "classnames";
import { PdfViewer } from "./PdfViewer/PdfViewer";

export const ThemeContext = React.createContext<{
  toggleTheme: () => void;
  themeDark: boolean;
}>({
  toggleTheme: () => {},
  themeDark: true,
});

export const MenuContext = React.createContext<{
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
}>({
  showMenu: false,
  setShowMenu: () => {},
});

export const VideoContext = React.createContext<{
  hasVideo: boolean;
  setActive: (active: boolean) => void;
  isActive: boolean;
}>({
  hasVideo: false,
  setActive: () => {},
  isActive: false,
});

const empty_song = {
  title: "Neues Lied",
  text: "Titel\nInterpret\n========\n\n#Schlagwort\n\n1:\nDas ist die [A]erste Strophe\nHat zum Teil auch [em]Akkorde\n\n\nNach zwei leeren Zeilen gilt jeglicher Text als Kommentar.\n\nRefrain:\nTra la lalala\nla la lala la la\n\n2:\nUnd noch eine weil's so schön ist",
  author: "Unknown",
};

const nA404 = (
  <div className="content chordsheet-colors">
    <TrackingDocumentTitle title="Hölibu | 404" track_as="error-404" />
    <span id="logo">
      <h1>404</h1>
      <h2>n/A</h2>
    </span>
  </div>
);
const NA400 = () => (
  <div className="content chordsheet-colors">
    <TrackingDocumentTitle title="Hölibu | 400" track_as="error-400" />
    <span id="logo">
      <h1>400</h1>
      <h2>n/A</h2>
    </span>
  </div>
);

const WriterRoute = ({ children }: { children: React.ReactNode }) => {
  const role = Meteor.user()?.profile.role;
  if (role == "admin" || role == "writer") {
    return <>{children}</>;
  }
  return <>{nA404}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const role = Meteor.user()?.profile.role;
  if (role == "admin") {
    return <>{children}</>;
  }
  return <>{nA404}</>;
};

interface AppStates {
  showMenu: boolean;
  swapTheme: boolean;
  themeTransition: boolean;
}

interface AppProps {
  songsLoading: boolean;
  revisionsLoading: boolean;

  songs: Song[];
  user: Meteor.User | null;

  toggleSongList: () => void;
  toggleTheme: () => void;
}

const MenuBurger = () => {
  const { setShowMenu } = useContext(MenuContext);
  return (
    <aside id="rightSettings">
      <Button onClick={() => setShowMenu(true)} phoneOnly>
        <ReactSVG src="/svg/menu.svg" />
      </Button>
    </aside>
  );
};

class App extends React.Component<AppProps, AppStates> {
  constructor(props: AppProps) {
    super(props);

    this.state = {
      showMenu: false,
      swapTheme: false,
      themeTransition: false,
    };
  }

  toggleTheme = () => {
    this.setState((state) => ({
      swapTheme: !state.swapTheme,
      themeTransition: true,
    }));
    Meteor.setTimeout(() => {
      this.setState(() => ({ themeTransition: false }));
    }, 1000);
  };

  render() {
    const ut = this.props.user?.profile.theme ?? "auto";
    let themeDark = false;
    if (ut == "auto")
      themeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (ut == "dark") themeDark = true;
    if (this.state.swapTheme) themeDark = !themeDark;

    const theme =
      (themeDark ? "dark" : "light") +
      (this.state.themeTransition ? " transition" : "");
    document.documentElement.classList.value = theme;

    const list_key = this.props.songs.map((s) => s.title).join("-");

    if (this.props.songsLoading) {
      return (
        <div id="body" className="light">
          <aside className="drawer open list-colors">Lade Lieder…</aside>
          <div className="content chordsheet-colors">&nbsp;</div>
        </div>
      );
    }

    const getSong = (params: { title: string; author: string }) => {
      if (params.author == "-") {
        return Songs.findOne({
          title_: params.title.toLowerCase(),
        });
      }
      return Songs.findOne({
        author_: params.author.toLowerCase(),
        title_: params.title.toLowerCase(),
      });
    };

    const songList = (
      <List songs={this.props.songs} key={list_key} user={this.props.user} />
    );
    return (
      <ThemeContext.Provider
        value={{
          toggleTheme: () => this.toggleTheme(),
          themeDark: theme.includes("dark"),
        }}
      >
        <MenuContext.Provider
          value={{
            showMenu: this.state.showMenu,
            setShowMenu: (show) => this.setState({ showMenu: show }),
          }}
        >
          <BrowserRouter>
            <div
              id="body"
              className={classnames({ noScroll: this.state.showMenu })}
            >
              <Routes>
                <ErrorBoundary fallback={<NA400 />}>
                  <Route
                    path="/"
                    element={
                      <>
                        <TrackingDocumentTitle title="Hölibu 3000" />
                        {songList}
                        <Hallo />
                        <MenuBurger />
                      </>
                    }
                  />

                  <Route
                    path="/login"
                    element={
                      <>
                        <TrackingDocumentTitle
                          title="Hölibu"
                          track_as="/no-login"
                        />
                        <Login />
                      </>
                    }
                  />

                  <Route
                    path="/print/:author/:title"
                    element={<PrintRoute getSong={getSong} />}
                  />
                  <Route
                    path="/pdf/:author/:title"
                    element={<PdfRoute getSong={getSong} />}
                  />

                  <Route
                    path="/view/:author/:title"
                    element={<ViewRoute getSong={getSong} songList={songList} />}
                  />

                  <Route
                    path="/edit/:author/:title"
                    element={
                      <WriterRoute>
                        <EditRoute getSong={getSong} />
                      </WriterRoute>
                    }
                  />

                  <Route
                    path="/new"
                    element={
                      <WriterRoute>
                        <TrackingDocumentTitle title="Hölibu | Neues Lied" />
                        <Editor song={new Song(empty_song)} />
                      </WriterRoute>
                    }
                  />

                  <Route
                    path="/progress"
                    element={
                      <>
                        <TrackingDocumentTitle title="Hölibu | Lieder-Fortschritt" />
                        {songList}
                        <ProgressContent songs={this.props.songs} revisionsLoading={this.props.revisionsLoading} />
                        <MenuBurger />
                      </>
                    }
                  />

                  <Route
                    path="/users"
                    element={
                      <AdminRoute>
                        <>
                          <TrackingDocumentTitle title="Hölibu | Alle Benutzer" />
                          {songList}
                          <Users users={Meteor.users.find().fetch()} />
                          <MenuBurger />
                        </>
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/user"
                    element={<UserRoute songList={songList} revisionsLoading={this.props.revisionsLoading} />}
                  />
                </ErrorBoundary>
              </Routes>
            </div>
          </BrowserRouter>
        </MenuContext.Provider>
      </ThemeContext.Provider>
    );
  }
}

function PrintRoute({ getSong }: { getSong: (p: { title: string; author: string }) => Song | undefined }) {
  const params = useParams<{ author: string; title: string }>();
  const song = getSong(params);
  if (song === undefined) return <>{nA404}</>;
  return (
    <>
      <TrackingDocumentTitle
        title={"Hölibu | " + song.author + ": " + song.title}
      />
      <Printer song={song} />
    </>
  );
}

function PdfRoute({ getSong }: { getSong: (p: { title: string; author: string }) => Song | undefined }) {
  const params = useParams<{ author: string; title: string }>();
  const song = getSong(params);
  if (song === undefined) return <>{nA404}</>;
  return (
    <>
      <TrackingDocumentTitle
        title={"Hölibu | " + song.author + ": " + song.title}
      />
      <PdfViewer song={song} />
    </>
  );
}

function ViewRoute({ getSong, songList }: { getSong: (p: { title: string; author: string }) => Song | undefined; songList: React.ReactNode }) {
  const params = useParams<{ author: string; title: string }>();
  const song = getSong(params);
  if (song === undefined) return <>{nA404}</>;
  return (
    <>
      <TrackingDocumentTitle
        title={"Hölibu | " + song.author + ": " + song.title}
      />
      {songList}
      <Viewer song={song} />
    </>
  );
}

function EditRoute({ getSong }: { getSong: (p: { title: string; author: string }) => Song | undefined }) {
  const params = useParams<{ author: string; title: string }>();
  const song = getSong(params);
  if (song === undefined) return <>{nA404}</>;
  return (
    <>
      <TrackingDocumentTitle
        title={`Hölibu | ${song.author}: ${song.title} (bearbeiten)`}
      />
      <Editor song={song} />
    </>
  );
}

function ProgressContent({ songs, revisionsLoading }: { songs: Song[]; revisionsLoading: boolean }) {
  const content = revisionsLoading ? (
    <div className="content chordsheet-colors">
      Lade Lieder-Fortschritt…
    </div>
  ) : (
    <Progress songs={songs} />
  );
  return content;
}

function UserRoute({ songList, revisionsLoading }: { songList: React.ReactNode; revisionsLoading: boolean }) {
  const user = Meteor.user();
  if (!user) return <Navigate to="/" />;
  return (
    <>
      {songList}
      <TrackingDocumentTitle title={"Hölibu | " + user.profile.name} />
      <User
        user={user}
        key={user._id}
        revisionsLoading={revisionsLoading}
      />
      <MenuBurger />
    </>
  );
}

export default withTracker((_) => {
  const songHandle = Meteor.subscribe("songs");
  const revHandle = Meteor.subscribe("revisions");

  const songs = Songs.find({}, { sort: { title: 1 } }).fetch();
  return {
    songsLoading: !songHandle.ready(),
    revisionsLoading: !revHandle.ready(),
    songs,
    user: Meteor.user(),
  };
})(App);
