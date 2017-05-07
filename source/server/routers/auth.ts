import * as express from "express";
import * as passport from "passport";
import * as passportLocal from "passport-local";
import * as passportFacebook from "passport-facebook";

import users from "../collections/users";

////////////////////////////////////////////////////////////////////////////////
// PASSPORT LOCAL STRATEGY

let LocalStrategy = passportLocal.Strategy;

passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
}, (email, password, done) => {
    users.findOne({ email: email }).then(user => {
        return users.isValidPassword(user, password).then(isValid => {
            if (isValid) {
                return done(null, user);
            }
            else {
                return done(null, false, { message: "Incorrect password." });
            }
        });
    }).catch(() => {
        return done(null, false, { message: "Incorrect email." });
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    users.findById(id).then((user) => {
        done(null, user);
    }).catch(err => {
        done(err, null);
    })
});

////////////////////////////////////////////////////////////////////////////////
// PASSPORT FACEBOOK STRATEGY

let FacebookStrategy = passportFacebook.Strategy;
/*
passport.use(new FacebookStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: "https://framelab.io/auth/facebook/callback"
    }, (accessToken, refreshToken, profile, done) => {
        console.log("FACEBOOK USER PROFILE", profile);
        users.findOne({ name: profile.name }).then((user) => {
            return done(null, user);
        }).catch(err => {
            let user = {
                email: <string>email,
                credentials: { local: { password: hash } }
            };
            return done(err, null);
        });
    }
));
*/

////////////////////////////////////////////////////////////////////////////////
// AUTHENTICATION ROUTER

let router = express.Router();

router.use(passport.initialize());
router.use(passport.session());

router.post("/auth/local", (req: any, res, next) => {
    if (req.body.action === "register") {
        let email = req.body.email;
        let password = req.body.password;
        console.log(`register email=${email}, password=${password}`);

        if (!email) {
            req.flash("error", "Missing email.");
            return res.redirect("/login");
        }
        if (!password) {
            req.flash("error", "Missing password.");
            return res.redirect("/login");
        }

        return users.hashPassword(password).then(hash => {
            let user = {
                email: <string>email,
                credentials: { local: { password: hash } }
            };

            users.create(user).then(() => {
                res.redirect("/main");
            });
        }).catch(err => {
            req.flash("error", err);
            return res.redirect("/login");
        });
    }

    next();
});

router.post("/auth/local", passport.authenticate("local", {
    successRedirect: "/main",
    failureRedirect: "/login",
    failureFlash: true
}));

router.post("/auth/facebook", passport.authenticate("facebook"));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: "/main",
    failureRedirect: "/login",
    failureFlash: true
}));

router.use((req: any, res, next) => {
    if (req.user) {
        console.log("LOGGED IN: ", req.user);
        return next();
    }

    return res.status(401).send("unauthorized");
})

export default router;