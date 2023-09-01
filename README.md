# Rechords 

A Songbook Wiki. Key features:

- Song sheets with lyrics and chord annotations on smartphones, tablets and big screens
- Song sheet viewer with transposing and autoscroll support
- Markdown based document format
- Easy editing with live-preview and versioning


![Screenshot](screenshot_dark.png)

![Screenshot](screenshot_extras.png)

# Getting Started

* Install Meteor https://docs.meteor.com/install.html
* make sure you are using an adequate node version ( 10 - 14 ) -> install nvm otherwise to switch when needed

* change to app folder, install npm packages, start the App

```
cd app
meteor npm i
meteor
```
If everything is successfull you should see the following
```
=> Started proxy.
=> Started MongoDB.
...
```

## macOS: Arm64
* The current meteor version (2.1) is not (and never will) be supported under arm64/macOS
* However you can setup a terminal starting in x86 mode,  https://apple.stackexchange.com/questions/428768/on-apple-m1-with-rosetta-how-to-open-entire-terminal-iterm-in-x86-64-architec
* Be aware that if you are using brew you will need install all applications you'd like to use in your terminal again for x86 (x86 resides under /usr/local, arm64 under /opt/homebrew/)
* Rosetta 2 needs to be installed in any case as meteor's mongoDB runs with it (see https://docs.meteor.com/install.html)