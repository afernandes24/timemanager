const express = require("express");
const {
  getFocusSessions,
  getPomodoroSettings,
  addFocusSession,
  deleteFocusSession,
} = require("../controllers/focusSessionController");
const validateId = require("./validateId");

const router = express.Router();
router.param("id", validateId);

router.get("/", getFocusSessions);
router.get("/settings", getPomodoroSettings);
router.post("/", addFocusSession);
router.delete("/:id", deleteFocusSession);

module.exports = router;
