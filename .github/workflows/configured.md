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
- `JUBLADB_CLIENT_SECRET` (per environment) OAuth client secret from the Jubla-DB


Prod Env Config
---------------
- `DOMAIN` hoelibu.ch
- `PROXY_PORT` 3000

Dev Env Config
---------------
- `DOMAIN` testing.hoelibu.ch
- `PROXY_PORT` 3001
- `ROOT_URL` https://testing.xn--hlibu-jua.ch
  - testing.hoelibu.ch redirects there, and the OAuth redirect URI is registered for it
- `JUBLADB_URL` https://jubla.puzzle.ch (integration instance)
- `JUBLADB_CLIENT_ID` from the OAuth application `testing.hölibu.ch` in the Jubla-DB
  - redirect URI: https://testing.xn--hlibu-jua.ch/_oauth/jubladb
  - scopes: `email`, `name`

The Jubla-DB login is off in any environment without `JUBLADB_CLIENT_ID`.
