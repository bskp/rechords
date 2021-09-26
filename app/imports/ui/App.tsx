import * as React from 'react'
import { createStore } from 'redux-dynamic-modules-core'
import { withTracker } from 'meteor/react-meteor-data'
import { Provider } from 'react-redux'
import {ErrorBoundary} from 'react-error-boundary'


import Songs, {Song} from '../api/collections'

import List from './List'
import Viewer from './Viewer'
import Editor from './Editor'
import Progress from './Progress'
import Users from './Users'
import User from './User'
import HideSongList from './HideSongList'
import Login from './Login'
import Hallo from './Hallo'

import { BrowserRouter, Route, Switch, RouteComponentProps} from 'react-router-dom'
import TrackingDocumentTitle from './TrackingDocumentTitle'
import { MobileMenu } from './MobileMenu'
import { EditorAdvanced, getEditorModule } from './AdvancedEditor/EditorAdvanced';
import { DynamicModuleLoader } from 'redux-dynamic-modules';
import Printer from './Printer';
import { Meteor } from 'meteor/meteor'

const empty_song = {
  title: 'Neues Lied',
  text: 'Titel\nInterpret\n========\n\n#Schlagwort\n\n1:\nDas ist die [A]erste Strophe\nHat zum Teil auch [em]Akkorde\n\n\nNach zwei leeren Zeilen gilt jeglicher Text als Kommentar.\n\nRefrain:\nTra la lalala\nla la lala la la\n\n2:\nUnd noch eine weil\'s so schön ist',
  author: 'Unknown'
}

const nA404 = (
  <div className="content chordsheet-colors">
    <TrackingDocumentTitle title="Hölibu | 404" track_as="error-404"/>
    <span id="logo">
      <h1>404</h1>
      <h2>n/A</h2>
    </span>
  </div>
)
const NA400 = () => (
  <div className="content chordsheet-colors">
    <TrackingDocumentTitle title="Hölibu | 404" track_as="error-404"/>
    <span id="logo">
      <h1>404</h1>
      <h2>n/A</h2>
    </span>
  </div>
)

const WriterRoute = ({ render: render, ...rest }) => (
    <Route {...rest} render={(props) => {
        const role = Meteor.user().profile.role;
        return (role == 'admin' || role == 'writer') ? render(props) : nA404
    }} />
)

const AdminRoute = ({ render: render, ...rest }) => (
    <Route {...rest} render={(props) => (
        Meteor.user().profile.role == 'admin' ? render(props) : nA404
    )} />
)

interface AppStates {
    songListHidden: boolean,
    swapTheme: boolean,
    themeTransition: boolean
}

interface AppProps extends RouteComponentProps {
    songsLoading: boolean,
    revisionsLoading: boolean,

    songs: Array<Song>,
    user: Meteor.User,

    toggleSongList: Function,
    toggleTheme: Function,
}


// App component - represents the whole app
class App extends React.Component<AppProps, AppStates> {
    store: any;

    constructor(props) {
      super(props)

      this.state = { 
        songListHidden: false,
        swapTheme: false,
        themeTransition: false
      }
      this.store = createStore({ })
    }

    hideSongListOnMobile = () => {
      if (window.innerWidth > 700) return
      this.setState({
        songListHidden: true
      })
    }

    hideSongList = (hide) => {
      this.setState({
        songListHidden: hide
      })
    }

    toggleSongList = () => {
      this.setState((state) => ({songListHidden: !state.songListHidden }))
    }

    toggleTheme = () => {
      this.setState((state) => ({
        swapTheme: !state.swapTheme,
        themeTransition: true
      }))
      Meteor.setTimeout(() => {
        this.setState(() => ({themeTransition: false}))
      }, 1000)
    }


    render() {
      if (!this.props.user) {

        const aside = window.innerWidth > 900 ? <aside className="drawer open list-colors"> </aside> : undefined
        return (
          <div id="body" className="light">
            <TrackingDocumentTitle title="Hölibu" track_as="/no-login"/>
            {aside}
            <Login />
          </div>
        )
      }

      if (this.props.songsLoading) {
        return (
          <div id="body" className="light">
            <aside className="drawer open list-colors">Lade Lieder…</aside>
            <div className="content chordsheet-colors">&nbsp;</div>
          </div>
        )
      }

      const getSong = (params) => {
        if (params.author == '-') {
          return Songs.findOne({
            title_: params.title
          })
        }
        return Songs.findOne({
          author_: params.author,
          title_: params.title
        })

      }

      const ut = this.props.user?.profile.theme ?? 'auto'
      let themeDark = false
      if (ut == 'auto') themeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (ut == 'dark') themeDark = true
      if (this.state.swapTheme) themeDark = !themeDark

      const theme = (themeDark ? 'dark' : 'light') + (this.state.themeTransition ? ' transition' : '')

      // If any song's title changes, the key for the <List /> changes and flushes all states.
      // This is a hack to easily update all internal "caching states" (matches etc.)
      const list_key = this.props.songs.map( s => s.title).join('-')

      return (
        <BrowserRouter>
          <Provider store={this.store} >
            <div className={theme}>
            <MobileMenu toggleSongList={this.toggleSongList} songListHidden={this.state.songListHidden} />

              <div id="body">
                <List 
                  songs={this.props.songs}
                  key={list_key}
                  hidden={this.state.songListHidden}
                  hideOnMobile={this.hideSongListOnMobile}
                  user={this.props.user}
                />
                <Switch>

                  <Route exact={true} path='/'>
                      <TrackingDocumentTitle title="Hölibu 3000" />
                      <ErrorBoundary fallback={<NA400 />}>
                        <Hallo songs={this.props.songs} revisionsLoading={this.props.revisionsLoading}/>
                      </ErrorBoundary>
                </Route>
                 


                  <Route path='/print/:author/:title' render={(routerProps) => {
                    const song = getSong(routerProps.match.params)

                    if (song === undefined) {
                      return nA404
                    }

                    return (
                      <>
                        <TrackingDocumentTitle title={'Hölibu | ' + song.author + ': ' + song.title}/>
                        <Printer
                          song={song}
                          toggleTheme={this.toggleTheme}
                          themeDark={theme.includes('dark')}
                          {...routerProps}
                        />
                      </>
                    )
                  }} />


                  <Route path='/view/:author/:title' render={(routerProps) => {
                    const song = getSong(routerProps.match.params)

                    if (song === undefined) {
                      return nA404 
                    }

                    return (
                      <>
                        <TrackingDocumentTitle title={'Hölibu | ' + song.author + ': ' + song.title}/>
                        <Viewer 
                          song={song}  
                          toggleTheme={this.toggleTheme}
                          themeDark={theme.includes('dark')}
                          {...routerProps} 
                                    {...routerProps} 
                                />
                            </>
                        )
                    }} />

                    <WriterRoute path='/edit/:author/:title' render={(match) => {
                        let song = getSong(match.match.params);

                        if (song === undefined) {
                            return nA404;
                        }

                        // In any case, the editor is rendered. However, a re-render is triggered after the song's
                        // revisions have been loaded.
                        let editor;
                        if ( Meteor.settings.public.useAdvancedEditor ) {
                            editor = this.props.revisionsLoading ?
        <DynamicModuleLoader modules={[getEditorModule()]}> <EditorAdvanced song={song} /></DynamicModuleLoader> :
         <DynamicModuleLoader modules={[getEditorModule()]}> <EditorAdvanced song={song} /></DynamicModuleLoader>;
                        } else {
                            editor = this.props.revisionsLoading ? <Editor song={song} /> : <Editor song={song} />;
                        }

                        return (
                            <>
                                <TrackingDocumentTitle title={"Hölibu | " + song.author + ": " + song.title + " (bearbeiten)"}/>
                                <HideSongList handle={this.hideSongList}/>
                                {editor}
                            </>
                        )
                    }} />

                    <WriterRoute path="/new" render={() => {
                        var song = new Song(empty_song);

                        return (
                            <>
                                <TrackingDocumentTitle title="Hölibu | Neues Lied" />
                                <HideSongList handle={this.hideSongList}/>
                                <Editor song={song} />
                            </>
                        )
                    }} />

                    <Route path="/progress" render={() => {
                        const content = this.props.revisionsLoading ? (
                            <div className="content chordsheet-colors">Lade Lieder-Fortschritt…</div>
                            ) : <Progress songs={this.props.songs} />;

                        return (
                            <>
                                <TrackingDocumentTitle title="Hölibu | Lieder-Fortschritt" />
                                {content}
                            </>
                        )
                    }} />

                    <AdminRoute path="/users" render={() => {
                        const users = Meteor.users.find().fetch();
                        return (
                            <>
                                <TrackingDocumentTitle title="Hölibu | Alle Benutzer" />
                                <Users users={users}/>
                            </>
                        )
                    }} />

                    <Route path="/user" render={() => {
                        const user = Meteor.user();
                        return (
                            <>
                                <TrackingDocumentTitle title={"Hölibu | " + user.profile.name} />
                                <User user={user} key={user._id} revisionsLoading={this.props.revisionsLoading}/>
                            </>
                        )
                    }} />

                    <Route >
                      {nA404}
                      </Route>
                </Switch>
              </div>
            </div>
          </Provider>
        </BrowserRouter>
      )
    }
}


export default withTracker(props => {
  const songHandle = Meteor.subscribe('songs')
  const revHandle = Meteor.subscribe('revisions')

  return {
    songsLoading: !songHandle.ready(),
    revisionsLoading: !revHandle.ready(),
    songs: Songs.find({}, { sort: { title: 1 } }).fetch(),
    user: Meteor.user()
  }
})(App)
