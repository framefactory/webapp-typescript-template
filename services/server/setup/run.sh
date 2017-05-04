#!/usr/bin/env bash
# SERVER ENTRYPOINT

# make sure path for node, npm and module binaries is registered
source ~/.nvm/nvm.sh

# install node module dependencies
cd /app/services/server
npm install

# watch typescript source files and run tsc, then start server
concurrently \
    "./node_modules/.bin/tsc --watch -p ./tsconfig-server.json" \
    "nodemon --watch bin bin/index.js"
