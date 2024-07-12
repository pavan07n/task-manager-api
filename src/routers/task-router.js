const express = require("express");
const Task = require("../models/task.js");
const auth = require("../middleware/auth.js");
const router = new express.Router();

// Task Endpoint for creating task
router.post("/tasks/create", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Task endpoint for finding/reading all tasks
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user.populate({
      //using populate as opposed to find()
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit), // limits the number of results per page
        skip: parseInt(req.query.skip), // skips the number of results and shows next num of results
        sort,
      },
    });
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});

//Task endpoint for finding/reading a specific tasks
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    // const task = await Task.findById(_id)
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

//Task endpointing for updating a task
router.patch("/tasks/:id", auth, async (req, res) => {
  const taskUpdates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidUpdate = taskUpdates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invalid Update(s)" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    taskUpdates.forEach((update) => (task[update] = req.body[update]));
    task.save();
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Task endpoint for deleting a task
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
