import * as express from "express";
let router = express.Router();

router.post("/facebook", (req, res) => {
    res.redirect("/main");
});

router.post("/local", (req, res) => {
    res.redirect("/main");
});

export default router;