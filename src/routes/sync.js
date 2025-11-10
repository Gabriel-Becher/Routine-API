const { Router } = require("express");
const ctrl = require("../controllers/syncController");

const router = Router();

// Task sync only
router.get("/tasks", ctrl.getTasks);
router.post("/tasks", ctrl.postTasks);
router.post("/tasks/snapshot", ctrl.postTasksSnapshot);

module.exports = router;
