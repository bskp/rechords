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

# Running showdown tests

```
npm run test-showdown
```

# Collections [WIP]


```mermaid
erDiagram
    user 
    
    collection 
    song 

    user ||--o{ collection : "is allowed in"
    collection ||--o{ song : "owns"

```

## Slugs

`/view/:collection/:artist/:title` 

or

`/c/:collection/view/:artist/:title`

eher erstere Variante

