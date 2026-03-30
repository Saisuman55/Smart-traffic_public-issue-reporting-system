import express from "express";
import Issue from "../models/Issue.js";

const router = express.Router();

// GET all issues (with optional filters)
router.get("/", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.reporterUid) filter.reporterUid = req.query.reporterUid;
    const issues = await Issue.find(filter).sort({ createdAt: -1 });
    res.json(issues);
  } catch {
    res.status(500).json({ msg: "Error fetching issues" });
  }
});

// GET single issue by id
router.get("/:id", async (req, res) => {
  try {
    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) return res.status(404).json({ msg: "Issue not found" });
    res.json(issue);
  } catch {
    res.status(500).json({ msg: "Error fetching issue" });
  }
});

// POST create issue
router.post("/", async (req, res) => {
  try {
    const issue = await Issue.create(req.body);
    res.json(issue);
  } catch (err) {
    res.status(500).json({ msg: "Error creating issue" });
  }
});

// PATCH update issue
router.patch("/:id", async (req, res) => {
  try {
    const issue = await Issue.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!issue) return res.status(404).json({ msg: "Issue not found" });
    res.json(issue);
  } catch {
    res.status(500).json({ msg: "Error updating issue" });
  }
});

// DELETE issue
router.delete("/:id", async (req, res) => {
  try {
    await Issue.findOneAndDelete({ id: req.params.id });
    res.json({ msg: "Issue deleted" });
  } catch {
    res.status(500).json({ msg: "Error deleting issue" });
  }
});

// POST upvote
router.post("/:id/upvote", async (req, res) => {
  try {
    const { userId, action } = req.body;
    const update = action === 'add'
      ? { $addToSet: { upvotes: userId } }
      : { $pull: { upvotes: userId } };
    const issue = await Issue.findOneAndUpdate({ id: req.params.id }, update, { new: true });
    res.json(issue);
  } catch {
    res.status(500).json({ msg: "Error upvoting" });
  }
});

// POST add comment
router.post("/:id/comment", async (req, res) => {
  try {
    const issue = await Issue.findOneAndUpdate(
      { id: req.params.id },
      { $push: { comments: req.body }, $set: { updatedAt: new Date().toISOString() } },
      { new: true }
    );
    res.json(issue);
  } catch {
    res.status(500).json({ msg: "Error adding comment" });
  }
});

export default router;
