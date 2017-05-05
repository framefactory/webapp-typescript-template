#!/usr/bin/env bash
# SERVER ENTRYPOINT

# make sure path for node, npm and module binaries is registered
source ~/.nvm/nvm.sh

# install node module dependencies
cd /app
npm install

# start server in debug mode, watching source code changes
npm run server-dev
