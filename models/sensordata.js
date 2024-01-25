const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    soilmoisture: Number,
    timestamp: { type: Date, default: Date.now }
  });
  
  // Create a model based on the schema
  const SensorData = mongoose.model("SensorData", sensorDataSchema);