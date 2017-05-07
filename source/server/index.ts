import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";

import * as express from "express";
import * as session from "express-session";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import * as handlebars from "express-handlebars";
import * as flash from "flash";

import * as morgan from "morgan";
import * as reload from "reload";
import * as watch from "watch";
import * as cmd from "node-cmd";

import { Database } from "arangojs";

import users from "./collections/users";

import authenticationRouting from "./routers/auth";
import mainRouter from "./routers/main";

////////////////////////////////////////////////////////////////////////////////

let devMode: boolean = process.env.NODE_ENV !== "production";

let app = express();
app.set("port", 8000);
app.set("securePort", 8001);

////////////////////////////////////////////////////////////////////////////////
// SECURE SERVER CREDENTIALS

const key = fs.readFileSync(path.resolve(__dirname, "../certs/framelab.io/privkey1.pem"));
const cert = fs.readFileSync(path.resolve(__dirname, "../certs/framelab.io/fullchain1.pem"));
const credentials = { key: key, cert: cert };

////////////////////////////////////////////////////////////////////////////////
// TEMPLATE ENGINE

const viewsDir = path.resolve(__dirname, "../views");

const handlebarsConfig = {
    extname: ".hbs",
    layoutsDir: viewsDir + "/layouts",
    defaultLayout: "main"
};

app.engine(".hbs", handlebars(handlebarsConfig));
app.set("view engine", ".hbs");
app.set("views", viewsDir);

let templateDir = path.resolve(__dirname, "../views");
let staticDir = path.resolve(__dirname, "../static");
let clientSourceDir = path.resolve(__dirname, "../../../source/client");

////////////////////////////////////////////////////////////////////////////////
// DATABASE

let arangoHost = process.env.ARANGO_HOST;
let arangoPort = process.env.ARANGO_PORT;
let arangoPassword = process.env.ARANGO_ROOT_PASSWORD;
let arangoDatabaseName = process.env.ARANGO_DATABASE_NAME;

let db = new Database({ url: `http://root:${arangoPassword}@${arangoHost}:${arangoPort}` });

(async (db) => {
    try {
        let names = await db.listUserDatabases();
        if (names.indexOf(arangoDatabaseName) < 0) {
            await db.createDatabase(arangoDatabaseName);
        }
        else {
            db.useDatabase(arangoDatabaseName);
            users.initialize(db);
        }
    } catch(err) {
        console.log(err.stack);
    }
})(db);

////////////////////////////////////////////////////////////////////////////////
// SERVER ROUTING

// logging middleware
if (devMode) {
    app.use(morgan("tiny"));
}

// parse json and urlencoded request bodies into req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// session handling
app.use(session({
    secret: "EZmhDif4Tc+ASesIBySeCQ",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 3600000 // one week
    }
}));

app.use(flash());

// public pages
app.get("/", (req, res) => res.render("pages/index"));
app.get("/login", (req, res) => res.render("pages/login"));

// serve static files
app.use("/static", express.static(staticDir));

// install routers
app.use(authenticationRouting);
app.use("/main", mainRouter);


// gzip/deflate outgoing responses
if (!devMode) {
    app.use(compression());
}

////////////////////////////////////////////////////////////////////////////////
// START SERVERS

let server = http.createServer(app);
server.listen(app.get("port"), () => {
    console.info(`Server listening on port ${app.get("port")}`);
});

let secureServer = https.createServer(credentials, app);
secureServer.listen(app.get("securePort"), () => {
    console.info(`Secure server, listening on port ${app.get("securePort")}`);
});

////////////////////////////////////////////////////////////////////////////////
// AUTOMATIC COMPILATION AND PAGE RELOAD

if (devMode) {
    let reloadServer = reload(server, app);

    // watch client source code
    watch.watchTree(clientSourceDir, () => {
        let process = cmd.get(`cd ${clientSourceDir} && webpack`, (info) => {
            console.log(info || "Watching client-side source code - no changes detected");
            reloadServer.reload();
        });

        process.stderr.on('data', function(data) {
            console.error(data);
        });
    });

    // watch templates and static files
    watch.watchTree(templateDir, () => {
        reloadServer.reload();
    });

    watch.watchTree(staticDir, () => {
        reloadServer.reload();
    });
}

