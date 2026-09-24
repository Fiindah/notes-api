const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} = require("../controllers/notes.controller");

const router = express.Router();

router.use(requireAuth);
router.get("/", listNotes);
router.post("/", createNote);
router.get("/:id", getNote);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);

module.exports = router;
