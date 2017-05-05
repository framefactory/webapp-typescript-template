# webapp-typescript-template

Template for a dockerized web application based on TypeScript, Node.js, TypeScript, React, Webpack. Provides two
services: A Node.js web server and a NoSQL database (ArangoDB).

- Container management using docker-compose
- Automatic browser refresh on client source code changes
- Automatic server reload on server source code changes
- Compiles SCSS to CSS
- Handlebars templates

## Usage

```shell
# Generate docker images, run server and database container
docker-compose up -d

# View container logs
docker-compose logs -f
```

## Structure

```text
services
    server
        bin             transpiled server code
        certs           place TSL certificate/key here
        pages           handlebars templates
        setup           container setup scripts
        static          statically served files
            bundles     transpiled client code
source
    client              client typescript source code
    server              server typescript source code
```    