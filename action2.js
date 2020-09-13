var mysql = require("mysql");

const express = require("express");
const app = express();
var path = require("path");
var session = require("express-session");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
const fs = require("fs");
var nodemailer = require("nodemailer");
const { isNullOrUndefined } = require("util");

const bodyParser = require("body-parser");
const { Console } = require("console");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("."));
app.use(express.static(path.join(__dirname, "views")));

const multer = require("multer");
const upload = multer({
  dest: "../Sistema_Alberghi/upload",
  // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

const handleError = (err, res) => {
  res.status(500).contentType("text/plain").end("Oops! Something went wrong!");
};

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

function generateDateList(from, to) {
  var getDate = function (date) {
    var m = date.getMonth(),
      d = date.getDate();
    return (
      date.getFullYear() +
      "-" +
      (m < 10 ? "0" + m : m) +
      "-" +
      (d < 10 ? "0" + d : d)
    );
  };
  var fs = from.split("-"),
    startDate = new Date(fs[0], fs[1], fs[2]),
    result = [getDate(startDate)],
    start = startDate.getTime(),
    ts,
    end;

  if (typeof to == "undefined") {
    end = new Date().getTime();
  } else {
    ts = to.split("-");
    end = new Date(ts[0], ts[1], ts[2]).getTime();
  }
  while (start < end) {
    start += 86400000;
    startDate.setTime(start);
    result.push(getDate(startDate));
  }
  return result;
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
  app.post("/nuovaCasa", function (req, res, err) {
    console.log(req.body);
    req.body.beb_nc = translateBoolean(req.body.beb_nc);
    req.body.casa_vacanza_nc = translateBoolean(req.body.casa_vacanza_nc);
    req.body.fasciatoio_nc = translateBoolean(req.body.fasciatoio_nc);
    req.body.segnalatore_fumo_nc = translateBoolean(
      req.body.segnalatore_fumo_nc
    );
    req.body.servizi_disabili_nc = translateBoolean(
      req.body.servizi_disabili_nc
    );

    req.body.animali_nc = translateBoolean(req.body.animali_nc);
    req.body.cucina_nc = translateBoolean(req.body.cucina_nc);
    if (req.body.no_last_nc != undefined) {
      req.body.ultima_data_nc = "9999-12-31";
    }

    if (
      req.body.ultima_data_nc < req.body.prima_data_nc ||
      req.session.emailP == "" ||
      req.session.emailP == undefined
    ) {
      console.log(req.body.prima_data_nc);
      console.log(req.body.ultima_data_nc);
      console.log(req.body.ultima_data_nc < req.body.prima_data_nc);
      console.log(req.session.emailP);
      console.log(req.session.emailP == "");
      console.log("Errore: dati inseriti non validi");
      console.log(err);

      res.sendFile(
        path.join(
          __dirname,
          "../Sistema_Alberghi/views",
          "NotificaNuovaCasaFallita.html"
        )
      );
      return;
    } else {
      var sql =
        "insert into gestioneAffitti.casa(nome_casa, indirizzo, citta, proprietario, beb, casa_vacanza, numero_camere, numero_bagno, perimetro_casa, tariffa_giornaliera, capienza_max, ammontare_tasse, fasciatoio, segnalatori_fumo, servizi_disabili, animali_ammessi, cucina, prima_data, ultima_data, descrizione) values('" +
        req.body.nome_casa_nc +
        "', '" +
        req.body.indirizzo_nc +
        "', '" +
        req.body.citta_nc +
        "', '" +
        req.session.emailP +
        "', '" +
        req.body.beb_nc +
        "', '" +
        req.body.casa_vacanza_nc +
        "', " +
        req.body.camere_nc +
        ", " +
        req.body.bagni_nc +
        ", " +
        req.body.perimetro_nc +
        ", " +
        req.body.tariffa_nc +
        ", " +
        req.body.capienza_nc +
        ", " +
        req.body.tasse_nc +
        ", '" +
        req.body.fasciatoio_nc +
        "', '" +
        req.body.segnalatore_fumo_nc +
        "', '" +
        req.body.servizi_disabili_nc +
        "', '" +
        req.body.animali_nc +
        "', '" +
        req.body.cucina_nc +
        "', '" +
        req.body.prima_data_nc +
        "', '" +
        req.body.ultima_data_nc +
        "', '" +
        req.body.descrizione_nc +
        "' ) ";
      con.query(sql, function (err, results) {
        if (err) {
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "QualcosaStorto.html"
            )
          );
          console.log(err);
        }
        console.log("CASA inserita correttamente.");
        req.session.indirizzo = req.body.indirizzo_nc;
        req.session.citta = req.body.citta_nc;
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "ConfermaAggiuntaCasa.html"
          )
        );
      });
    }
  });

  app.post("/caricafoto", upload.single("file"), function (req, res) {
    //var file = req.body.uploaded_image;
    //var img_name = req.body.name;
    var sql1 =
      "SELECT id_casa FROM gestioneAffitti.casa WHERE id_casa >= ALL (SELECT id_casa FROM gestioneAffitti.casa)";
    con.query(sql1, function (err, results) {
      if (err || results.length > 1) {
        console.log("Inserimento Foto non corretto.");
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "QualcosaStorto.html"
          )
        );
        console.log(err);
      } else if (results.length == 1) {
        req.session.ref_casa_f = results[0].id_casa;
        var file = __dirname + "../Sistema_Alberghi/upload" + req.file.filename;
        var sql =
          "insert into gestioneAffitti.foto(ref_casa_f, image) values (" +
          req.session.ref_casa_f +
          ", '" +
          req.file.filename +
          "' ) ";

        fs.rename(req.file.path, file, function (err) {
          con.query(sql, function (err, results) {
            if (err) {
              console.log("Inserimento Foto non corretto.");
              res.sendFile(
                path.join(
                  __dirname,
                  "../Sistema_Alberghi/views",
                  "QualcosaStorto.html"
                )
              );
              console.log(err);
            } else {
              console.log("FOTO inserita correttamente.");
              res.sendFile(
                path.join(
                  __dirname,
                  "../Sistema_Alberghi/views",
                  "ConfermaAggiuntaFoto.html"
                )
              );
            }
          });
        });
      }
    });
  });

  app.get("/visualizzaFotoCasa", function (req, res) {
    var sql =
      "SELECT * FROM gestioneAffitti.foto WHERE gestioneAffitti.foto.ref_casa_f = " +
      req.session.id_casa +
      "";

    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      }
      if (results.length > 0) {
        console.log("Ecco le foto");
        console.log(results);
        res.render("VisualizzaFotoCasa.html", { ListaFotoCasa: results });
      } else {
        console.log("L'Utente non ha ancora aggiunto nessuna Foto!");
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

  app.post("/ricerca", function (req, res) {
    console.log(req.body);
    if (req.body.check_in_r == "" && req.body.check_out_r == "") {
      var sql =
        "SELECT * FROM gestioneAffitti.casa WHERE gestioneAffitti.casa.citta = '" +
        req.body.citta_r +
        "' ";
    } else if (req.body.check_in_r == "") {
      sql =
        "SELECT * FROM gestioneAffitti.casa WHERE gestioneAffitti.casa.citta = '" +
        req.body.citta_r +
        "' AND gestioneAffitti.casa.ultima_data >= '" +
        req.body.check_out_r +
        "' ";
    } else if (req.body.check_out_r == "") {
      sql =
        "SELECT * FROM gestioneAffitti.casa WHERE gestioneAffitti.casa.citta = '" +
        req.body.citta_r +
        "' AND gestioneAffitti.casa.prima_data <= '" +
        req.body.check_in_r +
        "' ";
    } else {
      sql =
        "SELECT * FROM gestioneAffitti.casa WHERE gestioneAffitti.casa.citta = '" +
        req.body.citta_r +
        "' AND gestioneAffitti.casa.prima_data <= '" +
        req.body.check_in_r +
        "' AND gestioneAffitti.casa.ultima_data >= '" +
        req.body.check_out_r +
        "' ";
    }

    con.query(sql, function (err, results) {
      if (err) {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "QualcosaStorto.html"
          )
        );
        console.log(err);
      }
      if (results.length > 0) {
        console.log(results);
        req.session.risultatiRicerca = results;
        res.render("SchermataRicerca.html", { ricercaCase: results });
      } else if (results.length == 0) {
        console.log("La ricerca non ha prodotto risultati");
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

  app.get("/visualizzaCasa", function (req, res) {
    var id = parseInt(req.param("id"));

    /*var sql1 =
      "SELECT * FROM gestioneAffitti.foto WHERE ref_casa_f = " + id + "";
    con.query(sql1, function (err, results) {
      if (err) {
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaRicercaFallita.html"
          )
        );
        console.log(err);
      } else {
        if (results.length > 0) {
          var sql =
            "SELECT * FROM gestioneAffitti.casa, gestioneAffitti.foto WHERE gestioneAffitti.casa.id_casa = " +
            id +
            " AND gestioneAffitti.casa.id_casa = gestioneAffitti.foto.ref_casa_f";
        } else if (results.length == 0) {*/
    var sql =
      "SELECT * FROM gestioneAffitti.casa WHERE gestioneAffitti.casa.id_casa = " +
      id +
      "";
    // }
    con.query(sql, function (err, results) {
      if (err) {
        console.log(err);
      } else if (results.length > 0) {
        console.log(results);
        req.session.id_casa = results[0].id_casa;
        req.session.nome_casa = results[0].nome_casa;
        req.session.citta = results[0].citta;
        req.session.indirizzo = results[0].indirizzo;
        req.session.proprietario = results[0].proprietario;
        req.session.tariffa_giornaliera = results[0].tariffa_giornaliera;
        req.session.animali_ammessi = results[0].animali;
        req.session.prima_data = results[0].prima_data;
        req.session.ultima_data = results[0].ultima_data;
        req.session.ammontare_tasse = results[0].ammontare_tasse;
        req.session.capienza_max = results[0].capienza_max;
        req.session.results = results;
        if (req.session.emailC) {
          var sql2 =
            "SELECT * FROM gestioneAffitti.foto WHERE gestioneAffitti.foto.ref_casa_f = " +
            req.session.id_casa +
            "";
          con.query(sql2, function (err, results) {
            res.render("SchermataCasa.html", {
              visualizzaCasa: req.session.results,
              //ListaFotoCasa: results,
            });
          });
        } else if (
          req.session.emailC == undefined ||
          req.session.emailC == ""
        ) {
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "PannelloLoginCliente.html"
            )
          );
        }
      } else {
        console.log(err);

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

  app.post("/calcoloTasse", function (req, res) {
    console.log(req.body);
    req.body.animali_p = translateBoolean(req.body.animali_p);
    req.body.disabilita_p = translateBoolean(req.body.disabilita_p);
    req.body.viaggio_lavoro_p = translateBoolean(req.body.viaggio_lavoro_p);
    req.body.segnalatore_fumo_nc = translateBoolean(
      req.body.segnalatore_fumo_nc
    );

    if (req.body.numero_ospiti_bambini_p == 0)
      req.body.numero_ospiti_bambini_p = 0;

    console.log("valori checkbox convertiti");

    var check_in = new Date(req.body.data_check_in_p).getTime();
    var check_out = new Date(req.body.data_check_out_p).getTime();
    var prima_data = new Date(req.session.prima_data).getTime();
    var ultima_data = new Date(req.session.ultima_data).getTime();
    var tariffa = parseFloat(req.session.tariffa_giornaliera);
    var tasse = parseFloat(req.session.ammontare_tasse);
    var ospiti_adulti = parseInt(req.body.numero_ospiti_adulti_p);
    var ospiti_bambini = parseInt(req.body.numero_ospiti_bambini_p);
    var numero_ospiti = ospiti_adulti + ospiti_bambini;

    var diffTime = check_out - check_in;
    var days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    var giorni = parseInt(days); //calcolo dei giorni che intercorrono fra check-in e check-out

    var sql =
      "SELECT data_soggiorno FROM gestioneAffitti.data WHERE ref_casa_o = " +
      req.session.id_casa +
      "";

    var ControlloListaDate = generateDateList(
      req.body.data_check_in_p,
      req.body.data_check_out_p
    );

    console.log(
      "Si procede al controllo della disponibilità della casa fra la data del Check-In e la data del Check-Out specificate dall'Utente...."
    );

    con.query(sql, function (err, results) {
      var dateOccupate = 0; //contatore
      if (err) {
        console.log(err);
      } else if (results.length >= 0) {
        console.log("Date già occupate per la casa: ");

        var risultati = [];
        var date_da_occupare = [];
        for (var x = 0; x < results.length; x++) {
          risultati.push(
            new Date(convertiData(results[x].data_soggiorno)).getTime()
          );
        }

        console.log(risultati);

        for (y = 0; y < ControlloListaDate.length; y++) {
          date_da_occupare.push(new Date(ControlloListaDate[y]).getTime());
        }

        for (var i = 0; i < date_da_occupare.length; i++) {
          for (var j = 0; j < risultati.length; j++) {
            if (date_da_occupare[i] == risultati[j]) {
              console.log(date_da_occupare[i] == risultati[j]);
              dateOccupate = dateOccupate + 1; //il contatore viene incrementato ogni volta che viene idividuata una data fra check-in e check-out che coincida con una data già presente nella table DATA
              console.log(
                "La casa è già stata prenotata per il giorno " +
                  ControlloListaDate[i]
              );
            } else {
              continue;
            }
          }
        }
        console.log("Date già occupate: " + dateOccupate);
      }
      //condizioni
      if (
        req.body.data_check_in_p != "" &&
        req.body.data_check_out_p != "" &&
        check_out > check_in &&
        check_in >= prima_data &&
        check_out <= ultima_data &&
        giorni <= 28 &&
        numero_ospiti <= req.session.capienza_max &&
        dateOccupate == 0
      ) {
        console.log("Data check-in:" + req.body.data_check_in_p);
        console.log("Data check-out:" + req.body.data_check_out_p);
        console.log(
          "La casa è disponibile in tutte le date fra check-in e check-out"
        );
        console.log("Prima data disponibilità:" + req.session.prima_data);

        console.log("Ultima data disponibilità:" + req.session.ultima_data);
        console.log("Calcolo prezzi e tasse...");

        console.log("Tariffa giornaliera:" + tariffa + " euro");

        var prezzo = giorni * tariffa;
        console.log("Soggiorno: " + giorni + " giorni");
        console.log("Prezzo: " + prezzo + " euro");

        if (
          req.body.viaggio_lavoro_p == "sì" ||
          req.body.disabilita_p == "sì"
        ) {
          tasse = tasse / 2;
        } //agevolazioni per viaggiatori lavoratori e/o disabili
        var totale = prezzo + tasse;
        console.log("Tasse di soggiorno: " + tasse + " euro");
        console.log("Totale: " + totale + " euro");

        var ListaDate = generateDateList(
          req.body.data_check_in_p,
          req.body.data_check_out_p
        );
        req.session.ListaDate = ListaDate;

        req.session.check_in_p = req.body.data_check_in_p;
        req.session.check_out_p = req.body.data_check_out_p;
        req.session.animali_p = req.body.animali_p;
        req.session.disabilita_p = req.body.disabilita_p;
        req.session.viaggio_lavoro_p = req.body.viaggio_lavoro_p;
        req.session.prezzo_p = prezzo;
        req.session.tasse_p = tasse;
        req.session.totale_p = totale;
        req.session.numero_ospiti_adulti_p = ospiti_adulti;
        req.session.numero_ospiti_bambini_p = ospiti_bambini;

        res.render("SchermataPrezzo.html", {
          nome_cliente_p: req.session.nomeC,
          cognome_cliente_p: req.session.cognomeC,
          numero_ospiti_p: numero_ospiti,
          check_in_p: req.body.data_check_in_p,
          check_out_p: req.body.data_check_out_p,
          giorni_p: giorni,
          prezzo_p: prezzo,
          tasse_p: tasse,
          totale_p: totale,
        });
      } else if (
        req.body.data_check_in_p != "" &&
        req.body.data_check_out_p != "" &&
        check_out > check_in &&
        check_in >= prima_data &&
        check_out <= ultima_data &&
        giorni <= 28 &&
        numero_ospiti <= req.session.capienza_max &&
        dateOccupate > 0
      ) {
        var sql2 =
          "SELECT data_soggiorno FROM gestioneAffitti.data WHERE ref_casa_o = " +
          req.session.id_casa +
          "";
        con.query(sql2, function (err, results) {
          if (err) {
            console.log(err);
            res.sendFile(
              path.join(
                __dirname,
                "../Sistema_Alberghi/views",
                "NotificaPrenotazioneFallita.html"
              )
            );
          } else {
            console.log("Lista date già occupate: ");
            console.log(results);
            for (var i = 0; i < results.length; i++) {
              results[i].data_soggiorno = convertiData(
                results[i].data_soggiorno
              );
            }
            res.render("NotificaDateOccupate.html", {
              casa_o: req.session.nome_casa,
              data_o: results,
            });
          }
        });
      } else {
        console.log(err);
        res.sendFile(
          path.join(
            __dirname,
            "../Sistema_Alberghi/views",
            "NotificaPrenotazioneFallita.html"
          )
        );
        return;
      }
    });
  });
  function occupaDate(req, ref_prenotazione) {
    console.log("Lista date occupate dal Cliente: ");
    console.log(req.session.ListaDate);
    console.log("Lunghezza soggiorno: ");
    console.log(req.session.ListaDate.length);

    for (var i = 0; i < req.session.ListaDate.length; i++) {
      var sql =
        "INSERT INTO gestioneAffitti.data(data_soggiorno, ref_casa_o, ref_prenotazione, disponibilita) values ('" +
        req.session.ListaDate[i] +
        "', " +
        req.session.id_casa +
        ", " +
        ref_prenotazione +
        ", " +
        1 +
        ")";

      con.query(sql, function (err) {
        if (err) {
          console.log(err);
        }
      });
      console.log(
        req.session.nome_casa +
          " occupata in data " +
          req.session.ListaDate[i] +
          "."
      );
    }
  }

  app.post("/prenota", function (req, res, err) {
    var data_corrente = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (
      req.session.check_in_p == "" ||
      req.session.check_out_p == "" ||
      req.session.prezzo_p == null ||
      req.session.tasse_p == null ||
      req.session.totale_p == null
    ) {
      console.log(
        "Errore. E' possibile che non tutti i campi siano stati compilati correttamente."
      );
      console.log(err);
      res.sendFile(
        path.join(
          __dirname,
          "../Sistema_Alberghi/views",
          "NotificaPrenotazioneFallita.html"
        )
      );
      return;
    } else {
      console.log(
        "Dati inseriti correttamente. Si procede all'inserimento nella table PRENOTAZIONE...."
      );
      var sql =
        "INSERT INTO gestioneAffitti.prenotazione(ref_casa, ref_proprietario, ref_nome_casa, nome_cliente, cognome_cliente, email_cliente, numero_ospiti_adulti, numero_ospiti_bambini, data_emissione, check_in, check_out, animali, disabilita, viaggio_lavoro, prezzo, tasse, prezzo_totale) values (" +
        req.session.id_casa +
        ", '" +
        req.session.proprietario +
        "', '" +
        req.session.nome_casa +
        "', '" +
        req.session.nomeC +
        "', '" +
        req.session.cognomeC +
        "', '" +
        req.session.emailC +
        "', " +
        req.session.numero_ospiti_adulti_p +
        ", " +
        req.session.numero_ospiti_bambini_p +
        ", '" +
        data_corrente +
        "' , '" +
        req.session.check_in_p +
        "', '" +
        req.session.check_out_p +
        "', '" +
        req.session.animali_p +
        "', '" +
        req.session.disabilita_p +
        "', '" +
        req.session.viaggio_lavoro_p +
        "', " +
        req.session.prezzo_p +
        ", " +
        req.session.tasse_p +
        ", " +
        req.session.totale_p +
        ") ";

      con.query(sql, function (err) {
        if (err) {
          console.log("Errore.");
          console.log(err);
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "NotificaPrenotazioneFallita.html"
            )
          );
          return;
        } else {
          console.log("PRENOTAZIONE effettuata correttamente");
          res.sendFile(
            path.join(
              __dirname,
              "../Sistema_Alberghi/views",
              "ConfermaPrenotazioneEffettuata.html"
            )
          );
          var mailOptions = {
            from: "gedasistemabooking@gmail.com",
            to: req.session.proprietario,
            subject: "Prenotazione ricevuta",
            text:
              "Ciao! Hai appena ricevuto una PRENTOAZIONE fra giorno " +
              req.session.check_in_p +
              " e giorno " +
              req.session.check_out_p +
              " per la tua casa " +
              req.session.nome_casa +
              " (codice identificativo: " +
              req.session.id_casa +
              "). Riepilogo dati prenotazione: " +
              req.session.nome_casa +
              ", Nome Cliente: " +
              req.session.nomeC +
              ", Cognome Cliente " +
              req.session.cognomeC +
              ", E-mail Cliente: " +
              req.session.emailC +
              ", Ospiti adulti: " +
              req.session.numero_ospiti_adulti_p +
              ", Ospiti bambini: " +
              req.session.numero_ospiti_bambini_p +
              ", Data prenotazione: " +
              data_corrente +
              " , da " +
              req.session.check_in_p +
              ", a " +
              req.session.check_out_p +
              ", Presenza animali: " +
              req.session.animali_p +
              ", Disabilità di uno o più ospiti: " +
              req.session.disabilita_p +
              ", Viaggio di lavoro: " +
              req.session.viaggio_lavoro_p +
              ", Prezzo " +
              req.session.prezzo_p +
              ", Tasse " +
              req.session.tasse_p +
              ", Totale " +
              req.session.totale_p,
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              return console.log(error);
            }
            console.log(
              "Notifica Prenotazione ricevuta inviata alla e-mail del PROPRIETARIO",
              info.messageId,
              info.response
            );
          });

          var mailOptions2 = {
            from: "gedasistemabooking@gmail.com",
            to: req.session.emailC,
            subject: "Prenotazione effettuata correttamente",
            text:
              "Ciao! Hai appena effettuato una PRENTOAZIONE fra giorno " +
              req.session.check_in_p +
              " e giorno " +
              req.session.check_out_p +
              " per la casa " +
              req.session.nome_casa +
              " (codice identificativo: " +
              req.session.id_casa +
              "). Riepilogo dati prenotazione: " +
              req.session.nome_casa +
              ", Nome Cliente: " +
              req.session.nomeC +
              ", Cognome Cliente " +
              req.session.cognomeC +
              ", E-mail Cliente: " +
              req.session.emailC +
              ", E-mail Proprietario: " +
              req.session.proprietario +
              ", Ospiti adulti: " +
              req.session.numero_ospiti_adulti_p +
              ", Ospiti bambini: " +
              req.session.numero_ospiti_bambini_p +
              ", Data prenotazione: " +
              data_corrente +
              " , da " +
              req.session.check_in_p +
              ", a " +
              req.session.check_out_p +
              ", Presenza animali: " +
              req.session.animali_p +
              ", Disabilità di uno o più ospiti: " +
              req.session.disabilita_p +
              ", Viaggio di lavoro: " +
              req.session.viaggio_lavoro_p +
              ", Prezzo " +
              req.session.prezzo_p +
              ", Tasse " +
              req.session.tasse_p +
              ", Totale " +
              req.session.totale_p,
          };
          transporter.sendMail(mailOptions2, (error, info) => {
            if (error) {
              return console.log(error);
            }
            console.log(
              "Conferma Prenotazione effettuata inviata alla e-mail del CLIENTE",
              info.messageId,
              info.response
            );
          });
          var sql2 =
            "SELECT id_prenotazione FROM gestioneAffitti.prenotazione WHERE id_prenotazione >= ALL (SELECT id_prenotazione FROM gestioneAffitti.prenotazione)"; //Viene selezionata la PRENOTAZIONE appena effettuata, il suo identificativo auto-generatosi in sql, e il parametro viene passato nella funziona occupaDate: il riferimento alla prenotazione nelle tuple di DATA consentirà al Cliente che intende cancellare la sua prenotazione di liberare le date precedentemente occupate.
          con.query(sql2, function (err, results) {
            if (results.length != 1 || err) {
              console.log("Errore durante l'inserimento ");
              console.log(err);
            } else {
              occupaDate(req, results[0].id_prenotazione);
            }
          });
        }
      });
    }
  });
};
