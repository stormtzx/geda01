var mysql = require("mysql");
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "unipa",
  database: "gestioneAffitti",
});

function crea_tableUtenteCliente() {
  var sql =
    "CREATE TABLE IF NOT EXISTS utenteCliente(nomeC VARCHAR(50) not null, cognomeC VARCHAR(50) not null, emailC VARCHAR(50) not null, passwordC VARCHAR (20) not null, PRIMARY KEY(emailC))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table UTENTE-CLIENTE creata");
  });
}

function crea_tableUtenteProprietario() {
  var sql =
    "CREATE TABLE IF NOT EXISTS utenteProprietario(nomeP VARCHAR(50) not null, cognomeP VARCHAR(50) not null, emailP VARCHAR(50) not null, passwordP VARCHAR (20) not null, PRIMARY KEY(emailP))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table UTENTE-PROPRIETARIO creata");
  });
}

function crea_tableCasa() {
  var sql =
    "CREATE TABLE IF NOT EXISTS casa(id_casa INT AUTO_INCREMENT, nome_casa VARCHAR(50) NOT NULL, indirizzo VARCHAR(100) not null, citta VARCHAR(100) not null, proprietario VARCHAR(50), beb VARCHAR (3) not null, casa_vacanza VARCHAR (3) not null, numero_camere int, numero_bagno int, perimetro_casa float not null, tariffa_giornaliera float not null, ammontare_tasse float not null, capienza_max int not null, fasciatoio VARCHAR (3), segnalatori_fumo VARCHAR (3), servizi_disabili VARCHAR (3), animali_ammessi VARCHAR (3), cucina VARCHAR (3), prima_data date not null, ultima_data date not null, descrizione TEXT, PRIMARY KEY(id_casa), FOREIGN KEY (proprietario) references utenteProprietario(emailP) on delete cascade on update cascade)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table CASA creata");
  });
}

function crea_tablePrenotazione() {
  var sql =
    "CREATE TABLE IF NOT EXISTS prenotazione(id_prenotazione int auto_increment, ref_casa int not null, ref_proprietario VARCHAR(50) not null, ref_nome_casa VARCHAR(50) references casa(nome_casa) on delete cascade on update cascade, nome_cliente varchar(50) references utenteCliente(nomeC) on delete cascade on update cascade, cognome_cliente varchar(50) references utenteCliente(cognomeC) on delete cascade on update cascade, email_cliente VARCHAR(50) not null, numero_ospiti_adulti int not null, numero_ospiti_bambini int, data_emissione date not null, check_in date not null, check_out date not null, animali VARCHAR(3) not null, disabilita VARCHAR(3) not null, viaggio_lavoro VARCHAR(3) not null, prezzo float not null, tasse float not null, prezzo_totale float not null, data_rendiconto date, PRIMARY KEY(id_prenotazione), FOREIGN KEY (ref_proprietario) references utenteProprietario(emailP) on delete cascade on update cascade, FOREIGN KEY (email_cliente) references utenteCliente(emailC) on delete cascade on update cascade, FOREIGN KEY (ref_casa) references casa(id_casa) on delete cascade on update cascade)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table PRENOTAZIONE creata");
  });
}

function crea_tableData() {
  var sql =
    "CREATE TABLE IF NOT EXISTS data(id_data int auto_increment, data_soggiorno date not null, ref_casa_o int not null, ref_prenotazione int not null, disponibilita boolean, primary key (id_data), FOREIGN KEY (ref_casa_o) references casa(id_casa) on delete cascade on update cascade, FOREIGN KEY (ref_prenotazione) references prenotazione(id_prenotazione) on delete cascade on update cascade)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table DATA creata");
  });
}

function crea_tableRencensione() {
  var sql =
    "CREATE TABLE IF NOT EXISTS recensione(id_recensione int auto_increment, ref_casa_r int not null, ref_nome_casa_r VARCHAR(50) references casa(nome_casa) on delete cascade on update cascade, ref_prenotazione_r int not null, nome_recensore varchar(50) references utenteCliente(nomeC) on delete cascade on update cascade, cognome_recensore varchar(50) references utenteCliente(cognomeC) on delete cascade on update cascade, email_recensore VARCHAR(50) not null, email_proprietario VARCHAR(50) not null, stelle int(5) not null, commento TEXT, data_rece date not null, primary key(id_recensione), FOREIGN KEY (ref_casa_r) references casa(id_casa) on delete cascade on update cascade, FOREIGN KEY (ref_prenotazione_r) references prenotazione(id_prenotazione) on delete cascade on update cascade, FOREIGN KEY (email_recensore) references utenteCliente(emailC) on delete cascade on update cascade, FOREIGN KEY (email_proprietario) references utenteProprietario(emailP) on delete cascade on update cascade)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table RECENSIONE creata");
  });
}

function crea_tableFoto() {
  var sql =
    "CREATE TABLE IF NOT EXISTS foto(id_foto int auto_increment, ref_casa_f int not null, image varchar(255) NOT NULL, PRIMARY KEY (id_foto), FOREIGN KEY (ref_casa_f) references casa(id_casa) on delete cascade on update cascade)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table FOTO creata");
  });
}

module.exports = {
  crea_tableUtenteCliente,
  crea_tableUtenteProprietario,
  crea_tableCasa,
  crea_tablePrenotazione,
  crea_tableData,
  crea_tableRencensione,
  crea_tableFoto,
};
