#!/bin/bash
now=$(date +"%y-%m-%d")
mongodump --host localhost --port 3001 --archive > "backups/$now.gz"
