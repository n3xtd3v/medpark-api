const jwt = require("jsonwebtoken");

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "10h",
  });
};

const resStatusMsg = (res, status, msg) => {
  return res.status(status).json(msg);
};

module.exports = {
  resStatusMsg,
  createAccessToken,
  createRefreshToken,
};
