# based on: https://github.com/disney/meteor-base/blob/main/example/default.dockerfile

# todo: use intermediate image like here: https://github.com/disney/meteor-base/blob/main/example/app-with-native-dependencies.dockerfile

# The tag here should match the Meteor version of your app, per .meteor/release
FROM geoffreybooth/meteor-base:3.1

# # Copy app package.json and package-lock.json into container
# COPY ./app/package*.json $APP_SOURCE_FOLDER/

# RUN bash $SCRIPTS_FOLDER/build-app-npm-dependencies.sh

# # Copy app source into container
# COPY ./app $APP_SOURCE_FOLDER/

# RUN bash $SCRIPTS_FOLDER/build-meteor-bundle.sh


# Use the specific version of Node expected by your Meteor release, per https://docs.meteor.com/changelog.html; this is expected for Meteor 3.1
FROM node:22.11.0-alpine

ENV APP_BUNDLE_FOLDER=/opt/bundle
ENV SCRIPTS_FOLDER=/docker

# Runtime dependencies; if your dependencies need compilation (native modules such as bcrypt) or you are using Meteor <1.8.1, use app-with-native-dependencies.dockerfile instead
RUN apk --no-cache add \
		bash \
		ca-certificates
RUN apk add --no-cache --virtual .build-deps alpine-sdk python3 

# Copy in entrypoint
COPY --from=0 $SCRIPTS_FOLDER $SCRIPTS_FOLDER/

# Copy in app bundle
COPY ./bundle $APP_BUNDLE_FOLDER/bundle/

RUN bash $SCRIPTS_FOLDER/build-meteor-npm-dependencies.sh

RUN apk del .build-deps
# Start app
ENTRYPOINT ["/docker/entrypoint.sh"]

CMD ["node", "main.js"]
