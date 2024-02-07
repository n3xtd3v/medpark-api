const ldap = require("ldapjs");

function getADUser(username) {
  const client = ldap.createClient({
    url: process.env.LDAP_URL,
    idleTimeout: 1000,
    tlsOptions: {
      rejectUnauthorized: false,
    },
  });
  client.on("error", function (err) {
    console.warn("LDAP connection failed", err);
  });

  var adUser = null;
  const opts = {
    filter: `(&(objectClass=user)(samAccountName=${username}))`,
    scope: "sub",
  };

  const searchUser = new Promise((resolve, reject) => {
    client.bind(process.env.LDAP_USER, process.env.LDAP_PASSWORD, (err) => {
      if (err) {
        console.error("Unable to start a service due to invalid service users");
        reject();
      }

      client.search(`${process.env.LDAP_BASE_DN}`, opts, (err, res) => {
        if (err) {
          console.log(err);
          reject();
        }

        res.on("searchEntry", function (entry) {
          const { attributes } = entry.pojo;

          const distinguishedName = attributes.filter(
            (attribute) => attribute.type === "distinguishedName"
          );

          const sAMAccountName = attributes.filter(
            (attribute) => attribute.type === "sAMAccountName"
          );

          const displayName = attributes.filter(
            (attribute) => attribute.type === "displayName"
          );

          const department = attributes.filter(
            (attribute) => attribute.type === "department"
          );

          const title = attributes.filter(
            (attribute) => attribute.type === "title"
          );

          const mail = attributes.filter(
            (attribute) => attribute.type === "mail"
          );

          adUser = {
            distinguishedName: distinguishedName[0]?.values[0],
            sAMAccountName: sAMAccountName[0]?.values[0],
            displayName: displayName[0]?.values[0],
            department: department[0]?.values[0],
            title: title[0]?.values[0],
            mail: mail[0]?.values[0],
          };
        });

        res.on("error", (err) => {
          client.destroy();
          reject();
        });
        res.on("end", () => {
          client.destroy();
          resolve(adUser);
        });
      });
    });
  });

  return searchUser;
}

const authenticate = async (username, password) => {
  const client = ldap.createClient({
    url: process.env.LDAP_URL,
    tlsOptions: {
      rejectUnauthorized: false,
    },
  });
  client.on("error", function (err) {
    console.warn("LDAP connection failed", err);
  });

  const adUser = await getADUser(username);
  if (!adUser) {
    return null;
  }

  const checkUser = new Promise((resolve, reject) => {
    client.bind(
      process.env.LDAP_USER,
      process.env.LDAP_PASSWORD,
      (err, res) => {
        if (err) {
          console.err("Unable to start a service due to invalid service users");
          client.destroy();
          reject();
        }

        const c = ldap.createClient({
          url: process.env.LDAP_URL,
          tlsOptions: {
            rejectUnauthorized: false,
          },
        });

        client.on("error", function (err) {
          console.warn("LDAP connection failed", err);
        });

        c.bind(adUser.distinguishedName, password, (err) => {
          if (err) {
            client.destroy();
            resolve(null);
          }
          client.destroy();
          resolve(adUser);
        });
      }
    );
  });

  return await checkUser;
};

module.exports = authenticate;
