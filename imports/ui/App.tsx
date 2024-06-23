import {createStore} from 'redux-dynamic-modules-core';
import {Provider} from 'react-redux';
import {ErrorBoundary} from 'react-error-boundary';

import Songs, {Song} from '../api/collections';

import {BrowserRouter, Route, RouteComponentProps, Switch} from 'react-router-dom';
import TrackingDocumentTitle from './TrackingDocumentTitle';
import {Meteor} from 'meteor/meteor';
import Hallo from "/imports/ui/Hallo";

const empty_song = {
  title: 'Neues Lied',
  text: 'Titel\nInterpret\n========\n\n#Schlagwort\n\n1:\nDas ist die [A]erste Strophe\nHat zum Teil auch [em]Akkorde\n\n\nNach zwei leeren Zeilen gilt jeglicher Text als Kommentar.\n\nRefrain:\nTra la lalala\nla la lala la la\n\n2:\nUnd noch eine weil\'s so schön ist',
  author: 'Unknown'
};

const nA404 = (
  <div className="content chordsheet-colors">
    <TrackingDocumentTitle title="Hölibu | 404" track_as="error-404"/>
    <span id="logo">
      <h1>404</h1>
      <h2>n/A</h2>
    </span>
  </div>
);
const NA400 = () => (
  <div className="content chordsheet-colors">
    <TrackingDocumentTitle title="Hölibu | 400" track_as="error-400"/>
    <span id="logo">
      <h1>400</h1>
      <h2>n/A</h2>
    </span>
  </div>
);

const WriterRoute = ({ render: render, ...rest }) => (
  <Route {...rest} render={(props) => {
    const role = Meteor.user()?.profile.role;
    return (role == 'admin' || role == 'writer') ? render(props) : nA404;
  }} />
);

const AdminRoute = ({ render: render, ...rest }) => (
  <Route {...rest} render={(props) => (
    Meteor.user()?.profile.role == 'admin' ? render(props) : nA404
  )} />
);

interface AppStates {
    songListHidden: boolean,
    swapTheme: boolean,
    themeTransition: boolean
}

interface AppProps extends RouteComponentProps {
    songsLoading: boolean,
    revisionsLoading: boolean,

    songs: Array<Song>,
    user: Meteor.User | null,

    toggleSongList: () => void,
    toggleTheme: () => void,
}


// App component - represents the whole app
class App extends React.Component<AppProps, AppStates> {
  store: any;

  constructor(props) {
    super(props);

    this.state = { 
      songListHidden: false,
      swapTheme: false,
      themeTransition: false
    };
    this.store = createStore({ });
  }

  hideSongListOnMobile = () => {
    if (window.innerWidth > 700) return;
    this.setState({
      songListHidden: true
    });
  };

  hideSongList = (hide) => {
    this.setState({
      songListHidden: hide
    });
  };

  toggleSongList = () => {
    this.setState((state) => ({songListHidden: !state.songListHidden }));
  };

  toggleTheme = () => {
    this.setState((state) => ({
      swapTheme: !state.swapTheme,
      themeTransition: true
    }));
    Meteor.setTimeout(() => {
      this.setState(() => ({themeTransition: false}));
    }, 1000);
  };


  render() {
    const ut = this.props.user?.profile.theme ?? 'auto';
    let themeDark = false;
    if (ut == 'auto') themeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (ut == 'dark') themeDark = true;
    if (this.state.swapTheme) themeDark = !themeDark;

    const theme = (themeDark ? 'dark' : 'light') + (this.state.themeTransition ? ' transition' : '');
    // Setting class on body -> used for background color of body
    document.documentElement.classList.value = theme;

    // If any song's title changes, the key for the <List /> changes and flushes all states.
    // This is a hack to easily update all internal "caching states" (matches etc.)
    const list_key = this.props.songs.map( s => s.title).join('-');

    if (!this.props.user) {

      const aside = window.innerWidth > 900 ? <aside className="drawer open list-colors">&nbsp;</aside> : undefined;
      return (
        <div id="body" className="light">
          <TrackingDocumentTitle title="Hölibu" track_as="/no-login"/>
          {aside}
        </div>
      );
    }

    if (this.props.songsLoading) {
      return (
        <div id="body" className="light">
          <aside className="drawer open list-colors">Lade Lieder…</aside>
          <div className="content chordsheet-colors">&nbsp;</div>
        </div>
      );
    }

    const getSong = (params: any) => {
      if (params.author == '-') {
        return Songs.findOne({
          title_: params.title
        });
      }
      return Songs.findOne({
        author_: params.author,
        title_: params.title
      });

    };


    return (
      <BrowserRouter>
        <Provider store={this.store} >

          <div id="body">
            <Switch>
              <Route exact={true} path='/'>
                <TrackingDocumentTitle title="Hölibu 3000" />
                <ErrorBoundary fallback={<NA400 />}>
                  <Hallo user={this.props.user} songs={this.props.songs} revisionsLoading={this.props.revisionsLoading}/>
                </ErrorBoundary>
              </Route>
              <Route >
                {nA404}
              </Route>
            </Switch>
          </div>
        </Provider>
      </BrowserRouter>
    );
  }
}
export default App;


/*
export default withTracker(props => {
  const songHandle = Meteor.subscribe('songs');
  const revHandle = Meteor.subscribe('revisions');

  return {
    songsLoading: !songHandle.ready(),
    revisionsLoading: !revHandle.ready(),
    songs: Songs.find({}, { sort: { title: 1 } }).fetch(),
    user: Meteor.user() ?? null
  };
})(App);
k
 */
