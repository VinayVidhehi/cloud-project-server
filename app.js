const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3500; // Set your desired port number

app.use(cors());
app.use(bodyParser.json());
let lights = 0;
let motot = 0;

app.get("/temp", (req, res) => {
  const { key } = req.query;
  if (key == 1) {
    console.log("valuesfrom esp32");
    res.send({ message: "received temp", key: 1 });
  } else {
    console.log("req from farmer");
    res.send({ temperature: 25 });
  }
});

// Handle requests from frontend to control lights
app.get("/control-lights", (req, res) => {
  
  const lightsStatus = req.query.key;
  console.log(`Received lights status update: ${lightsStatus}`);
  if (lightsStatus == 0) {
    lights = 0;
    res.send({ message: "lights switched off", key: 0 });
  } else if (lightsStatus == 1) {
    lights = 1;
    res.send({ message: "lights switched off", key: 1 });
  } else if (lightsStatus == 2) {
    if (lights == 1) res.send({ key: true });
    else res.send({ key: false });
  }
});

app.get("/control-motor", (req, res) => {
  const motorStatus = req.query.key;
  console.log(`Received lights status update: ${motorStatus}`);

  if (motorStatus == 0) {
    motor = 0;
    res.send({ message: "lights switched off", key: 0 });
  } else if (motorStatus == 1) {
    motor = 1;
    res.send({ message: "lights switched off", key: 1 });
  } else if (motorStatus == 2) {
    if (motor == 1) res.send({ key: true });
    else res.send({ key: false });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
