const { Router } = require("express");
const ctrl = require("../controllers/syncController");

const router = Router();

router.post("/tasks/:userId", ctrl.postTasks);
module.exports = router;
