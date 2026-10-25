const express = require("express");
const {
  getTimeBlocks,
  addTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
} = require("../controllers/timeBlockController");
const validateId = require("./validateId");

const router = express.Router();
router.param("id", validateId);

router.get("/", getTimeBlocks);
router.post("/", addTimeBlock);
router.put("/:id", updateTimeBlock);
router.delete("/:id", deleteTimeBlock);

module.exports = router;
