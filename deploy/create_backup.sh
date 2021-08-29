#!/bin/sh
now=$(date +"%y-%m-%d")
user=$1
ssh $user@rezept.ee "docker exec mongodb mongodump -d Rechords --archive --gzip" > "backups/$now.gz"
