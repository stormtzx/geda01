var mysql = require("mysql");

const express = require("express");
const app = express();
var path = require("path");
var session = require("express-session");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

const bodyParser = require("body-parser");
var nodemailer = require("nodemailer");
const { Console } = require("console");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("."));
app.use(express.static(path.join(__dirname, "views")));

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

function translateBoolean(mybool) {
  if (mybool) {
    return "sì";
  } else {
    return "no";
  }
}

function convertiData(data) {
  date = new Date(data);
  year = date.getFullYear();
  month = date.getMonth() + 1;
  dt = date.getDate();

  if (dt < 10) {
    dt = "0" + dt;
  }
  if (month < 10) {
    month = "0" + month;
  }

  return (year + "-" + month + "-" + dt).toString();
}

module.exports = function (app) {
  app.get("/visualizzaListaPrenotazioniCliente", function (req, res, err) {
    var sql =
      "SELECT * FROM gestioneAffitti.prenotazione WHERE email_cliente = '" +
      req.session.emailC +
      "'";

    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {
        console.log("Prenotazioni effettuate dal Cliente: ");
        console.log(results);
        for (var i = 0; i < results.length; i++) {
          results[i].check_in = convertiData(results[i].check_in);
          results[i].check_out = convertiData(results[i].check_out);
          results[i].data_emissione = convertiData(results[i].data_emissione);
        }
        res.render("SchermataListaPrenotazioniCliente.html", {
          ListaPrenotazioniCliente: results,
        });
      } else if (results.length == 0) {
        console.log("Nessuna prenotazione effettuata dal Cliente!");
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      }
    });
  });

  app.get("/visualizzaPrenotazioneCliente", function (req, res) {
    var id = req.param("id");

    var sql =
      "SELECT * FROM gestioneAffitti.prenotazione WHERE id_prenotazione = " +
      id +
      "";
    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length == 1) {
        console.log("Dati prenotazione: ");
        console.log(results);
        req.session.id_prenotazione_r = results[0].id_prenotazione;
        req.session.ref_casa_r = results[0].ref_casa;
        req.session.nome_casa_r = results[0].ref_nome_casa;
        req.session.check_out_r = new Date(
          convertiData(results[0].check_out)
        ).getTime();
        req.session.email_proprietario_r = results[0].ref_proprietario;

        results[0].check_in = convertiData(results[0].check_in);
        results[0].check_out = convertiData(results[0].check_out);
        results[0].data_emissione = convertiData(results[0].data_emissione);

        res.render("RiepilogoPrenotazione.html", {
          visualizzaPrenotazione: results,
        });
      } else {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      }
    });
  });

  app.post("/recensione", function (req, res) {
    var oggi = new Date().toISOString().slice(0, 19).replace("T", " ");
    var data_corrente = new Date(convertiData(oggi)).getTime();
    console.log("Voto: ");
    console.log(req.body.stelle_r);
    console.log("Commento: ");
    console.log(req.body.commento_r);

    if (
      data_corrente < req.session.check_out_r ||
      req.body.stelle_r <= 0 ||
      req.body.stelle > 5
    ) {
      console.log(
        "Il Cliente non può lasciare una recensione in quanto non ha ancora soggiornato nella casa oppure non ha inserito un voto correttamente!"
      );
      res.sendFile(
        path.join(__dirname, "../Sistema_Alberghi/views", "QualcosaStorto.html")
      );
    } else {
      var sql =
        "INSERT INTO gestioneAffitti.recensione(ref_casa_r, ref_nome_casa_r, ref_prenotazione_r, nome_recensore, cognome_recensore, email_recensore, email_proprietario, stelle, commento, data_rece) values (" +
        req.session.ref_casa_r +
        ", '" +
        req.session.nome_casa_r +
        "', " +
        req.session.id_prenotazione_r +
        ", '" +
        req.session.nomeC +
        "', '" +
        req.session.cognomeC +
        "', '" +
        req.session.emailC +
        "', '" +
        req.session.email_proprietario_r +
        "', " +
        req.body.stelle_r +
        ", '" +
        req.body.commento_r +
        "', '" +
        data_corrente +
        "')";
      con.query(sql, function (err, results) {
        if (err) {
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "QualcosaStorto.html"
            )
          );
          throw err;
        } else {
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "OperazioneRiuscita.html"
            )
          );
          console.log(
            "Viene inviata la mail di Notifica Prenotazione Ricevuta al Proprietario della casa " +
              req.session.nome_casa_r
          );
          if (req.body.commento_r != "") {
            var mailOptions = {
              from: "gedasistemabooking@gmail.com",
              to: req.session.email_proprietario_r,
              subject:
                "Nuova Recensione ricevuta per la casa" +
                req.session.nome_casa_r,
              text:
                req.session.nomeC +
                " " +
                req.session.cognomeC +
                " ha valutato con " +
                req.body.stelle_r +
                " stelle la tua casa " +
                req.session.nome_casa_r +
                " e ha scritto questo al riguardo: " +
                req.body.commento_r,
            };
          } else {
            var mailOptions = {
              from: "gedasistemabooking@gmail.com",
              to: req.session.email_proprietario_r,
              subject:
                "Nuova Recensione ricevuta per la casa" +
                req.session.nome_casa_r,
              text:
                req.session.nomeC +
                " " +
                req.session.cognomeC +
                " ha valutato con " +
                req.body.stelle_r +
                " stelle la tua casa " +
                req.session.nome_casa_r,
            };
          }
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return console.log(error);
            }
            console.log(
              "Messaggio %s inviato: %s",
              info.messageId,
              info.response
            );
          });
        }
      });
    }
  });

  app.get("/visualizzaRecensioni", function (req, res) {
    console.log(req.session.id_casa);
    console.log(typeof req.session.id_casa);

    var sql = `SELECT * FROM gestioneAffitti.recensione WHERE ref_casa_r = ${req.session.id_casa};`;

    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      } else if (results.length > 0) {
        console.log(
          "Recensioni relative alla casa " + req.session.nome_casa + ": "
        );
        console.log(results);
        res.render("SchermataRecensioniCasa.html", {
          leggiRecensioni: results,
        });
      } else if (results.length == 0) {
        console.log("Nessuna recensione per la casa " + req.session.nome_casa);
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      }
    });
  });

  app.get("/visualizzaRecensioniCliente", function (req, res) {
    var sql =
      "SELECT * FROM gestioneAffitti.recensione WHERE email_recensore = '" +
      req.session.emailC +
      "'";

    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length == 0) {
        console.log("Il cliente non ha scritto nessuna recensione");
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      } else if (results.length > 0) {
        console.log("Lista recensioni cliente: ");
        console.log(results);

        console.log(
          "Recensioni di " +
            req.session.nomeC +
            " " +
            req.session.cognomeC +
            ": "
        );
        console.log(results);
        res.render("SchermataRecensioniCliente.html", {
          leggiRecensioniCliente: results,
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
  });

  app.get("/visualizzaCaseProprietario", function (req, res) {
    var sql =
      "SELECT * FROM gestioneAffitti.casa WHERE proprietario  = '" +
      req.session.emailP +
      "'";

    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {
        console.log("Case di " + req.session.emailP + ": ");
        console.log(results);
        res.render("SchermataListaCaseProprietario.html", {
          ListaCaseProprietario: results,
        });
      } else if (results.length == 0) {
        console.log("L'Utente non ha ancora aggiunto nessuna casa!");
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      }
    });
  });

  app.get("/gestioneCasa", function (req, res) {
    var id = req.param("id");

    var sql =
      "SELECT * FROM gestioneAffitti.casa WHERE gestioneAffitti.casa.id_casa = " +
      id +
      " ";
    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length == 1) {
        console.log(results);
        console.log(results[0].id_casa);
        req.session.id_casa = results[0].id_casa;
        console.log(`session: ${req.session.id_casa}`);
        req.session.nome_casa = results[0].nome_casa;
        req.session.indirizzo = results[0].indirizzo;
        req.session.citta = results[0].citta;

        results[0].prima_data = convertiData(results[0].prima_data);
        results[0].ultima_data = convertiData(results[0].ultima_data);

        res.render("SchermataGestioneCasa.html", { gestioneCasa: results });
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
  });
  app.get("/visualizzaListaPrenotazioniProprietario", function (req, res) {
    var sql =
      "SELECT * FROM gestioneAffitti.prenotazione WHERE ref_proprietario = '" +
      req.session.emailP +
      "'";

    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {
        console.log("Prenotazioni ricevute dal Proprietario: ");
        console.log(results);
        for (var i = 0; i < results.length; i++) {
          results[i].check_in = convertiData(results[i].check_in);
          results[i].check_out = convertiData(results[i].check_out);
          results[i].data_emissione = convertiData(results[i].data_emissione);
        }
        res.render("SchermataListaPrenotazioniProprietario.html", {
          ListaPrenotazioniProprietario: results,
        });
      } else if (results.length == 0) {
        console.log("Nessuna prenotazione ricevuta!");
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      }
    });
  });
  app.get("/visualizzaPrenotazioneCasa", function (req, res) {
    var id = req.param("id");

    var sql =
      "SELECT * FROM gestioneAffitti.prenotazione WHERE id_prenotazione = " +
      id +
      "";
    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length == 1) {
        console.log("Dati prenotazione: ");
        console.log(results);

        results[0].check_in = convertiData(results[0].check_in);
        results[0].check_out = convertiData(results[0].check_out);
        results[0].data_emissione = convertiData(results[0].data_emissione);
        results[0].data_rendiconto = convertiData(results[0].data_rendiconto);

        res.render("SchermataPrenotazioneCasa.html", {
          verificaPrenotazione: results,
        });
      } else if (results.length == 0) {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      }
    });
  });
  app.get("/visualizzaListaPrenotazioniCasa", function (req, res, err) {
    var sql =
      "SELECT * FROM gestioneAffitti.prenotazione WHERE ref_casa = " +
      req.session.id_casa +
      "";

    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {
        console.log(
          "Prenotazioni ricevute dal Proprietario per la casa " +
            req.session.nome_casa +
            ": "
        );
        console.log(results);
        for (var i = 0; i < results.length; i++) {
          results[i].check_in = convertiData(results[i].check_in);
          results[i].check_out = convertiData(results[i].check_out);
          results[i].data_emissione = convertiData(results[i].data_emissione);
        }
        res.render("SchermataListaPrenotazioniCasa.html", {
          ListaPrenotazioniCasa: results,
        });
      } else if (results.length == 0) {
        console.log("Nessuna prenotazione disponibile!");
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
      }
    });
  });
};
