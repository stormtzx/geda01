var mysql = require("mysql");

const express = require("express");
const app = express();
var path = require("path");
const fs = require("fs");
var session = require("express-session");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
const port = 3000;
const bodyParser = require("body-parser");
var nodemailer = require("nodemailer");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("."));
app.use(express.static(path.join(__dirname, "views")));
app.listen(3000, function () {
  console.log("Example app listening on port 3000!");
});

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "unipa",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connesso");
  con.query("CREATE DATABASE IF NOT EXISTS gestioneAffitti", function (
    err,
    result
  ) {
    if (err) throw err;
    console.log("Database GESTIONE AFFITTI creato");
  });
});
const tables = require("./tables");
tables.crea_tableUtenteCliente();
tables.crea_tableUtenteProprietario();
tables.crea_tableCasa();
tables.crea_tablePrenotazione();
tables.crea_tableData();
tables.crea_tableRencensione();
tables.crea_tableFoto();

app.use(
  session({
    secret: "El segreto",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);
const action = require("./action")(app);
const action2 = require("./action2")(app);
const action3 = require("./action3")(app);
const action4 = require("./action4")(app);
const action5 = require("./action5")(app);
