# Rechords 

A Songbook Wiki. Key features:

- Song sheets with lyrics and chord annotations on smartphones, tablets and big screens
- Song sheet viewer with transposing and autoscroll support
- Markdown based document format
- Easy editing with live-preview and versioning


![Screenshot](screenshot_dark.png)

![Screenshot](screenshot_extras.png)

# Getting Started

## Using Docker

```yml
services:
  app:
    image: akkuratgrotesk/rechords:latest
    ports:
      - '8080:3000'
    depends_on:
      - mongo
    environment:
      ROOT_URL: ${APP_ROOT_URL:-http://localhost}
      MONGO_URL: mongodb://mongo:27017/meteor
      PORT: 3000

  mongo:
    image: mongo:latest
    command:
      - --storageEngine=wiredTiger
    volumes:
      - data:/data/db

volumes:
  data:
```

in the `<your_compose_directory>` where your `docker-compose.yml` file is run
```sh
docker compose up
```

or with `-d` to detach once you're sure everything is working fine
```sh
docker compose up -d
[+] Running 3/3
 ✔ Volume "<your_compose_directory>_data"      Created                                                                                                                                                                                                            0.0s
 ✔ Container <your_compose_directory>-mongo-1  Started                                                                                                                                                                                                            0.4s
 ✔ Container <your_compose_directory>-app-1    Started
```


open http://localhost:8080/ in your browser
voila

### remove

```sh
docker compose rm 
```
this removes the generated containers (asking for each)

remove the volume
```sh
docker volume rm <your_compose_directory>_data
```


## Local installation

* Install Meteor https://docs.meteor.com/install.html

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
npm run test
```


# Build Docker Images

## Local Build

* You have meteor installed locally

```
cd app
meteor build ../docker-images/showcase_localbuild/ --directory
# there should be now a bundle directory in showcase_localbuild
cd ../docker-images/showcase_localbuild/
docker build . 
```


## Build in docker

* Clean build inside image, ideal when
    * no node install 
    * CI/CD
* However, it's slower (at least on OS X)

Since the app context is needed we must run docker at least from the app level dir (or higher)
```
docker build -f docker-images/showcase/Dockerfile .
```

## Update initial Songs 

start meteor locally (per default meteor runs on 3000, mongodb on 3001)
mongoexport command comes from installing mongodb locally
```
mongoexport --port 3001 --db meteor --collection=songs --out server/songs.json
mongoexport --port 3001 --db meteor --collection=revisions --out server/revisions.json
```

or on the server assuming the docker container runninng mongodb is called `mongodb`
```
docker exec mongodb mongoexport --db hoelibu-ch --collection=songs --query='{ "tags": "lizenz:frei" }' > initial-songs.json
2025-01-26T09:17:58.494+0000	connected to: mongodb://localhost/
2025-01-26T09:17:58.501+0000	exported 12 records
todo: revisions (how to filter with other collection?)
```
