Configured on Github
====================

Global Config
-----
- `SSH_USER` githubactor
  - must be allowed to `sudo` without password
- `SSH_HOST` v22015123209630421.goodsrv.de

Secrets
-------
- `SSH_KEY` Generated using `ssh-keygen`
  - add to the SSH_USER's `authorized_keys` on SSH_HOST
- `KNOWN_HOSTS` Generated using `ssh-keyscan -H $SSH_HOST`


Prod Env Config
---------------
- `DOMAIN` hoelibu.ch
- `PROXY_PORT` 3000
