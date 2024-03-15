const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./lib/connectDB");
const mssql = require("mssql");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use("/api/auth/", require("./routes/authRouter"));
app.use("/api/clock-in/", require("./routes/clockIn/timestampRouter"));

(async () => {
  try {
    await mssql.connect(connectDB);
    console.log("Connected to database mssql.");
  } catch (err) {
    console.log(err.message);
  }
})();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on ${port}.`);
});
