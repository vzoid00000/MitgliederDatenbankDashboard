DROP TABLE IF EXISTS person_hat_email;
DROP TABLE IF EXISTS person_hat_telefonnummer;
DROP TABLE IF EXISTS person_hat_titel;
DROP TABLE IF EXISTS mitgliedschaftszeitraum;
DROP TABLE IF EXISTS email;
DROP TABLE IF EXISTS titel;
DROP TABLE IF EXISTS titel_typ;
DROP TABLE IF EXISTS telefonnummer;
DROP TABLE IF EXISTS telefonnummer_typ;
DROP TABLE IF EXISTS person;
DROP TABLE IF EXISTS status;
DROP TABLE IF EXISTS rolle;
DROP TABLE IF EXISTS geschlecht;

CREATE TABLE IF NOT EXISTS geschlecht (
                                          geschlecht_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                          geschlecht VARCHAR(1) NOT NULL,
    PRIMARY KEY (geschlecht_id),
    UNIQUE INDEX unique_geschlecht (geschlecht ASC)
    );

CREATE TABLE IF NOT EXISTS rolle (
                                     rolle_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                     rolle_bezeichnung VARCHAR(45) NOT NULL,
    PRIMARY KEY (rolle_id),
    UNIQUE INDEX unique_rolle_bezeichnung (rolle_bezeichnung ASC)
    );

CREATE TABLE IF NOT EXISTS status (
                                      status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                      status_bezeichnung VARCHAR(45) NOT NULL,
    PRIMARY KEY (status_id),
    UNIQUE INDEX unique_status_bezeichnung (status_bezeichnung ASC)
    );

CREATE TABLE IF NOT EXISTS person (
                                      person_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                      vorname VARCHAR(45) NOT NULL,
    nachname VARCHAR(45) NOT NULL,
    geburtsdatum DATE NULL,
    mitgliedsnummer INT UNSIGNED NULL,
    schuetzenpassnummer INT UNSIGNED NULL,
    strasse VARCHAR(45) NULL,
    ort VARCHAR(45) NULL,
    plz VARCHAR(45) NULL,
    geschlecht_id INT UNSIGNED NOT NULL,
    ist_landesverband_gemeldet TINYINT(1) UNSIGNED NOT NULL,
    hat_schluessel_suessenbrunn TINYINT(1) UNSIGNED NOT NULL,
    rolle_id INT UNSIGNED NOT NULL,
    status_id INT UNSIGNED NOT NULL,
    notiz TEXT NULL,
    PRIMARY KEY (person_id),
    UNIQUE INDEX unique_mitgliedsnummer (mitgliedsnummer ASC),
    UNIQUE INDEX unique_schuetzenpassnummer (schuetzenpassnummer ASC),
    INDEX idx_geschlecht (geschlecht_id),
    INDEX idx_rolle (rolle_id),
    INDEX idx_status (status_id),
    CONSTRAINT fk_person_geschlecht FOREIGN KEY (geschlecht_id) REFERENCES geschlecht (geschlecht_id),
    CONSTRAINT fk_person_rolle FOREIGN KEY (rolle_id) REFERENCES rolle (rolle_id),
    CONSTRAINT fk_person_status FOREIGN KEY (status_id) REFERENCES status (status_id)
    );

CREATE TABLE IF NOT EXISTS telefonnummer_typ (
                                                 telefonnummer_typ_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                                 telefonnummer_typ VARCHAR(45) NOT NULL,
    PRIMARY KEY (telefonnummer_typ_id),
    UNIQUE INDEX unique_telefonnummer_typ (telefonnummer_typ ASC)
    );

CREATE TABLE IF NOT EXISTS telefonnummer (
												 telefonnummer_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
												 telefonnummer VARCHAR(45) NULL,
												 telefonnummer_typ_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (telefonnummer_id),
    INDEX idx_telefonnummer_typ (telefonnummer_typ_id),
    UNIQUE KEY unique_telefonnummer_typ (telefonnummer, telefonnummer_typ_id),
    CONSTRAINT fk_telefonnummer_typ FOREIGN KEY (telefonnummer_typ_id) REFERENCES telefonnummer_typ (telefonnummer_typ_id)
);


CREATE TABLE IF NOT EXISTS titel_typ (
                                         titel_typ_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                         titel_typ_bezeichnung VARCHAR(45) NOT NULL,
    PRIMARY KEY (titel_typ_id),
    UNIQUE INDEX titel_typ_bezeichnung_UNIQUE (titel_typ_bezeichnung ASC) VISIBLE
    );

CREATE TABLE IF NOT EXISTS titel (
                                     titel_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                     titel VARCHAR(45) NOT NULL,
    titel_typ_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (titel_id),
    UNIQUE INDEX titel_UNIQUE (titel ASC) VISIBLE,
    INDEX fk_titel_titel_typ1_idx (titel_typ_id ASC) VISIBLE,
    CONSTRAINT fk_titel_titel_typ1
    FOREIGN KEY (titel_typ_id)
    REFERENCES titel_typ (titel_typ_id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
    );

CREATE TABLE IF NOT EXISTS email (
                                     email_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                     email_adresse VARCHAR(45) NULL,
    PRIMARY KEY (email_id),
    UNIQUE INDEX unique_email_adresse (email_adresse ASC)
    );

CREATE TABLE IF NOT EXISTS mitgliedschaftszeitraum (
                                                       mitgliedschaftszeitraum_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                                                       von DATE NULL,
                                                       bis DATE NULL,
                                                       person_id INT UNSIGNED NOT NULL,
                                                       PRIMARY KEY (mitgliedschaftszeitraum_id),
    INDEX idx_person (person_id),
    CONSTRAINT fk_mitgliedschaftszeitraum_person FOREIGN KEY (person_id) REFERENCES person (person_id)
    ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS person_hat_titel (
                                                person_id INT UNSIGNED NOT NULL,
                                                titel_id INT UNSIGNED NOT NULL,
                                                reihenfolge INT UNSIGNED NOT NULL,
                                                PRIMARY KEY (person_id, titel_id),
    INDEX idx_titel (titel_id),
    INDEX idx_person_titel (person_id),
    CONSTRAINT fk_person_titel FOREIGN KEY (person_id) REFERENCES person (person_id)
    ON DELETE CASCADE,
    CONSTRAINT fk_titel_person FOREIGN KEY (titel_id) REFERENCES titel (titel_id)
    );

CREATE TABLE IF NOT EXISTS person_hat_telefonnummer (
                                                        person_id INT UNSIGNED NOT NULL,
                                                        telefonnummer_id INT UNSIGNED NOT NULL,
                                                        PRIMARY KEY (person_id, telefonnummer_id),
    INDEX idx_telefonnummer (telefonnummer_id),
    INDEX idx_person_telefonnummer (person_id),
    CONSTRAINT fk_person_telefonnummer FOREIGN KEY (person_id) REFERENCES person (person_id)
    ON DELETE CASCADE,
    CONSTRAINT fk_telefonnummer_person FOREIGN KEY (telefonnummer_id) REFERENCES telefonnummer (telefonnummer_id)
    );

CREATE TABLE IF NOT EXISTS person_hat_email (
                                                person_id INT UNSIGNED NOT NULL,
                                                email_id INT UNSIGNED NOT NULL,
                                                PRIMARY KEY (person_id, email_id),
    INDEX idx_email (email_id),
    INDEX idx_person_email (person_id),
    CONSTRAINT fk_person_email FOREIGN KEY (person_id) REFERENCES person (person_id)
    ON DELETE CASCADE,
    CONSTRAINT fk_email_person FOREIGN KEY (email_id) REFERENCES email (email_id)
    );
