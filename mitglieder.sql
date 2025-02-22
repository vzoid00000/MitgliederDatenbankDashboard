DROP TABLE IF EXISTS email_hat_person;
DROP TABLE IF EXISTS statuszeitraum;
DROP TABLE IF EXISTS person_hat_telefonnummer;
DROP TABLE IF EXISTS person_hat_titel;
DROP TABLE IF EXISTS status;
DROP TABLE IF EXISTS mitgliedschaftszeitraum;
DROP TABLE IF EXISTS email;
DROP TABLE IF EXISTS titel;
DROP TABLE IF EXISTS telefonnummer;
DROP TABLE IF EXISTS telefonnummer_typ;
DROP TABLE IF EXISTS person;
DROP TABLE IF EXISTS geschlecht;
DROP TABLE IF EXISTS rolle;

CREATE TABLE IF NOT EXISTS geschlecht (
  geschlecht_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  geschlecht VARCHAR(1) NOT NULL,
  PRIMARY KEY (geschlecht_id),
  UNIQUE INDEX idx_geschlecht (geschlecht)
);

CREATE TABLE IF NOT EXISTS rolle (
  rolle_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rolle_bezeichnung VARCHAR(45) NOT NULL,
  PRIMARY KEY (rolle_id),
  UNIQUE INDEX idx_rolle_bezeichnung (rolle_bezeichnung)
);

CREATE TABLE IF NOT EXISTS person (
  person_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vorname VARCHAR(45) NOT NULL,
  nachname VARCHAR(45) NOT NULL,
  geburtsdatum DATE NULL,
  mitgliedsnummer INT UNSIGNED NULL UNIQUE,
  schuetzenpassnummer INT UNSIGNED NULL UNIQUE,
  strasse VARCHAR(45) NULL,
  ort VARCHAR(45) NULL,
  plz VARCHAR(45) NULL,
  geschlecht_id INT UNSIGNED NOT NULL,
  ist_landesverband_gemeldet TINYINT(1) UNSIGNED NOT NULL,
  hat_schluessel_suessenbrunn TINYINT(1) UNSIGNED NOT NULL,
  rolle_id INT UNSIGNED NOT NULL,
  notiz TEXT NULL,
  PRIMARY KEY (person_id),
  CONSTRAINT fk_person_geschlecht FOREIGN KEY (geschlecht_id) REFERENCES geschlecht (geschlecht_id),
  CONSTRAINT fk_person_rolle FOREIGN KEY (rolle_id) REFERENCES rolle (rolle_id)
);

CREATE TABLE IF NOT EXISTS telefonnummer_typ (
  telefonnummer_typ_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  telefonnummer_typ VARCHAR(45) NOT NULL,
  PRIMARY KEY (telefonnummer_typ_id),
  UNIQUE INDEX idx_telefonnummer_typ (telefonnummer_typ)
);

CREATE TABLE IF NOT EXISTS telefonnummer (
  telefonnummer_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  telefonnummer VARCHAR(45) NULL,
  telefonnummer_typ_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (telefonnummer_id),
  CONSTRAINT fk_telefonnummer_typ FOREIGN KEY (telefonnummer_typ_id) REFERENCES telefonnummer_typ (telefonnummer_typ_id)
);

CREATE TABLE IF NOT EXISTS titel (
  titel_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titel VARCHAR(45) NOT NULL,
  PRIMARY KEY (titel_id),
  UNIQUE INDEX idx_titel (titel)
);

CREATE TABLE IF NOT EXISTS email (
  email_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email_adresse VARCHAR(45) NULL,
  PRIMARY KEY (email_id),
  UNIQUE INDEX idx_email_adresse (email_adresse)
);

CREATE TABLE IF NOT EXISTS mitgliedschaftszeitraum (
  mitgliedschaftszeitraum_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  von DATE NULL,
  bis DATE NULL,
  person_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (mitgliedschaftszeitraum_id),
  CONSTRAINT fk_mitgliedschaftszeitraum_person FOREIGN KEY (person_id) REFERENCES person (person_id)
);

CREATE TABLE IF NOT EXISTS status (
  status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_bezeichnung VARCHAR(45) NOT NULL,
  PRIMARY KEY (status_id),
  UNIQUE INDEX idx_status_bezeichnung (status_bezeichnung)
);

CREATE TABLE IF NOT EXISTS person_hat_titel (
  person_id INT UNSIGNED NOT NULL,
  titel_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (person_id, titel_id),
  CONSTRAINT fk_person_hat_titel_person FOREIGN KEY (person_id) REFERENCES person (person_id),
  CONSTRAINT fk_person_hat_titel_titel FOREIGN KEY (titel_id) REFERENCES titel (titel_id)
);

CREATE TABLE IF NOT EXISTS person_hat_telefonnummer (
  person_id INT UNSIGNED NOT NULL,
  telefonnummer_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (person_id, telefonnummer_id),
  CONSTRAINT fk_person_hat_telefonnummer_person FOREIGN KEY (person_id) REFERENCES person (person_id),
  CONSTRAINT fk_person_hat_telefonnummer_telefonnummer FOREIGN KEY (telefonnummer_id) REFERENCES telefonnummer (telefonnummer_id)
);

CREATE TABLE IF NOT EXISTS statuszeitraum (
  statuszeitraum_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  von DATE NULL,
  bis DATE NULL,
  status_id INT UNSIGNED NOT NULL,
  person_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (statuszeitraum_id),
  CONSTRAINT fk_statuszeitraum_status FOREIGN KEY (status_id) REFERENCES status (status_id),
  CONSTRAINT fk_statuszeitraum_person FOREIGN KEY (person_id) REFERENCES person (person_id)
);

CREATE TABLE IF NOT EXISTS email_hat_person (
  email_id INT UNSIGNED NOT NULL,
  person_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (email_id, person_id),
  CONSTRAINT fk_email_hat_person_email FOREIGN KEY (email_id) REFERENCES email (email_id),
  CONSTRAINT fk_email_hat_person_person FOREIGN KEY (person_id) REFERENCES person (person_id)
);
