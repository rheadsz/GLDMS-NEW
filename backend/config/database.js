require("dotenv").config();

module.exports = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mariadb",   // important
  logging: false,       // optional (true if you want SQL logs)
};