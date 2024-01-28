const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3500; // Set your desired port number

mongoose
  .connect(
    "mongodb+srv://vinay:somethingforcloud@cloud-project.pwk1tsn.mongodb.net/greenhouse"
  )
  .then(() => console.log("connected to database"))
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

  const actuatorSchema = new mongoose.Schema({
    motor1: {type:Boolean, default:false},
    motor2: {type:Boolean, default:false},
    light1: {type:Boolean, default:false},
    light2: {type:Boolean, default:false},
    timestamp : { type: Date, default: Date.now }
  })

  const Actuators = mongoose.model("actuator", actuatorSchema);

app.use(cors());
app.use(bodyParser.json());

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

// app.get("/temp", async (req, res) => {

//   const actuatorValue = new Actuators({
//     light1:false,
//     motor1:false,
//   })
//   const response = await actuatorValue.save();
//   console.log(response);
//   res.send({message:"done"});
// });

// Handle requests from frontend to control lights

app.get("/control-lights", async (req, res) => {
  const lightsStatus = req.query.status;
  console.log(`Received lights status update: ${lightsStatus}`);
  
  try {
    if (lightsStatus === '0') {
      await Actuators.updateOne({}, { $set: { light1: false } });
      res.send({ message: "Lights switched off", key: 0 });
    } else if (lightsStatus === '1') {
      await Actuators.updateOne({}, { $set: { light1: true } });
      res.send({ message: "Lights switched on", key: 1 });
    } else {
      res.status(400).send({ message: "Invalid lights status" });
    }
  } catch (error) {
    console.error("Error updating lights status:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});


app.get("/control-motor", async (req, res) => {
  const motorStatus = req.query.status;
  console.log(`Received motor status update: ${motorStatus}`);
   
  try {
    if (motorStatus == '0') {
      await Actuators.updateOne({}, { $set: { motor1: false } });
      res.send({ message: "Motor switched off", key: 0 });
    } else if (motorStatus == '1') {
      await Actuators.updateOne({}, { $set: { motor1: true } });
      res.send({ message: "Motor switched on", key: 1 });
    } else {
      res.status(400).send({ message: "Invalid motor status" });
    }
  } catch (error) {
    console.error("Error updating motor status:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});


app.get('/farmhouse-controller', async(req, res) => {
     const response = await Actuators.findOne({});
     console.log("light value is ", response.motor1);
     const key = JSON.stringify(response.light1);
     res.json({key});
})

app.get('/notifications', async (req, res) => {
  try {
    const response = await SunlightData.find().sort({ timestamp: -1 }).limit(5);

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
