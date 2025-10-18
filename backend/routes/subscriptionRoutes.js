const express = require("express");
const router = express.Router();
const { createSubscription, unsubscribe } = require("../controllers/subscriptionController");

router.post("/subscribe", createSubscription);
router.post("/unsubscribe", unsubscribe);

module.exports = router;
