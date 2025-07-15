CREATE DATABASE IF NOT EXISTS `gldms_2025` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gldms_2025`;

-- =====================================================
-- GLDMS 2025 - Complete Database Schema (DIGGS Compliant)
-- =====================================================
-- This file contains all 29 tables in proper dependency order
-- Created: 2025
-- Purpose: Complete GLDMS database with DIGGS compliance
-- =====================================================

-- Set character set and collation
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABLE 1: PROJECT TABLE
-- =====================================================
-- Dependencies: None (Level 1)
-- Maps to: DIGGS Project element (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `project`;
CREATE TABLE `project` (
  -- CORE DIGGS ELEMENTS (Direct Mapping)
  `ProjectID` mediumint(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key - maps to DIGGS gml:id',
  `ProjectName` varchar(100) NOT NULL COMMENT 'Project name - maps to DIGGS AbstractNamedFeatureType.name',
  
  -- LOCATION ELEMENTS (maps to DIGGS locality)
  `District` char(2) NOT NULL DEFAULT '' COMMENT 'Caltrans district - maps to DIGGS locality',
  `DistrictLocation` char(2) DEFAULT NULL COMMENT 'District location - maps to DIGGS locality',
  `County` char(3) DEFAULT NULL COMMENT 'County location - maps to DIGGS locality',
  
  -- LINEAR EXTENT ELEMENTS (maps to DIGGS linearExtent)
  `Route` smallint(5) unsigned DEFAULT NULL COMMENT 'Route number - maps to DIGGS linearExtent',
  `PMFrom` varchar(10) DEFAULT NULL COMMENT 'Beginning post mile - maps to DIGGS linearExtent',
  `PMTo` varchar(10) DEFAULT NULL COMMENT 'Ending post mile - maps to DIGGS linearExtent',
  
  -- PROJECT TIMESPAN (maps to DIGGS projectDateTimeSpan)
  `StartedDate` date DEFAULT NULL COMMENT 'Project start date - maps to DIGGS projectDateTimeSpan',
  `EstimatedDeliveryDate` date DEFAULT NULL COMMENT 'Estimated completion - maps to DIGGS projectDateTimeSpan',
  
  -- PROJECT EVENTS (maps to DIGGS projectEvent)
  `RequestedDate` date DEFAULT NULL COMMENT 'Request received - maps to DIGGS projectEvent',
  `ClientDueDate` date DEFAULT NULL COMMENT 'Client due date - maps to DIGGS projectEvent',
  `ApprovedDate` date DEFAULT NULL COMMENT 'Approval date - maps to DIGGS projectEvent',
  `SampledDate` date DEFAULT NULL COMMENT 'Sampling date - maps to DIGGS projectEvent',
  `SampleReceivedDate` date DEFAULT NULL COMMENT 'Sample received - maps to DIGGS projectEvent',
  `ToGradeBenchDate` date DEFAULT NULL COMMENT 'Grade bench submission - maps to DIGGS projectEvent',
  `StaffDueDate` date DEFAULT NULL COMMENT 'Staff due date - maps to DIGGS projectEvent',
  
  -- CUSTOM PROPERTIES (maps to DIGGS otherProjectProperty)
  `GLTrackNumber` varchar(6) NOT NULL DEFAULT '' COMMENT 'GL tracking number - maps to DIGGS otherProjectProperty',
  `EA` varchar(6) NOT NULL DEFAULT '' COMMENT 'Expenditure authorization - maps to DIGGS otherProjectProperty',
  `StructureNumber` varchar(20) DEFAULT NULL COMMENT 'Bridge/Structure number - maps to DIGGS otherProjectProperty',
  `FA` tinyint(3) unsigned DEFAULT NULL COMMENT 'FA charge code - maps to DIGGS otherProjectProperty',
  `ActivityCode` smallint(3) unsigned zerofill DEFAULT '000' COMMENT 'Activity code - maps to DIGGS otherProjectProperty',
  `MSACode` varchar(20) DEFAULT NULL COMMENT 'MSA charge code - maps to DIGGS otherProjectProperty',
  `SubJob` varchar(40) DEFAULT NULL COMMENT 'Subjob code - maps to DIGGS otherProjectProperty',
  `SpecialDesignation` varchar(40) DEFAULT NULL COMMENT 'Special designation - maps to DIGGS otherProjectProperty',
  `T_101Numbers` varchar(200) DEFAULT NULL COMMENT 'TL-101 form numbers - maps to DIGGS otherProjectProperty',
  
  -- CLIENT/CONTRACT INFO (maps to DIGGS contract)
  `ClientOffice` varchar(50) DEFAULT NULL COMMENT 'Client office - maps to DIGGS contract',
  `ClientPhone` varchar(20) DEFAULT NULL COMMENT 'Client phone - maps to DIGGS contract',
  `ClientLastName` varchar(30) DEFAULT NULL COMMENT 'Client last name - maps to DIGGS contract',
  `ClientFirstName` varchar(30) DEFAULT NULL COMMENT 'Client first name - maps to DIGGS contract',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`ProjectID`),
  INDEX `idx_gl_track_number` (`GLTrackNumber`),
  INDEX `idx_project_name` (`ProjectName`),
  INDEX `idx_district` (`District`),
  INDEX `idx_route` (`Route`),
  INDEX `idx_started_date` (`StartedDate`),
  INDEX `idx_client_due_date` (`ClientDueDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Project table - DIGGS compliant mapping to Project element';

-- =====================================================
-- TABLE 2: TEST_TYPE TABLE
-- =====================================================
-- Dependencies: None (Level 1)
-- Maps to: DIGGS Test procedure elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `test_type`;
CREATE TABLE `test_type` (
  -- CORE DIGGS ELEMENTS (Direct Mapping)
  `TestTypeID` tinyint(3) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key - maps to DIGGS gml:id',
  `TestName` varchar(100) NOT NULL DEFAULT '' COMMENT 'Test name - maps to DIGGS Test procedure name',
  `Abbreviation` varchar(20) NOT NULL DEFAULT '' COMMENT 'Test abbreviation - maps to DIGGS procedure identifier',
  
  -- PROCEDURE ELEMENTS (maps to DIGGS procedure)
  `Method` varchar(100) DEFAULT NULL COMMENT 'Test method - maps to DIGGS procedure method',
  
  -- CUSTOM PROPERTIES (maps to DIGGS otherProperty)
  `TableName` varchar(50) DEFAULT NULL COMMENT 'Database table name - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`TestTypeID`),
  UNIQUE KEY `uk_abbreviation` (`Abbreviation`),
  INDEX `idx_test_name` (`TestName`),
  INDEX `idx_table_name` (`TableName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Test type table - DIGGS compliant mapping to Test procedure elements';

-- =====================================================
-- INSERT DEFAULT TEST TYPES
-- =====================================================
INSERT INTO `test_type` (`TestName`, `TableName`, `Abbreviation`, `Method`, `CreatedBy`) VALUES
('Moisture Content', 'moisture_content_test', 'MC', 'ASTM D2216', 'System'),
('Unit Weight', 'unit_weight_test', 'UW', 'ASTM D7263', 'System'),
('Specific Gravity', 'specific_gravity_test', 'SG', 'ASTM D854', 'System'),
('Atterberg Limits', 'atterberg_limits_test', 'AT', 'ASTM D4318', 'System'),
('Mechanical Analysis', 'mechanical_analysis_test', 'MA', 'ASTM D422', 'System'),
('Consolidation', '', 'CD', 'ASTM D2435', 'System'),
('Swell Potential', 'swell_potential_test', 'SP', 'ASTM D4546', 'System'),
('Collapse Potential', 'collapse_potential_test', 'CP', 'ASTM D5333', 'System'),
('Direct Shear', 'direct_shear_test', 'DS', 'ASTM D3080', 'System'),
('Triaxial CU', 'triaxial_cu_test', 'TCU', 'ASTM D4767', 'System'),
('Triaxial UU', 'triaxial_uu_test', 'TUU', 'ASTM D2850', 'System'),
('Compaction Curve', 'compaction_curve_test', 'CC', 'ASTM D698', 'System'),
('Permeability', '', 'PE', 'ASTM D2434', 'System'),
('Unconfined Compression', '', 'UC', 'ASTM D2166', 'System'),
('Point Load', 'point_load_test', 'PL', 'ASTM D5731', 'System'),
('Expansion Index', 'expansion_index_test', 'EI', 'ASTM D4829', 'System'),
('Shrinkage Limit', '', 'SL', 'ASTM D427', 'System'),
('Sand Equivalent', '', 'SE', 'ASTM D2419', 'System'),
('R-Value', '', 'RV', 'AASHTO T190', 'System'),
('Corrosion', '', 'CO', 'ASTM G51', 'System'),
('Organic Content', '', 'OC', 'ASTM D2974', 'System'),
('PH', '', 'PH', 'ASTM D4972', 'System'),
('Cation Exchange', '', 'CE', 'ASTM D7503', 'System');

-- =====================================================
-- TABLE 3: SAMPLE TABLE
-- =====================================================
-- Dependencies: project (Level 2)
-- Maps to: DIGGS Sample element (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `sample`;
CREATE TABLE `sample` (
  -- CORE DIGGS ELEMENTS (Direct Mapping)
  `SampleID` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key - maps to DIGGS gml:id',
  `SampleName` varchar(50) NOT NULL DEFAULT '' COMMENT 'Sample name - maps to DIGGS AbstractNamedFeatureType.name',
  
  -- FOREIGN KEY RELATIONSHIPS
  `ProjectID` mediumint(10) unsigned NOT NULL COMMENT 'Foreign key to project table',
  
  -- LOCATION ELEMENTS (maps to DIGGS locality)
  `SampleLocation` varchar(100) DEFAULT NULL COMMENT 'Sample location - maps to DIGGS locality',
  `Elevation` decimal(8,2) DEFAULT NULL COMMENT 'Sample elevation - maps to DIGGS location elevation',
  
  -- SAMPLING ELEMENTS (maps to DIGGS samplingFeature)
  `SampleDate` date DEFAULT NULL COMMENT 'Date sample was taken - maps to DIGGS samplingTime',
  `SampleDepth` decimal(6,2) DEFAULT NULL COMMENT 'Depth of sample - maps to DIGGS location depth',
  `SampleType` varchar(30) DEFAULT NULL COMMENT 'Type of sample - maps to DIGGS samplingFeature type',
  
  -- CUSTOM PROPERTIES (maps to DIGGS otherProperty)
  `SampleNumber` varchar(20) DEFAULT NULL COMMENT 'Sample number - maps to DIGGS otherProperty',
  `BoringNumber` varchar(20) DEFAULT NULL COMMENT 'Boring number - maps to DIGGS otherProperty',
  `SampleDescription` text COMMENT 'Sample description - maps to DIGGS otherProperty',
  `SampleCondition` varchar(50) DEFAULT NULL COMMENT 'Sample condition - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SampleID`),
  FOREIGN KEY (`ProjectID`) REFERENCES `project` (`ProjectID`) ON DELETE CASCADE,
  INDEX `idx_project_id` (`ProjectID`),
  INDEX `idx_sample_name` (`SampleName`),
  INDEX `idx_sample_date` (`SampleDate`),
  INDEX `idx_sample_number` (`SampleNumber`),
  INDEX `idx_boring_number` (`BoringNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Sample table - DIGGS compliant mapping to Sample element';

-- =====================================================
-- TABLE 4: SPECIMEN TABLE
-- =====================================================
-- Dependencies: sample, test_type (Level 2)
-- Maps to: DIGGS Specimen element (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `specimen`;
CREATE TABLE `specimen` (
  -- CORE DIGGS ELEMENTS (Direct Mapping)
  `SpecimenID` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key - maps to DIGGS gml:id',
  `SpecimenName` varchar(50) NOT NULL DEFAULT '' COMMENT 'Specimen name - maps to DIGGS AbstractNamedFeatureType.name',
  
  -- FOREIGN KEY RELATIONSHIPS
  `SampleID` int(10) unsigned NOT NULL COMMENT 'Foreign key to sample table',
  `TestTypeID` tinyint(3) unsigned NOT NULL COMMENT 'Foreign key to test_type table',
  
  -- SPECIMEN ELEMENTS (maps to DIGGS specimen)
  `SpecimenNumber` varchar(20) DEFAULT NULL COMMENT 'Specimen number - maps to DIGGS specimen identifier',
  `SpecimenType` varchar(30) DEFAULT NULL COMMENT 'Type of specimen - maps to DIGGS specimen type',
  `SpecimenCondition` varchar(50) DEFAULT NULL COMMENT 'Condition of specimen - maps to DIGGS specimen condition',
  `SpecimenDescription` text COMMENT 'Description of specimen - maps to DIGGS specimen description',
  
  -- PREPARATION ELEMENTS (maps to DIGGS preparation)
  `PreparationDate` date DEFAULT NULL COMMENT 'Date specimen was prepared - maps to DIGGS preparation time',
  `PreparationMethod` varchar(100) DEFAULT NULL COMMENT 'Method of preparation - maps to DIGGS preparation method',
  `PreparationNotes` text COMMENT 'Notes about preparation - maps to DIGGS preparation notes',
  
  -- CUSTOM PROPERTIES (maps to DIGGS otherProperty)
  `SpecimenWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of specimen - maps to DIGGS otherProperty',
  `SpecimenDimensions` varchar(50) DEFAULT NULL COMMENT 'Dimensions of specimen - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SampleID`) REFERENCES `sample` (`SampleID`) ON DELETE CASCADE,
  FOREIGN KEY (`TestTypeID`) REFERENCES `test_type` (`TestTypeID`),
  INDEX `idx_sample_id` (`SampleID`),
  INDEX `idx_test_type_id` (`TestTypeID`),
  INDEX `idx_specimen_name` (`SpecimenName`),
  INDEX `idx_specimen_number` (`SpecimenNumber`),
  INDEX `idx_preparation_date` (`PreparationDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Specimen table - DIGGS compliant mapping to Specimen element';

-- =====================================================
-- TABLE 5: MOISTURE_CONTENT_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `moisture_content_test`;
CREATE TABLE `moisture_content_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `WetAndTareWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of wet specimen and container (g) - maps to DIGGS measurement',
  `TareWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of container (g) - maps to DIGGS measurement',
  `DryAndTareWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of dried specimen and container (g) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `MoistureGram` decimal(8,3) DEFAULT NULL COMMENT 'Calculated water content (g) - maps to DIGGS result',
  `MoisturePercentage` decimal(6,3) DEFAULT NULL COMMENT 'Calculated water content (%) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `WetAndTareWeightDate` date DEFAULT NULL COMMENT 'Date wet weight was entered - maps to DIGGS testEvent',
  `TareWeightDate` date DEFAULT NULL COMMENT 'Date tare weight was entered - maps to DIGGS testEvent',
  `DryAndTareWeightDate` date DEFAULT NULL COMMENT 'Date dry weight was entered - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `WetAndTareWeightUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who entered wet weight - maps to DIGGS otherProperty',
  `TareWeightUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who entered tare weight - maps to DIGGS otherProperty',
  `DryAndTareWeightUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who entered dry weight - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_wet_weight_date` (`WetAndTareWeightDate`),
  INDEX `idx_dry_weight_date` (`DryAndTareWeightDate`),
  INDEX `idx_moisture_percentage` (`MoisturePercentage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Moisture content test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 6: UNIT_WEIGHT_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `unit_weight_test`;
CREATE TABLE `unit_weight_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `WetWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of wet specimen (g) - maps to DIGGS measurement',
  `DryWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of dry specimen (g) - maps to DIGGS measurement',
  `Volume` decimal(8,3) DEFAULT NULL COMMENT 'Volume of specimen (cm³) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `WetUnitWeight` decimal(6,3) DEFAULT NULL COMMENT 'Wet unit weight (pcf) - maps to DIGGS result',
  `DryUnitWeight` decimal(6,3) DEFAULT NULL COMMENT 'Dry unit weight (pcf) - maps to DIGGS result',
  `MoistureContent` decimal(6,3) DEFAULT NULL COMMENT 'Moisture content (%) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_wet_unit_weight` (`WetUnitWeight`),
  INDEX `idx_dry_unit_weight` (`DryUnitWeight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Unit weight test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 7: SPECIFIC_GRAVITY_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `specific_gravity_test`;
CREATE TABLE `specific_gravity_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `PycnometerWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of pycnometer (g) - maps to DIGGS measurement',
  `PycnometerWaterWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of pycnometer + water (g) - maps to DIGGS measurement',
  `PycnometerSoilWaterWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of pycnometer + soil + water (g) - maps to DIGGS measurement',
  `SoilWeight` decimal(8,3) DEFAULT NULL COMMENT 'Weight of soil (g) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `SpecificGravity` decimal(5,3) DEFAULT NULL COMMENT 'Specific gravity - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_specific_gravity` (`SpecificGravity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Specific gravity test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 8: ATTERBERG_LIMITS_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `atterberg_limits_test`;
CREATE TABLE `atterberg_limits_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- LIQUID LIMIT MEASUREMENTS (maps to DIGGS measurement)
  `LiquidLimitWeight1` decimal(8,3) DEFAULT NULL COMMENT 'Liquid limit weight 1 (g) - maps to DIGGS measurement',
  `LiquidLimitWeight2` decimal(8,3) DEFAULT NULL COMMENT 'Liquid limit weight 2 (g) - maps to DIGGS measurement',
  `LiquidLimitWeight3` decimal(8,3) DEFAULT NULL COMMENT 'Liquid limit weight 3 (g) - maps to DIGGS measurement',
  `LiquidLimitWeight4` decimal(8,3) DEFAULT NULL COMMENT 'Liquid limit weight 4 (g) - maps to DIGGS measurement',
  `LiquidLimitBlows1` int(11) DEFAULT NULL COMMENT 'Liquid limit blows 1 - maps to DIGGS measurement',
  `LiquidLimitBlows2` int(11) DEFAULT NULL COMMENT 'Liquid limit blows 2 - maps to DIGGS measurement',
  `LiquidLimitBlows3` int(11) DEFAULT NULL COMMENT 'Liquid limit blows 3 - maps to DIGGS measurement',
  `LiquidLimitBlows4` int(11) DEFAULT NULL COMMENT 'Liquid limit blows 4 - maps to DIGGS measurement',
  
  -- PLASTIC LIMIT MEASUREMENTS (maps to DIGGS measurement)
  `PlasticLimitWeight1` decimal(8,3) DEFAULT NULL COMMENT 'Plastic limit weight 1 (g) - maps to DIGGS measurement',
  `PlasticLimitWeight2` decimal(8,3) DEFAULT NULL COMMENT 'Plastic limit weight 2 (g) - maps to DIGGS measurement',
  `PlasticLimitWeight3` decimal(8,3) DEFAULT NULL COMMENT 'Plastic limit weight 3 (g) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `LiquidLimit` decimal(5,2) DEFAULT NULL COMMENT 'Liquid limit (%) - maps to DIGGS result',
  `PlasticLimit` decimal(5,2) DEFAULT NULL COMMENT 'Plastic limit (%) - maps to DIGGS result',
  `PlasticityIndex` decimal(5,2) DEFAULT NULL COMMENT 'Plasticity index (%) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_liquid_limit` (`LiquidLimit`),
  INDEX `idx_plastic_limit` (`PlasticLimit`),
  INDEX `idx_plasticity_index` (`PlasticityIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Atterberg limits test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 9: MECHANICAL_ANALYSIS_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `mechanical_analysis_test`;
CREATE TABLE `mechanical_analysis_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `CompressionStrength` decimal(8,3) DEFAULT NULL COMMENT 'Compression strength (psi) - maps to DIGGS measurement',
  `TensileStrength` decimal(8,3) DEFAULT NULL COMMENT 'Tensile strength (psi) - maps to DIGGS measurement',
  `ShearStrength` decimal(8,3) DEFAULT NULL COMMENT 'Shear strength (psi) - maps to DIGGS measurement',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_compression_strength` (`CompressionStrength`),
  INDEX `idx_tensile_strength` (`TensileStrength`),
  INDEX `idx_shear_strength` (`ShearStrength`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Mechanical analysis test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 10: SWELL_POTENTIAL_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `swell_potential_test`;
CREATE TABLE `swell_potential_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `InitialVolume` decimal(8,3) DEFAULT NULL COMMENT 'Initial volume (cm³) - maps to DIGGS measurement',
  `SwellVolume` decimal(8,3) DEFAULT NULL COMMENT 'Swell volume (cm³) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `SwellRatio` decimal(5,3) DEFAULT NULL COMMENT 'Swell ratio - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_swell_ratio` (`SwellRatio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Swell potential test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 11: COLLAPSE_POTENTIAL_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `collapse_potential_test`;
CREATE TABLE `collapse_potential_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `InitialVolume` decimal(8,3) DEFAULT NULL COMMENT 'Initial volume (cm³) - maps to DIGGS measurement',
  `CollapseVolume` decimal(8,3) DEFAULT NULL COMMENT 'Collapse volume (cm³) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `CollapseRatio` decimal(5,3) DEFAULT NULL COMMENT 'Collapse ratio - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_collapse_ratio` (`CollapseRatio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Collapse potential test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 12: DIRECT_SHEAR_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `direct_shear_test`;
CREATE TABLE `direct_shear_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `NormalStress` decimal(8,3) DEFAULT NULL COMMENT 'Normal stress (psi) - maps to DIGGS measurement',
  `ShearStress` decimal(8,3) DEFAULT NULL COMMENT 'Shear stress (psi) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `ShearStrength` decimal(8,3) DEFAULT NULL COMMENT 'Shear strength (psi) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_shear_strength` (`ShearStrength`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Direct shear test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 13: COMPACTION_CURVE_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `compaction_curve_test`;
CREATE TABLE `compaction_curve_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `DryDensity` decimal(8,3) DEFAULT NULL COMMENT 'Dry density (g/cm³) - maps to DIGGS measurement',
  `WaterContent` decimal(8,3) DEFAULT NULL COMMENT 'Water content (%) - maps to DIGGS measurement',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_dry_density` (`DryDensity`),
  INDEX `idx_water_content` (`WaterContent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Compaction curve test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 14: POINT_LOAD_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `point_load_test`;
CREATE TABLE `point_load_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `Load` decimal(8,3) DEFAULT NULL COMMENT 'Load (N) - maps to DIGGS measurement',
  `Diameter` decimal(8,3) DEFAULT NULL COMMENT 'Diameter (mm) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `UnconfinedStrength` decimal(8,3) DEFAULT NULL COMMENT 'Unconfined strength (MPa) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_unconfined_strength` (`UnconfinedStrength`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Point load test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 15: EXPANSION_INDEX_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `expansion_index_test`;
CREATE TABLE `expansion_index_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `InitialVolume` decimal(8,3) DEFAULT NULL COMMENT 'Initial volume (cm³) - maps to DIGGS measurement',
  `ExpandedVolume` decimal(8,3) DEFAULT NULL COMMENT 'Expanded volume (cm³) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `ExpansionIndex` decimal(5,2) DEFAULT NULL COMMENT 'Expansion index (%) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_expansion_index` (`ExpansionIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Expansion index test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 16: TRIALAXIAL_CU_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `triaxial_cu_test`;
CREATE TABLE `triaxial_cu_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `NormalStress` decimal(8,3) DEFAULT NULL COMMENT 'Normal stress (psi) - maps to DIGGS measurement',
  `ShearStress` decimal(8,3) DEFAULT NULL COMMENT 'Shear stress (psi) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `ShearStrength` decimal(8,3) DEFAULT NULL COMMENT 'Shear strength (psi) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_shear_strength` (`ShearStrength`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Triaxial CU test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 17: TRIALAXIAL_UU_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `triaxial_uu_test`;
CREATE TABLE `triaxial_uu_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `NormalStress` decimal(8,3) DEFAULT NULL COMMENT 'Normal stress (psi) - maps to DIGGS measurement',
  `ShearStress` decimal(8,3) DEFAULT NULL COMMENT 'Shear stress (psi) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `ShearStrength` decimal(8,3) DEFAULT NULL COMMENT 'Shear strength (psi) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_shear_strength` (`ShearStrength`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Triaxial UU test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 18: CONSOLIDATION_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `consolidation_test`;
CREATE TABLE `consolidation_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `VoidRatio` decimal(8,3) DEFAULT NULL COMMENT 'Void ratio - maps to DIGGS measurement',
  `Pressure` decimal(8,3) DEFAULT NULL COMMENT 'Pressure (kPa) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `Settlement` decimal(8,3) DEFAULT NULL COMMENT 'Settlement (mm) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_settlement` (`Settlement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Consolidation test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 19: PERMEABILITY_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `permeability_test`;
CREATE TABLE `permeability_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `FlowRate` decimal(8,3) DEFAULT NULL COMMENT 'Flow rate (cm³/s) - maps to DIGGS measurement',
  `PressureGradient` decimal(8,3) DEFAULT NULL COMMENT 'Pressure gradient (kPa/cm) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `Permeability` decimal(8,3) DEFAULT NULL COMMENT 'Permeability (cm²) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_permeability` (`Permeability`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Permeability test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 20: UNCONFINED_COMPRESSION_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `unconfined_compression_test`;
CREATE TABLE `unconfined_compression_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `NormalStress` decimal(8,3) DEFAULT NULL COMMENT 'Normal stress (psi) - maps to DIGGS measurement',
  `ShearStress` decimal(8,3) DEFAULT NULL COMMENT 'Shear stress (psi) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `UnconfinedStrength` decimal(8,3) DEFAULT NULL COMMENT 'Unconfined strength (psi) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_unconfined_strength` (`UnconfinedStrength`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Unconfined compression test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 21: SHRINKAGE_LIMIT_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `shrinkage_limit_test`;
CREATE TABLE `shrinkage_limit_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `InitialVolume` decimal(8,3) DEFAULT NULL COMMENT 'Initial volume (cm³) - maps to DIGGS measurement',
  `FinalVolume` decimal(8,3) DEFAULT NULL COMMENT 'Final volume (cm³) - maps to DIGGS measurement',
  
  -- CALCULATED RESULTS (maps to DIGGS result)
  `Shrinkage` decimal(5,2) DEFAULT NULL COMMENT 'Shrinkage (%) - maps to DIGGS result',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_shrinkage` (`Shrinkage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Shrinkage limit test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 22: SAND_EQUIVALENT_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `sand_equivalent_test`;
CREATE TABLE `sand_equivalent_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `SandEquivalent` decimal(8,3) DEFAULT NULL COMMENT 'Sand equivalent (%) - maps to DIGGS measurement',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_sand_equivalent` (`SandEquivalent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Sand equivalent test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 23: R_VALUE_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `r_value_test`;
CREATE TABLE `r_value_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `RValue` decimal(8,3) DEFAULT NULL COMMENT 'R value - maps to DIGGS measurement',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_r_value` (`RValue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='R value test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 24: CORROSION_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `corrosion_test`;
CREATE TABLE `corrosion_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `CorrosionDepth` decimal(8,3) DEFAULT NULL COMMENT 'Corrosion depth (mm) - maps to DIGGS measurement',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_corrosion_depth` (`CorrosionDepth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Corrosion test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 25: ORGANIC_CONTENT_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `organic_content_test`;
CREATE TABLE `organic_content_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `OrganicContent` decimal(8,3) DEFAULT NULL COMMENT 'Organic content (%) - maps to DIGGS measurement',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_organic_content` (`OrganicContent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Organic content test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 26: PH_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `ph_test`;
CREATE TABLE `ph_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `PH` decimal(8,3) DEFAULT NULL COMMENT 'pH - maps to DIGGS measurement',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_ph` (`PH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='pH test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 27: CATION_EXCHANGE_TEST TABLE
-- =====================================================
-- Dependencies: specimen (Level 3)
-- Maps to: DIGGS Test result elements (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `cation_exchange_test`;
CREATE TABLE `cation_exchange_test` (
  -- FOREIGN KEY RELATIONSHIPS
  `SpecimenID` int(10) unsigned NOT NULL COMMENT 'Foreign key to specimen table',
  
  -- TEST MEASUREMENTS (maps to DIGGS measurement)
  `CationExchange` decimal(8,3) DEFAULT NULL COMMENT 'Cation exchange capacity (mmol/kg) - maps to DIGGS measurement',
  
  -- TEST EVENTS (maps to DIGGS testEvent)
  `TestDate` date DEFAULT NULL COMMENT 'Date test was performed - maps to DIGGS testEvent',
  
  -- USER TRACKING (maps to DIGGS otherProperty)
  `TestUser` tinyint(3) unsigned DEFAULT NULL COMMENT 'User who performed test - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`SpecimenID`),
  FOREIGN KEY (`SpecimenID`) REFERENCES `specimen` (`SpecimenID`) ON DELETE CASCADE,
  INDEX `idx_test_date` (`TestDate`),
  INDEX `idx_cation_exchange` (`CationExchange`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Cation exchange test table - DIGGS compliant mapping to Test result elements';

-- =====================================================
-- TABLE 28: USERS TABLE
-- =====================================================
-- Dependencies: None (Level 1)
-- Maps to: DIGGS User element (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  -- CORE DIGGS ELEMENTS (Direct Mapping)
  `UserID` mediumint(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key - maps to DIGGS gml:id',
  `UserName` varchar(50) NOT NULL COMMENT 'User name - maps to DIGGS AbstractNamedFeatureType.name',
  
  -- CUSTOM PROPERTIES (maps to DIGGS otherProperty)
  `UserType` varchar(50) DEFAULT NULL COMMENT 'User type - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`UserID`),
  INDEX `idx_user_name` (`UserName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Users table - DIGGS compliant mapping to User element';

-- =====================================================
-- TABLE 29: AUDIT_LOG TABLE
-- =====================================================
-- Dependencies: None (Level 1)
-- Maps to: DIGGS AuditLog element (Kernel.xsd)
-- =====================================================

DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  -- CORE DIGGS ELEMENTS (Direct Mapping)
  `AuditLogID` mediumint(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key - maps to DIGGS gml:id',
  `AuditLogName` varchar(100) NOT NULL COMMENT 'Audit log name - maps to DIGGS AbstractNamedFeatureType.name',
  
  -- CUSTOM PROPERTIES (maps to DIGGS otherProperty)
  `AuditLogDescription` text COMMENT 'Audit log description - maps to DIGGS otherProperty',
  
  -- SYSTEM FIELDS
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  PRIMARY KEY (`AuditLogID`),
  INDEX `idx_audit_log_name` (`AuditLogName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Audit log table - DIGGS compliant mapping to AuditLog element';

SET FOREIGN_KEY_CHECKS = 1; 

SHOW TABLES;

select * from test_type;
use GLDMS_2025;
SELECT TestName, Method FROM test_type;
ALTER TABLE users
ADD COLUMN Password VARCHAR(255) NOT NULL AFTER UserType;
INSERT INTO users (
    UserName,
    UserType,
    Password,
    CreatedBy,
    UpdatedBy
) VALUES
    ('Rhea', 'staff', 'gldmstaff', 'system', 'system'),
    ('supervisor1', 'supervisor', 'supervisorpassword', 'system', 'system');
    
select * from users;

INSERT INTO test_type (TestName, Method, Abbreviation)
VALUES
  ('Particle Size Analysis', 'ASTM D422', 'PSA'),
  ('Plasticity Index', 'ASTM D4318', 'PI'),
  ('Specific Gravity', 'AASHTO T100', 'SG-T100'),
  ('Compaction', 'CTM 216', 'CC-216'),
  ('Unconfined Compression (Rock)', 'ASTM D7012-C', 'UCR'),
  ('Hydraulic Conductivity', 'ASTM D2434', 'HC'),
  ('Corrosion', 'CTM 643,417,422', 'CO-CTM');
  
SELECT TestName, Abbreviation FROM test_type;


CREATE TABLE test_request (
  RequestID INT AUTO_INCREMENT PRIMARY KEY,
  Office VARCHAR(100),
  Branch VARCHAR(100),
  RequesterName VARCHAR(100),
  RequesterEmail VARCHAR(100),
  RequesterPhone VARCHAR(50),
  SupervisorName VARCHAR(100),
  SupervisorEmail VARCHAR(100),
  SupervisorPhone VARCHAR(50),
  TestResultsDueDate DATE,
  DateOfRequest DATE,
  ProjectID VARCHAR(50),         -- EFIS
  EA VARCHAR(20),
  StructureNo VARCHAR(50),
  District VARCHAR(20),
  County VARCHAR(50),
  Route VARCHAR(20),
  PM VARCHAR(20),
  ProjectComponent VARCHAR(100),
  ChargingProjectID VARCHAR(50),
  ChargingUnit VARCHAR(20),
  ReportingCode VARCHAR(50),
  Phase VARCHAR(20),
  SubObject VARCHAR(20),
  Activity VARCHAR(50),
  SubActivity VARCHAR(50),
  NumSamples INT,
  ExpectedSampleReceiptDate DATE,
  Comments TEXT,
  Status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE test_request_details (
  DetailID INT AUTO_INCREMENT PRIMARY KEY,
  RequestID INT,
  SampleNumber INT,
  BoreholeID VARCHAR(50),
  DepthFrom VARCHAR(20),
  DepthTo VARCHAR(20),
  TL101No VARCHAR(50),
  TubeJar VARCHAR(50),
  Quantity INT,
  FieldCollectionDate DATE,
  TestTypeID TINYINT UNSIGNED,  -- Must match test_type table!
  SameAsSampleNo INT,
  Comments TEXT,
  FOREIGN KEY (RequestID) REFERENCES test_request(RequestID),
  FOREIGN KEY (TestTypeID) REFERENCES test_type(TestTypeID)
);
select * from test_request;
select * from test_request_details;

--changes made on jul 15 2025
--since I already had 2 users in the db i didnt want to specify not null constraints as that would throw an error
ALTER TABLE users
   ADD COLUMN Email VARCHAR(100),
   ADD COLUMN Phone VARCHAR(20);
   
--update existing users
UPDATE users SET Email='Rhea.Dsouza@dot.ca.gov', Phone='6695884446' WHERE UserID=1;
UPDATE users SET Email='defivitals@gmail.com', Phone='9162891703' WHERE UserID=2;
   
--add not null constraint on email and phone
ALTER TABLE users
   MODIFY COLUMN Email VARCHAR(100) NOT NULL,
   MODIFY COLUMN Phone VARCHAR(20) NOT NULL;
   