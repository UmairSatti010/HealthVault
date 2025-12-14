const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  addRecord,
  getRecords,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");

router.post("/", protect, addRecord);
router.get("/", protect, getRecords);
router.put("/:id", protect, updateRecord);
router.delete("/:id", protect, deleteRecord);

module.exports = router;
