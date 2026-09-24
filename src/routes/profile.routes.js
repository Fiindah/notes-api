const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/profile.controller");

const router = express.Router();

router.use(requireAuth);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/password", changePassword);
router.delete("/", deleteAccount);

module.exports = router;
