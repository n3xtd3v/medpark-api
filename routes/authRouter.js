const express = require("express");
const authCtrl = require("../controllers/authCtrl");

const router = express.Router();

router.post("/signin-ldap", authCtrl.signInLDAP);

router.post("/signout-ldap", authCtrl.signOutLDAP);

router.post("/refresh_token", authCtrl.generateAccessToken);

module.exports = router;
