-- =====================================================
-- GLDMS 2025 - Project Wizard Tables
-- =====================================================
-- Created: 2025-09-07
-- Purpose: Store project wizard data with relationships
-- =====================================================

-- =====================================================
-- PROJECT STRUCTURES TABLE
-- =====================================================
DROP TABLE IF EXISTS `project_structures`;
CREATE TABLE `project_structures` (
  `StructureID` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key for structure',
  `ProjectID` mediumint(10) unsigned NOT NULL COMMENT 'Foreign key to project table',
  `StructureNumber` varchar(50) NOT NULL COMMENT 'Structure ID or name',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  PRIMARY KEY (`StructureID`),
  KEY `idx_project_structures_project` (`ProjectID`),
  CONSTRAINT `fk_project_structures_project` FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Project structures table';

-- =====================================================
-- PROJECT BOREHOLES TABLE
-- =====================================================
DROP TABLE IF EXISTS `project_boreholes`;
CREATE TABLE `project_boreholes` (
  `BoreholeID` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key for borehole',
  `StructureID` int unsigned NOT NULL COMMENT 'Foreign key to project_structures table',
  `BoreholeNumber` varchar(50) NOT NULL COMMENT 'Borehole ID or number',
  `Latitude` decimal(10,6) DEFAULT NULL COMMENT 'Latitude coordinate',
  `Longitude` decimal(10,6) DEFAULT NULL COMMENT 'Longitude coordinate',
  `Northing` decimal(12,3) DEFAULT NULL COMMENT 'Northing coordinate',
  `Easting` decimal(12,3) DEFAULT NULL COMMENT 'Easting coordinate',
  `GroundSurfaceElevation` decimal(8,2) DEFAULT NULL COMMENT 'Ground surface elevation',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  PRIMARY KEY (`BoreholeID`),
  KEY `idx_project_boreholes_structure` (`StructureID`),
  CONSTRAINT `fk_project_boreholes_structure` FOREIGN KEY (`StructureID`) REFERENCES `project_structures` (`StructureID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Project boreholes table';

-- =====================================================
-- PROJECT SAMPLES TABLE
-- =====================================================
DROP TABLE IF EXISTS `project_samples`;
CREATE TABLE `project_samples` (
  `SampleID` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key for sample',
  `BoreholeID` int unsigned NOT NULL COMMENT 'Foreign key to project_boreholes table',
  `SampleNumber` varchar(50) NOT NULL COMMENT 'Sample ID or number',
  `DepthFrom` decimal(8,2) DEFAULT NULL COMMENT 'Sample depth from',
  `DepthTo` decimal(8,2) DEFAULT NULL COMMENT 'Sample depth to',
  `TL101Number` varchar(50) DEFAULT NULL COMMENT 'TL-101 form number',
  `ContainerType` enum('Tube','Jar') DEFAULT 'Tube' COMMENT 'Sample container type',
  `Quantity` int DEFAULT NULL COMMENT 'Sample quantity',
  `FieldCollectionDate` date DEFAULT NULL COMMENT 'Field collection date',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  PRIMARY KEY (`SampleID`),
  KEY `idx_project_samples_borehole` (`BoreholeID`),
  CONSTRAINT `fk_project_samples_borehole` FOREIGN KEY (`BoreholeID`) REFERENCES `project_boreholes` (`BoreholeID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Project samples table';

-- =====================================================
-- PROJECT TESTS TABLE
-- =====================================================
DROP TABLE IF EXISTS `project_tests`;
CREATE TABLE `project_tests` (
  `TestID` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key for test',
  `SampleID` int unsigned NOT NULL COMMENT 'Foreign key to project_samples table',
  `TestTypeID` tinyint(3) unsigned NOT NULL COMMENT 'Foreign key to test_type table',
  `Status` enum('Requested','In Progress','Completed','Cancelled') DEFAULT 'Requested' COMMENT 'Test status',
  `RequestedDate` date DEFAULT NULL COMMENT 'Date test was requested',
  `CompletedDate` date DEFAULT NULL COMMENT 'Date test was completed',
  `Notes` text DEFAULT NULL COMMENT 'Test notes',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  PRIMARY KEY (`TestID`),
  KEY `idx_project_tests_sample` (`SampleID`),
  KEY `idx_project_tests_test_type` (`TestTypeID`),
  CONSTRAINT `fk_project_tests_sample` FOREIGN KEY (`SampleID`) REFERENCES `project_samples` (`SampleID`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_tests_test_type` FOREIGN KEY (`TestTypeID`) REFERENCES `test_type` (`TestTypeID`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Project tests table';
