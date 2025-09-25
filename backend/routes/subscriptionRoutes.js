const express = require("express");
const router = express.Router();
const { createSubscription } = require("../controllers/subscriptionController");

router.post("/subscribe", createSubscription);

module.exports = router;
