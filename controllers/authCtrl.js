const mssql = require("mssql");
const authenticate = require("../lib/authenticationLDAP");
const {
  resStatusMsg,
  createRefreshToken,
  createAccessToken,
} = require("../lib/utils");
const jwt = require("jsonwebtoken");

const authCtrl = {
  signInLDAP: async (req, res) => {
    try {
      const { username, password } = req.body;

      const newUserName = username.toLowerCase().replace(/ /g, "");
      if (!newUserName) {
        return resStatusMsg(res, 400, { message: "Please add your username!" });
      }

      if (!password) {
        return resStatusMsg(res, 400, { message: "Please add your password!" });
      }

      const LDAPUser = await authenticate(username, password);
      if (LDAPUser === null) {
        return resStatusMsg(res, 400, {
          message: "Username or password incorrect!",
        });
      }

      const { distinguishedName, ...userAD } = LDAPUser;

      const userNo = await mssql.query`
        SELECT dbo.fMP_get_employee_nr_by_user_ad(${userAD.sAMAccountName}) userNo
      `;

      console.log(userNo.recordsets[0][0].userNo);

      if (!userNo.recordsets[0][0].userNo) {
        return resStatusMsg(res, 400, {
          message: "user number does not exist!",
        });
      }

      const checkUser =
        await mssql.query`SELECT COUNT(*) AS count FROM users WHERE username = ${userAD.sAMAccountName}`;

      if (checkUser.recordset[0].count === 0) {
        await mssql.query`
            INSERT INTO users (no, username, displayName, department, title, mail, createdAt)
            VALUES (${userNo.recordsets[0][0].userNo}, ${userAD.sAMAccountName}, ${userAD.displayName}, ${userAD.department}, ${userAD.title}, ${userAD.mail}, GETDATE())
          `;
      } else if (checkUser.recordset[0].count === 1) {
        await mssql.query`
            UPDATE users
            SET no = ${userNo.recordsets[0][0].userNo}, username = ${userAD.sAMAccountName}, displayName = ${userAD.displayName}, department = ${userAD.department}, title = ${userAD.title}, mail = ${userAD.mail}, createdAt = GETDATE()
            WHERE username = ${userAD.sAMAccountName}
          `;
      }

      const user =
        await mssql.query`SELECT * FROM users WHERE username = ${userAD.sAMAccountName}`;

      const access_token = createAccessToken({ id: user.recordset[0].id });
      const refresh_token = createRefreshToken({ id: user.recordset[0].id });

      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/api/auth/refresh_token",
        maxAge: 10 * 60 * 60 * 1000,
      });

      resStatusMsg(res, 200, {
        status: "ok",
        message: "Signin success.",
        access_token,
        user: {
          id: user.recordset[0].id,
          username: user.recordset[0].username,
          displayName: user.recordset[0].displayName,
          department: user.recordset[0].department,
          title: user.recordset[0].title,
          mail: user.recordset[0].mail,
          role: user.recordset[0].role,
        },
      });
    } catch (error) {
      return resStatusMsg(res, 500, { message: error.message });
    }
  },

  signOutLDAP: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/api/auth/refresh_token" });

      resStatusMsg(res, 200, {
        status: "ok",
        message: "Signed out.",
      });
    } catch (error) {
      return resStatusMsg(res, 500, { message: error.message });
    }
  },

  generateAccessToken: async (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token)
        return resStatusMsg(res, 400, { message: "Please signin now!" });

      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err)
            return resStatusMsg(res, 400, { message: "Please signin now!" });

          const user =
            await mssql.query`SELECT * FROM users WHERE id = ${result.id}`;
          if (!user)
            return resStatusMsg(res, 400, { message: "This does not exist!" });

          const access_token = createAccessToken({ id: result.id });

          resStatusMsg(res, 200, {
            status: "ok",
            message: "Generate access token success.",
            access_token,
            user: {
              id: user.recordset[0].id,
              username: user.recordset[0].username,
              displayName: user.recordset[0].displayName,
              department: user.recordset[0].department,
              title: user.recordset[0].title,
              mail: user.recordset[0].mail,
              role: user.recordset[0].role,
            },
          });
        }
      );
    } catch (error) {
      return resStatusMsg(res, 500, { message: error.message });
    }
  },
};

module.exports = authCtrl;
