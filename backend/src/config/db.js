const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DBNAME || undefined,
  });

  console.log("✅ MongoDB connected:", mongoose.connection.name);
}

module.exports = { connectDB };