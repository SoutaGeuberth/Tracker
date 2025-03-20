const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const dbURI = process.env.MONGO_URI.replace(
  "<db_password>",
  process.env.DB_PASSWORD
);

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar a MongoDB Atlas:", err));

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username });
  newUser.save((err, savedUser) => {
    if (err) return console.error(err);
    res.json({ username: savedUser.username, _id: savedUser._id });
  });
});

app.get("/api/users", (req, res) => {
  User.find({})
    .select("_id username")
    .exec((err, users) => {
      if (err) return console.error(err);
      res.json(users);
    });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  User.findById(_id, (err, user) => {
    if (err) return console.error(err);
    let log = user.log;
    if (from) {
      log = log.filter((exercise) => new Date(exercise.date) >= new Date(from));
    }
    if (to) {
      log = log.filter((exercise) => new Date(exercise.date) <= new Date(to));
    }
    if (limit) {
      log = log.slice(0, limit);
    }
    log = log.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
    }));
    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log,
    });
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  User.findById(_id, (err, user) => {
    if (err) return console.error(err);
    const newExercise = {
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
    };
    user.log.push(newExercise);
    user.save((err, updatedUser) => {
      if (err) return console.error(err);
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        date: new Date(newExercise.date).toDateString(),
        duration: newExercise.duration,
        description: newExercise.description,
      });
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
