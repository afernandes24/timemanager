const express = require("express");
const { getHabits, addHabit, updateHabit, logHabit, deleteHabit } = require("../controllers/habitController");
const validateId = require("./validateId");

const router = express.Router();
router.param("id", validateId);

router.get("/", getHabits);
router.post("/", addHabit);
router.put("/:id", updateHabit);
router.post("/:id/log", logHabit);
router.delete("/:id", deleteHabit);

module.exports = router;
