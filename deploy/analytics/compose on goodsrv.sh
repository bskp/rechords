#!/bin/sh

rsync --verbose --recursive --delete --exclude='*.sh' . maroggo@v22015123209630421.goodsrv.de:/home/maroggo/matomo
ssh maroggo@v22015123209630421.goodsrv.de '
cd /home/maroggo/matomo/
docker-compose up -d
'

# docker context create remote ‐‐docker "ssh://maroggo@v22015123209630421.goodsrv.de"
# docker-compose --context remote ps