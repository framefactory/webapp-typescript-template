import * as path from 'path';
import * as express from "express";
import * as http from "http";
import * as compression from "compression";
import * as cookieSession from "cookie-session";
import * as bodyParser from "body-parser";
import * as reload from "reload";
import * as watch from "watch";
import * as cmd from "node-cmd";

let app = express(); //ta
app.set("port", 8000);

// gzip/deflate outgoing responses
app.use(compression());

// store session state in browser cookie
app.use(cookieSession({
    keys: ['secret1', 'secret2']
}));

// parse urlencoded request bodies into req.body
app.use(bodyParser.urlencoded({extended: false}));

// serve static files
app.use("/", express.static(path.resolve(__dirname, "../static")));
app.use("/", express.static(path.resolve(__dirname, "../dist")));

let server = http.createServer(app);


let reloadServer = reload(server, app);

let clientSourceDir = path.resolve(__dirname, "../../../source/client");
watch.watchTree(clientSourceDir, () => {
    let process = cmd.get(`cd ${clientSourceDir} && webpack`, (info) => {
        console.log(info);
        reloadServer.reload();
    });

    process.stderr.on('data', function(data) {
        console.error(data);
    });
});

server.listen(app.get("port"), () => {
    console.info(`Server listening on port ${app.get("port")}`);
});