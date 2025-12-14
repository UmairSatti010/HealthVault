// controllers/recordController.js
const Record = require("../models/Record");
const path = require("path");
const fs = require("fs");

// helper → build public URL saved in DB
const buildPublicPath = (folder, filename) =>
  `/uploads/${folder}/${filename}`;

// helper → delete file safely
const deleteFileIfExists = (publicPath) => {
  if (!publicPath) return;
  const fullPath = path.join(__dirname, "..", publicPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.warn("Failed to delete file:", fullPath, err.message);
    }
  }
};

/**
 * CREATE RECORD
 */
exports.createRecord = async (req, res) => {
  try {
    const userId = req.user.id; // IMPORTANT: use req.user.id
    const { title, medicalHistory, doctorNotes, vitals } = req.body;

    const record = new Record({
      user: userId,
      title,
      medicalHistory,
      doctorNotes,
      vitals: vitals ? JSON.parse(vitals) : {},
      files: {},
    });

    // handle uploaded files
    if (req.files?.labReport?.[0]) {
      record.files.labReport = buildPublicPath(
        "records",
        req.files.labReport[0].filename
      );
    }

    if (req.files?.prescription?.[0]) {
      record.files.prescription = buildPublicPath(
        "records",
        req.files.prescription[0].filename
      );
    }

    await record.save();
    res.status(201).json(record);
  } catch (err) {
    console.error("createRecord error:", err);
    res.status(500).json({ message: "Create record failed" });
  }
};

/**
 * GET RECORDS
 */
exports.getRecords = async (req, res) => {
  try {
    const records = await Record.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(records);
  } catch (err) {
    console.error("getRecords error:", err);
    res.status(500).json({ message: "Fetch records failed" });
  }
};

/**
 * UPDATE RECORD (EDIT)
 */
exports.updateRecord = async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record)
      return res.status(404).json({ message: "Record not found" });

    // ownership check (FIXED)
    if (record.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // update fields if provided
    if (req.body.title !== undefined) record.title = req.body.title;
    if (req.body.medicalHistory !== undefined)
      record.medicalHistory = req.body.medicalHistory;
    if (req.body.doctorNotes !== undefined)
      record.doctorNotes = req.body.doctorNotes;

    if (req.body.vitals) {
      record.vitals = JSON.parse(req.body.vitals);
    }

    // replace lab report
    if (req.files?.labReport?.[0]) {
      deleteFileIfExists(record.files.labReport);
      record.files.labReport = buildPublicPath(
        "records",
        req.files.labReport[0].filename
      );
    }

    // replace prescription
    if (req.files?.prescription?.[0]) {
      deleteFileIfExists(record.files.prescription);
      record.files.prescription = buildPublicPath(
        "records",
        req.files.prescription[0].filename
      );
    }

    const updated = await record.save(); // updates updatedAt automatically
    res.json(updated);
  } catch (err) {
    console.error("updateRecord error:", err);
    res.status(500).json({ message: "Update record failed" });
  }
};

/**
 * DELETE RECORD
 */
exports.deleteRecord = async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record)
      return res.status(404).json({ message: "Record not found" });

    if (record.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // delete associated files
    deleteFileIfExists(record.files.labReport);
    deleteFileIfExists(record.files.prescription);

    await record.deleteOne(); // FIXED (remove deprecated .remove)
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("deleteRecord error:", err);
    res.status(500).json({ message: "Delete record failed" });
  }
};
