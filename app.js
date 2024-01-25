const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3500; // Set your desired port number

mongoose
  .connect(
    "mongodb+srv://Vinay:4556%40Devaraj@cluster0.tpgkfpg.mongodb.net/greenhouse"
  )
  .then(() => console.log("connected to databse"))
  .catch((error) => console.log(error));

  const sensorDataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    soil_moisture: Number,
    timestamp: { type: Date, default: Date.now }
  });
  
  // Create a model based on the schema
  const SensorData = mongoose.model("SensorData", sensorDataSchema);

  const predictionSchema = new mongoose.Schema({
    predicted_sunlight_reduction: Number,
    timestamp : { type: Date, default: Date.now }
  })

  const SunlightData = mongoose.model("SunlightData", predictionSchema);

app.use(cors());
app.use(bodyParser.json());
let lights = 0;
let motot = 0;

app.get("/sensor-values", async (req, res) => {
  const { temperature, humidity, soilmoisture } = req.query;

  // Create a new sensor data document
  const newSensorData = new SensorData({
    temperature: parseFloat(temperature),
    humidity: parseFloat(humidity),
    soil_moisture: parseFloat(soilmoisture),
  });

  try {
    // Save the sensor data document to the database
    await newSensorData.save();

    // Respond to the ESP32 with a success message
    res.status(200).json({ message: "Sensor values stored successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/get-sensor-values', async (req, res) => {
  try {
    // Get the latest data from the MongoDB database
    const latestData = await SensorData.findOne({}, { _id: 0, temperature: 1, humidity: 1 });

    // Ensure that the required fields are present
    if (!latestData || !('temperature' in latestData) || !('humidity' in latestData)) {
      return res.status(404).json({ error: 'Temperature and humidity data not found in the database.' });
    }

    // Extract the latest temperature and humidity values
    const latestTemperature = latestData.temperature;
    const latestHumidity = latestData.humidity;

    // Send the temperature and humidity values to the frontend
    res.status(200).json({ temperature: latestTemperature, humidity: latestHumidity });
  } catch (error) {
    console.error('Error fetching sensor values:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    if (lights == 1) res.json({ key: true });
    else res.json({ key: false });
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

app.get('/notifications', async (req, res) => {
  try {
    const response = await SunlightData.find().sort({ timestamp: -1 }).limit(10);

      if (response) {
          console.log("response is", response);
          res.status(200).json({ message: "data fetched successfully", response });
      } else {
          res.status(404).json({ message: "No data found" });
      }
  } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ message: "Internal server error" });
  }
});


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
