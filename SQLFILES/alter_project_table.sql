-- Alter the project table to increase GLTrackNumber field size
ALTER TABLE project MODIFY COLUMN GLTrackNumber VARCHAR(20) NOT NULL DEFAULT '';
