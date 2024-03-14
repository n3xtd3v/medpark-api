const mssql = require("mssql");
const { resStatusMsg } = require("../../lib/utils");

const timestampCtrl = {
  getTimestamps: async (req, res) => {
    try {
      const timestamps = await mssql.query`SELECT * FROM timestamps`;

      resStatusMsg(res, 200, {
        status: "ok",
        message: "Get timestamps success.",
        timestamps: timestamps.recordset,
      });
    } catch (error) {
      return resStatusMsg(res, 500, { message: error.message });
    }
  },

  getTimestampsById: async (req, res) => {
    try {
      const { id } = req.user;

      const timestamp = await mssql.query`
        SELECT TOP 5 timestamps.id, timestampType, imageURL, timestamps.createdAt, userId, displayName
        FROM timestamps
        LEFT JOIN users
        ON timestamps.userId = users.id
        WHERE timestamps.userId = ${id}
        ORDER BY timestamps.createdAt DESC
      `;

      resStatusMsg(res, 200, {
        status: "ok",
        message: "Get timestamps success.",
        timestamps: timestamp.recordset,
      });
    } catch (error) {
      return resStatusMsg(res, 500, { message: error.message });
    }
  },

  postTimestamp: async (req, res) => {
    try {
      const { id, timestampType, imageURL } = req.body;

      await mssql.query`
        INSERT INTO timestamps (timestampType, imageURL,createdAt, userId)
        VALUES (${timestampType}, ${imageURL}, GETDATE(), ${id})
      `;

      const timestamps = await mssql.query`
        SELECT TOP 1 timestamps.createdAt, timestamps.id, timestamps.timestampType, timestamps.imageURL, users.displayName
        FROM timestamps
        LEFT JOIN users
        ON timestamps.userId = users.id
        WHERE userId = ${id}
        ORDER BY createdAt DESC
      `;

      resStatusMsg(res, 200, {
        status: "ok",
        message: "Timestamp success.",
        timestamps: timestamps.recordset,
      });
    } catch (error) {
      return resStatusMsg(res, 500, { message: error.message });
    }
  },
};

module.exports = timestampCtrl;
