const mssql = require("mssql");
const { resStatusMsg } = require("../lib/utils");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token)
      return resStatusMsg(res, 400, { msg: "Invalid Authentication" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded)
      return resStatusMsg(res, 400, { msg: "Invalid Authentication" });

    const user = await mssql.query`
      SELECT id, role
      FROM users
      WHERE id = ${decoded.id}
    `;

    req.user = user.recordset[0];

    next();
  } catch (error) {
    return resStatusMsg(res, 500, { msg: error.message });
  }
};

module.exports = auth;
