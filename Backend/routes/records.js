const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const upload = require("../multer");

const {
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");

// CREATE
router.post(
  "/",
  protect,
  upload.fields([
    { name: "labReport", maxCount: 1 },
    { name: "prescription", maxCount: 1 },
  ]),
  createRecord
);

// GET ALL
router.get("/", protect, getRecords);

// UPDATE
router.put(
  "/:id",
  protect,
  upload.fields([
    { name: "labReport", maxCount: 1 },
    { name: "prescription", maxCount: 1 },
  ]),
  updateRecord
);

// DELETE
router.delete("/:id", protect, deleteRecord);

module.exports = router;
