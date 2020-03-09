#!/bin/sh
now=$(date +"%y-%m-%d")
ssh mvifian@v22015123209630421.goodsrv.de "docker exec mongodb mongodump -d Rechords --archive --gzip" > "backups/$now.gz"
