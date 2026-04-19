import * as React from "react";
import { useContext } from "react";
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
} from "react-router";
import TrackingDocumentTitle from "./TrackingDocumentTitle";
import { Meteor } from "meteor/meteor";
import { Printer } from "/imports/ui/Printer";
import { Button } from "/imports/ui/Button";
import { ReactSVG } from "react-svg";
import classnames from "classnames";
import { PdfViewer } from "./PdfViewer/PdfViewer";
import { getUser } from "../api/auth";
import type { RechordsUser } from "../api/auth";

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

const nA403 = (
  <div className="content chordsheet-colors">
    <TrackingDocumentTitle title="Hölibu | 403" track_as="error-403" />
    <span id="logo">
      <h1>403</h1>
      <h2>Computer says no</h2>
    </span>
  </div>
);
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
      <h2>Oh no!</h2>
    </span>
  </div>
);

const WriterRoute = ({ children }: { children: React.ReactNode }) => {
  const role = getUser()?.profile.role;
  if (role == "admin" || role == "writer") {
    return <>{children}</>;
  }
  return <>{nA403}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const role = getUser()?.profile.role;
  if (role == "admin") {
    return <>{children}</>;
  }
  return <>{nA403}</>;
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
  user: RechordsUser | null;
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

// App component - represents the whole app
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

  private getThemeClass() {
    const ut = this.props.user?.profile.theme ?? "auto";
    let themeDark = false;
    if (ut == "auto")
      themeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (ut == "dark") themeDark = true;
    if (this.state.swapTheme) themeDark = !themeDark;

    return (
      (themeDark ? "dark" : "light") +
      (this.state.themeTransition ? " transition" : "")
    );
  }

  componentDidMount() {
    document.documentElement.classList.value = this.getThemeClass();
  }

  componentDidUpdate() {
    document.documentElement.classList.value = this.getThemeClass();
  }

  render() {
    const theme = this.getThemeClass();

    // If any song's title changes, the key for the <List /> changes and flushes all states.
    // This is a hack to easily update all internal "caching states" (matches etc.)
    const list_key = this.props.songs.map((s) => s.title).join("-");

    if (this.props.songsLoading) {
      return (
        <div id="body" className="light">
          <aside className="drawer open list-colors">Lade Lieder…</aside>
          <div className="content chordsheet-colors">&nbsp;</div>
        </div>
      );
    }

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
                <Route
                  path="/"
                  element={
                    <ErrorBoundary fallback={<NA400 />}>
                      <TrackingDocumentTitle title="Hölibu 3000" />
                      {songList}
                      <Hallo />
                      <MenuBurger />
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/login"
                  element={
                    <ErrorBoundary fallback={<NA400 />}>
                      <TrackingDocumentTitle
                        title="Hölibu"
                        track_as="/no-login"
                      />
                      <Login />
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/print/:author/:title"
                  element={
                    <ErrorBoundary fallback={<NA400 />}>
                      <SongRoute action="drucken">
                        {(song) => <Printer song={song} />}
                      </SongRoute>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/pdf/:author/:title"
                  element={
                    <ErrorBoundary fallback={<NA400 />}>
                      <SongRoute action="PDF">
                        {(song) => <PdfViewer song={song} />}
                      </SongRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/view/:author/:title"
                  element={
                    <ErrorBoundary fallback={<NA400 />}>
                      <SongRoute>
                        {(song) => (
                          <>
                            {songList}
                            <Viewer song={song} />
                          </>
                        )}
                      </SongRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/edit/:author/:title"
                  element={
                    <WriterRoute>
                      <ErrorBoundary fallback={<NA400 />}>
                        <SongRoute action="bearbeiten">
                          {(song) => <Editor song={song} />}
                        </SongRoute>
                      </ErrorBoundary>
                    </WriterRoute>
                  }
                />

                <Route
                  path="/new"
                  element={
                    <WriterRoute>
                      <ErrorBoundary fallback={<NA400 />}>
                        <TrackingDocumentTitle title="Hölibu | Neues Lied" />
                        <Editor song={new Song(empty_song)} />
                      </ErrorBoundary>
                    </WriterRoute>
                  }
                />

                <Route
                  path="/progress"
                  element={
                    <ErrorBoundary fallback={<NA400 />}>
                      <TrackingDocumentTitle title="Hölibu | Lieder-Fortschritt" />
                      {songList}
                      <ProgressContent
                        songs={this.props.songs}
                        revisionsLoading={this.props.revisionsLoading}
                      />
                      <MenuBurger />
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/users"
                  element={
                    <AdminRoute>
                      <ErrorBoundary fallback={<NA400 />}>
                        <TrackingDocumentTitle title="Hölibu | Alle Benutzer" />
                        {songList}
                        <Users />
                        <MenuBurger />
                      </ErrorBoundary>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/user"
                  element={
                    <ErrorBoundary fallback={<NA400 />}>
                      <UserRoute
                        songList={songList}
                        revisionsLoading={this.props.revisionsLoading}
                      />
                    </ErrorBoundary>
                  }
                />
              </Routes>
            </div>
          </BrowserRouter>
        </MenuContext.Provider>
      </ThemeContext.Provider>
    );
  }
}

function useSongFromParams() {
  const params = useParams<{ author: string; title: string }>();
  const author = params.author?.toLowerCase();
  const title = params.title?.toLowerCase();
  if (!title || !author) return undefined;

  if (author == "-") {
    return Songs.findOne({ title_: title });
  }
  return Songs.findOne({ author_: author, title_: title });
}

function SongRoute({
  action = "",
  children,
}: {
  action?: string;
  children: (song: Song) => React.ReactNode;
}) {
  const song = useSongFromParams();
  if (song === undefined) return <>{nA404}</>;
  if (action) {
    action = ` (${action})`;
  }
  return (
    <>
      <TrackingDocumentTitle
        title={`Hölibu | ${song.author}: ${song.title}${action}`}
      />
      {children(song)}
    </>
  );
}

function ProgressContent({
  songs,
  revisionsLoading,
}: {
  songs: Song[];
  revisionsLoading: boolean;
}) {
  return revisionsLoading ? (
    <div className="content chordsheet-colors">Lade Lieder-Fortschritt…</div>
  ) : (
    <Progress songs={songs} />
  );
}

function UserRoute({
  songList,
  revisionsLoading,
}: {
  songList: React.ReactNode;
  revisionsLoading: boolean;
}) {
  const user = Meteor.user();
  if (!user) return <Navigate to="/" />;
  return (
    <>
      {songList}
      <TrackingDocumentTitle
        title={"Hölibu | " + getUser()?.profile.name || "?"}
      />
      <User user={user} key={user._id} revisionsLoading={revisionsLoading} />
      <MenuBurger />
    </>
  );
}

export default withTracker(() => {
  const songHandle = Meteor.subscribe("songs");
  const revHandle = Meteor.subscribe("revisions");

  const songs = Songs.find({}, { sort: { title: 1 } }).fetch();
  return {
    songsLoading: !songHandle.ready(),
    revisionsLoading: !revHandle.ready(),
    songs,
    user: getUser(),
  };
})(App);
