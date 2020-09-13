var mysql = require("mysql");

const express = require("express");
const app = express();
var path = require("path");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

const bodyParser = require("body-parser");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("."));
app.use(express.static(path.join(__dirname, "views")));

var nodemailer = require("nodemailer");
const { isNullOrUndefined } = require("util");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "unipa",
  database: "gestioneAffitti",
});

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "gedasistemabooking@gmail.com",
    pass: "unipa2020",
  },
});

module.exports = function (app) {
  app.get("/", function (req, res) {
    res.sendFile(
      path.join(
        __dirname,
        "../Sistema_Alberghi/views",
        "SchermataPrincipale.html"
      )
    );
  });

  app.get("/reindirizzamentoAccesso", function (req, res) {
    if (
      (req.session.emailC == undefined || req.session.emailC == "") &&
      (req.session.emailP == undefined || req.session.emailP == "")
    ) {
      res.sendFile(
        path.join(
          __dirname,
          "../Sistema_Alberghi/views",
          "SchermataAccesso.html"
        )
      );
    } else if (
      req.session.emailC != "" &&
      (req.session.emailP == undefined || req.session.emailP == "")
    ) {
      var sql =
        "SELECT nomeC, cognomeC, emailC FROM gestioneAffitti.utenteCliente WHERE emailC = '" +
        req.session.emailC +
        "'";

      con.query(sql, function (err, results) {
        if (err) {
          console.log(err);
        } else if (results.length == 1) {
          console.log("Il Cliente visualizza il suo profilo...");
          console.log(results);
          res.render("SchermataProfiloCliente.html", {
            accessoCliente: results,
          });
        } else {
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "QualcosaStorto.html"
            )
          );
        }
      });
    } else if (
      req.session.emailP != "" &&
      (req.session.emailC == undefined || req.session.emailC == "")
    ) {
      var sql2 =
        "SELECT nomeP, cognomeP, emailP FROM gestioneAffitti.utenteProprietario WHERE emailP = '" +
        req.session.emailP +
        "'";

      con.query(sql2, function (err, results) {
        if (err) {
          console.log(err);
        } else if (results.length == 1) {
          console.log("Il Proprietario visualizza il suo profilo...");
          console.log(results);
          res.render("SchermataProfiloProprietario.html", {
            accessoProprietario: results,
          });
        } else {
          console.log(results);
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "QualcosaStorto.html"
            )
          );
        }
      });
    }
  });

  app.get("/reindirizzamentoIscrizione", function (req, res) {
    if (
      (req.session.emailC == undefined || req.session.emailC == "") &&
      (req.session.emailP == undefined || req.session.emailP == "")
    ) {
      res.sendFile(
        path.join(
          __dirname,
          "../Sistema_Alberghi/views",
          "SchermataIscrizione.html"
        )
      );
    } else if (
      (req.session.emailC != "" &&
        (req.session.emailP == undefined || req.session.emailP == "")) ||
      (req.session.emailP != "" &&
        (req.session.emailC == undefined || req.session.emailC == ""))
    ) {
      console.log(
        "L'Utente è già iscritto e ha già effettuato l'accesso al suo profilo!"
      );
      res.sendFile(
        path.join(__dirname, "../Sistema_Alberghi/views", "QualcosaStorto.html")
      );
    }
  });

  app.post("/IscrizioneCliente", function (req, res) {
    console.log("Dati di iscrizione: ");
    console.log(req.body);
    if (
      req.body.nome_iscrizioneC != "" &&
      req.body.cognome_iscrizioneC != "" &&
      req.body.email_iscrizioneC != "" &&
      req.body.password_iscrizioneC != ""
    ) {
      console.log(
        "Campi compilati. Si procede all'inserimento nella table utenteCliente..."
      );
      var sql =
        "insert into gestioneAffitti.utenteCliente values('" +
        req.body.nome_iscrizioneC +
        "', '" +
        req.body.cognome_iscrizioneC +
        "', '" +
        req.body.email_iscrizioneC +
        "', '" +
        req.body.password_iscrizioneC +
        "')";
      con.query(sql, function (err) {
        if (err) {
          console.log(
            "Errore. Qualcosa è andato storto nell''inserimento dei dati nella tabl utenteCliente."
          );
          console.log(
            "E' possibile che l'Utente abbia inserito un indirizzo e-mail già in uso nel Sistema."
          );
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "NotificaIscrizioneClienteFallita.html"
            )
          );
          return;
        }
        console.log("Iscrizione effettuata correttamente.");
        req.session.emailC = req.body.email_iscrizioneC;
        req.session.nomeC = req.body.nome_iscrizioneC;
        req.session.cognomeC = req.body.cognome_iscrizioneC;
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "ConfermaIscrizioneCliente.html"
          )
        );
        var mailOptions = {
          from: "gedasistemabooking@gmail.com",
          to: req.session.emailC,
          subject: "Iscrizione in GEDA",
          text:
            "Ciao, " +
            req.session.nomeC +
            "! La tua iscrizione su GEDA come cliente è andata a buon fine.",
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log("Message %s sent: %s", info.messageId, info.response);
        });
      });
    } else {
      console.log("Non tutti i campi sono stati compilati.");

      res.sendFile(
        path.join(
          __dirname,
          "../Sistema_Alberghi/views",
          "NotificaIscrizioneClienteFallita.html"
        )
      );
    }
  });

  app.post("/IscrizioneProprietario", function (req, res) {
    console.log(req.body);
    if (
      req.body.nome_iscrizioneP != "" &&
      req.body.cognome_iscrizioneP != "" &&
      req.body.email_iscrizioneP != "" &&
      req.body.password_iscrizioneP != ""
    ) {
      console.log(
        "Campi compilati. Si procede all'inserimento nella table utenteProprietario..."
      );
      var sql =
        "insert into gestioneAffitti.utenteProprietario values('" +
        req.body.nome_iscrizioneP +
        "', '" +
        req.body.cognome_iscrizioneP +
        "', '" +
        req.body.email_iscrizioneP +
        "', '" +
        req.body.password_iscrizioneP +
        "')";
      con.query(sql, function (err) {
        if (err) {
          console.log(
            "Errore. Qualcosa è andato storto nell'inserimento dei dati nella tabl utenteProprietario."
          );
          console.log(
            "E' possibile che l'Utente abbia inserito un indirizzo e-mail già in uso nel Sistema."
          );
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "NotificaIscrizioneProprietarioFallita.html"
            )
          );
          return;
        }
        console.log("Iscrizione effettuata correttamente");
        req.session.emailP = req.body.email_iscrizioneP;
        req.session.nomeP = req.body.nome_iscrizioneP;
        req.session.cognomeP = req.body.cognome_iscrizioneP;
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "ConfermaIscrizioneProprietario.html"
          )
        );
        var mailOptions = {
          from: "gedasistemabooking@gmail.com",
          to: req.session.emailP,
          subject: "Iscrizione in GEDA",
          text:
            "Ciao, " +
            req.session.nomeP +
            "! La tua iscrizione su GEDA come proprietario è andata a buon fine.",
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log("Message %s sent: %s", info.messageId, info.response);
        });
      });
    } else {
      console.log("Non tutti i campi sono stati compilati.");
      res.sendFile(
        path.join(
          __dirname,
          "../Sistema_Alberghi/views",
          "NotificaIscrizioneProprietarioFallita.html"
        )
      );
    }
  });

  app.post("/accessoCliente", function (req, res) {
    console.log(req.body);

    var sql =
      "SELECT gestioneAffitti.utenteCliente.nomeC, gestioneAffitti.utenteCliente.cognomeC, gestioneAffitti.utenteCliente.emailC FROM gestioneAffitti.utenteCliente WHERE gestioneAffitti.utenteCliente.emailC = '" +
      req.body.email_loginC +
      "' AND gestioneAffitti.utenteCliente.passwordC = '" +
      req.body.password_loginC +
      "' ";

    con.query(sql, function (err, results) {
      if (results.length == 1) {
        console.log(results);
        req.session.emailC = results[0].emailC;
        req.session.nomeC = results[0].nomeC;
        req.session.cognomeC = results[0].cognomeC;
        console.log(
          req.session.emailC + " ha effettuato l'accesso correttamente."
        );
        if (req.session.risultatiRicerca) {
          res.render("SchermataRicerca.html", {
            ricercaCase: req.session.risultatiRicerca,
          });
        } else {
          res.render("SchermataProfiloCliente.html", {
            accessoCliente: results,
          });
        }
      } else {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaLoginClienteFallito.html"
          )
        );
      }
    });
  });

  app.post("/accessoProprietario", function (req, res) {
    console.log(req.body);

    var sql =
      "SELECT * FROM gestioneAffitti.utenteProprietario WHERE emailP = '" +
      req.body.email_loginP +
      "' AND passwordP = '" +
      req.body.password_loginP +
      "' ";

    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length == 1) {
        console.log(results);
        req.session.emailP = results[0].emailP;
        console.log(
          req.session.emailP + " ha effettuato l'accesso correttamente."
        );
        res.render("SchermataProfiloProprietario.html", {
          accessoProprietario: results,
        });
      } else {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaLoginProprietarioFallito.html"
          )
        );
      }
    });
  });

  app.get("/logoutProprietario", function (req, res) {
    console.log(req.body);
    req.session.emailP;

    var sql =
      "SELECT gestioneAffitti.utenteProprietario.emailP FROM gestioneAffitti.utenteProprietario WHERE gestioneAffitti.utenteProprietario.emailP = '" +
      req.session.emailP +
      "' ";

    con.query(sql, function (err) {
      if (err) {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaLogoutFallito.html"
          )
        );
        return;
      } else {
        req.session.emailP = null;
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "LogoutRiuscito.html"
          )
        );
      }
    });
  });

  app.get("/logoutCliente", function (req, res) {
    console.log(req.body);
    req.session.emailC;

    var sql =
      "SELECT gestioneAffitti.utenteCliente.emailC FROM gestioneAffitti.utenteCliente WHERE gestioneAffitti.utenteCliente.emailC = '" +
      req.session.emailC +
      "' ";

    con.query(sql, function (err) {
      if (err) {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaLogoutFallito.html"
          )
        );
        return;
      } else {
        req.session.emailC = null;
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "LogoutRiuscito.html"
          )
        );
      }
    });
  });

  app.post("/recuperaPasswordProprietario", function (req, res) {
    console.log(req.body);

    var sql =
      "SELECT gestioneAffitti.utenteProprietario.emailP, gestioneAffitti.utenteProprietario.passwordP FROM gestioneAffitti.utenteProprietario WHERE gestioneAffitti.utenteProprietario.emailP = '" +
      req.body.email_R +
      "' ";

    con.query(sql, function (err, results) {
      if (results.length > 0) {
        console.log(results);
        var pwd = new String(results[0].password);

        var mailOptions = {
          from: "gedasistemabooking@gmail.com",
          to: req.body.email_R,
          subject: "Recupero password",
          text: "La password è: " + pwd,
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log("Message %s sent: %s", info.messageId, info.response);
        });
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "LogoutRiuscito.html"
          )
        );
      } else {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaLoginProprietarioFallito.html"
          )
        );
      }
    });
  });

  app.post("/recuperaPasswordCliente", function (req, res) {
    console.log(req.body);

    var sql =
      "SELECT gestioneAffitti.utenteCliente.emailC, gestioneAffitti.utenteCliente.passwordC FROM gestioneAffitti.utenteCliente WHERE gestioneAffitti.utenteCliente.emailC = '" +
      req.body.email_R +
      "' ";

    con.query(sql, function (err, results) {
      if (results.length > 0) {
        console.log(results);
        var pwd = new String(results[0].password);

        var mailOptions = {
          from: "gedasistemabooking@gmail.com",
          to: req.body.email_R,
          subject: "Recupero password",
          text: "La password è: " + pwd,
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log("Message %s sent: %s", info.messageId, info.response);
        });
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "LogoutRiuscito.html"
          )
        );
      } else {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaLoginProprietarioFallito.html"
          )
        );
      }
    });
  });
};
