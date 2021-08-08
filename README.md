# Rechords
## showdown-rechords
Implementation of markdown dialect extended by anotation for chords using https://github.com/showdownjs/showdown
 
## app
Meteor Based app for editing the songs more or less interactively. 
[x] Plain Text Markdown Editing support
[ ] MarkdownRechords syntax Highlighting when editing
[x] Transposing of Chords

# Get Started

## Dumping DB on a production stage

Assuming mongo runs in a container named mongodb and a DB called Rechords

```docker exec mongodb mongodump -d Rechords --archive --gzip```

This will put everything to std out.

Use ssh to write the contents locally:

```ssh user@url.domain "command that will print stdout" > myArchive.gz```

## Restoring locally

* Install mongodb-database-tools (cli client tools)
* Start Meteor (Meteor starts its own lightweight dev mongoserver)
* `meteor mongo` will show you the connection to mongodb (port and DB-Name)
* Use the mongorestore command
```
mongorestore --port 3001 --gzip --archive=myArchive.gz 
mongorestore --port 3001 --archive=../backups/asdf.bson --nsFrom=Rechords.* --nsTo=meteor.* --drop
```
Db name on the server: Rechords -> locally meteor
( the -d flag known from older mongo versions has been deprecated and been replaced by the -nsXXX flags)




