const express = require("express");
const timestampCtrl = require("../../controllers/clockIn/timestampCtrl.js");
const auth = require("../../middleware/auth.js");

const router = express.Router();

router.get("/timestamps", auth, timestampCtrl.getTimestamps);

router.get("/timestamps/:id", auth, timestampCtrl.getTimestampsById);

router.post("/timestamp", auth, timestampCtrl.postTimestamp);

module.exports = router;
