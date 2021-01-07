#!/bin/sh
now=$(date +"%y-%m-%d")
user=$(whoami)
if [[ $user -eq "matthiasroggo" ]] 
then 
    user="maroggo"
fi
ssh $user@v22015123209630421.goodsrv.de "docker exec mongodb mongodump -d Rechords --archive --gzip" > "backups/$now.gz"
