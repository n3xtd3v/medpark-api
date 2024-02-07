const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./lib/connectDB");
const mssql = require("mssql");
const multer = require("multer");
const auth = require("./middleware/auth");
require("dotenv").config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../clock-in/public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use("/api/upload", auth, upload.single("photo"), (req, res) => {
  try {
    res.json({
      pathname: `/uploads/${req.file?.filename}`,
    });
  } catch (error) {
    return next(error);
  }
});

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
