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
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
} from "react-router-dom";
import TrackingDocumentTitle from "./TrackingDocumentTitle";
import { Meteor } from "meteor/meteor";
import Printer from "/imports/ui/Printer";
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

const WriterRoute = ({ render: render, ...rest }) => (
  <Route
    {...rest}
    render={(props) => {
      const role = Meteor.user()?.profile.role;
      return role == "admin" || role == "writer" ? render(props) : nA404;
    }}
  />
);

const AdminRoute = ({ render: render, ...rest }) => (
  <Route
    {...rest}
    render={(props) =>
      Meteor.user()?.profile.role == "admin" ? render(props) : nA404
    }
  />
);

interface AppStates {
  showMenu: boolean;
  swapTheme: boolean;
  themeTransition: boolean;
}

interface AppProps extends RouteComponentProps {
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
    // Setting class on body -> used for background color of body
    document.documentElement.classList.value = theme;

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
              <Switch>
                <ErrorBoundary fallback={<NA400 />}>
                  <Route exact={true} path="/">
                    {songList}
                    <TrackingDocumentTitle title="Hölibu 3000" />
                    <Hallo />
                    <MenuBurger />
                  </Route>

                  <Route path="/login">
                    <TrackingDocumentTitle
                      title="Hölibu"
                      track_as="/no-login"
                    />
                    <Login />
                  </Route>

                  <Route
                    path="/print/:author/:title"
                    render={(routerProps) => {
                      const song = getSong(routerProps.match.params);

                      if (song === undefined) {
                        return nA404;
                      }

                      return (
                        <>
                          <TrackingDocumentTitle
                            title={
                              "Hölibu | " + song.author + ": " + song.title
                            }
                          />
                          <Printer song={song} {...routerProps} />
                        </>
                      );
                    }}
                  />
                  <Route
                    path="/pdf/:author/:title"
                    render={(routerProps) => {
                      const song = getSong(routerProps.match.params);

                      if (song === undefined) {
                        return nA404;
                      }

                      return (
                        <>
                          <TrackingDocumentTitle
                            title={
                              "Hölibu | " + song.author + ": " + song.title
                            }
                          />
                          <PdfViewer song={song} {...routerProps} />
                        </>
                      );
                    }}
                  />

                  <Route
                    path="/view/:author/:title"
                    render={(routerProps) => {
                      const song = getSong(routerProps.match.params);

                      if (song === undefined) {
                        return nA404;
                      }

                      return (
                        <>
                          {songList}
                          <TrackingDocumentTitle
                            title={
                              "Hölibu | " + song.author + ": " + song.title
                            }
                          />
                          <Viewer song={song} {...routerProps} />
                        </>
                      );
                    }}
                  />

                  <WriterRoute
                    path="/edit/:author/:title"
                    render={(match) => {
                      const song = getSong(match.match.params);

                      if (song === undefined) {
                        return nA404;
                      }

                      let editor;
                      // In any case, the editor is rendered. However, a rerender is triggered after the song's
                      // revisions have been loaded.
                      editor = this.props.revisionsLoading ? (
                        <Editor song={song} />
                      ) : (
                        <Editor song={song} />
                      );

                      return (
                        <>
                          <TrackingDocumentTitle
                            title={
                              "Hölibu | " +
                              song.author +
                              ": " +
                              song.title +
                              " (bearbeiten)"
                            }
                          />
                          {editor}
                        </>
                      );
                    }}
                  />

                  <WriterRoute
                    path="/new"
                    render={() => {
                      const song = new Song(empty_song);

                      return (
                        <>
                          <TrackingDocumentTitle title="Hölibu | Neues Lied" />
                          <Editor song={song} />
                        </>
                      );
                    }}
                  />

                  <Route
                    path="/progress"
                    render={() => {
                      const content = this.props.revisionsLoading ? (
                        <div className="content chordsheet-colors">
                          Lade Lieder-Fortschritt…
                        </div>
                      ) : (
                        <Progress songs={this.props.songs} />
                      );

                      return (
                        <>
                          <TrackingDocumentTitle title="Hölibu | Lieder-Fortschritt" />
                          {content}
                          <MenuBurger />
                        </>
                      );
                    }}
                  />

                  <AdminRoute
                    path="/users"
                    render={() => {
                      const users = Meteor.users.find().fetch();
                      return (
                        <>
                          <TrackingDocumentTitle title="Hölibu | Alle Benutzer" />
                          <Users users={users} />
                          <MenuBurger />
                        </>
                      );
                    }}
                  />

                  <Route
                    path="/user"
                    render={() => {
                      const user = Meteor.user();

                      if (!user) {
                        return <Redirect to="/" />;
                      }
                      return (
                        <>
                          <TrackingDocumentTitle
                            title={"Hölibu | " + user.profile.name}
                          />
                          <User
                            user={user}
                            key={user._id}
                            revisionsLoading={this.props.revisionsLoading}
                          />
                          <MenuBurger />
                        </>
                      );
                    }}
                  />
                </ErrorBoundary>
              </Switch>
            </div>
          </BrowserRouter>
        </MenuContext.Provider>
      </ThemeContext.Provider>
    );
  }
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
