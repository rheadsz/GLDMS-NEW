-- Alter the project table to increase EA field size and change Route to VARCHAR
ALTER TABLE project MODIFY COLUMN EA VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE project MODIFY COLUMN Route VARCHAR(10) DEFAULT NULL;
