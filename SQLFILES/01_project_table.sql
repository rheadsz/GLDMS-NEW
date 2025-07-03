-- =====================================================
-- GLDMS 2025 - Project Table (DIGGS Compliant)
-- =====================================================
-- This table maps to DIGGS Project element (Kernel.xsd)
-- Created: 2025
-- Purpose: Store project information with DIGGS compliance
-- =====================================================

-- Drop table if exists (for clean installation)
DROP TABLE IF EXISTS `project`;

-- Create project table with DIGGS-compliant structure
CREATE TABLE `project` (
  -- =====================================================
  -- CORE DIGGS ELEMENTS (Direct Mapping)
  -- =====================================================
  
  -- Primary identifier (maps to gml:id)
  `ProjectID` mediumint(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key - maps to DIGGS gml:id',
  
  -- Project name (maps to DIGGS name element)
  `ProjectName` varchar(100) NOT NULL COMMENT 'Project name - maps to DIGGS AbstractNamedFeatureType.name',
  
  -- =====================================================
  -- LOCATION ELEMENTS (maps to DIGGS locality)
  -- =====================================================
  `District` char(2) NOT NULL DEFAULT '' COMMENT 'Caltrans district - maps to DIGGS locality',
  `DistrictLocation` char(2) DEFAULT NULL COMMENT 'District location - maps to DIGGS locality',
  `County` char(3) DEFAULT NULL COMMENT 'County location - maps to DIGGS locality',
  
  -- =====================================================
  -- LINEAR EXTENT ELEMENTS (maps to DIGGS linearExtent)
  -- =====================================================
  `Route` smallint(5) unsigned DEFAULT NULL COMMENT 'Route number - maps to DIGGS linearExtent',
  `PMFrom` varchar(10) DEFAULT NULL COMMENT 'Beginning post mile - maps to DIGGS linearExtent',
  `PMTo` varchar(10) DEFAULT NULL COMMENT 'Ending post mile - maps to DIGGS linearExtent',
  
  -- =====================================================
  -- PROJECT TIMESPAN (maps to DIGGS projectDateTimeSpan)
  -- =====================================================
  `StartedDate` date DEFAULT NULL COMMENT 'Project start date - maps to DIGGS projectDateTimeSpan',
  `EstimatedDeliveryDate` date DEFAULT NULL COMMENT 'Estimated completion - maps to DIGGS projectDateTimeSpan',
  
  -- =====================================================
  -- PROJECT EVENTS (maps to DIGGS projectEvent)
  -- =====================================================
  `RequestedDate` date DEFAULT NULL COMMENT 'Request received - maps to DIGGS projectEvent',
  `ClientDueDate` date DEFAULT NULL COMMENT 'Client due date - maps to DIGGS projectEvent',
  `ApprovedDate` date DEFAULT NULL COMMENT 'Approval date - maps to DIGGS projectEvent',
  `SampledDate` date DEFAULT NULL COMMENT 'Sampling date - maps to DIGGS projectEvent',
  `SampleReceivedDate` date DEFAULT NULL COMMENT 'Sample received - maps to DIGGS projectEvent',
  `ToGradeBenchDate` date DEFAULT NULL COMMENT 'Grade bench submission - maps to DIGGS projectEvent',
  `StaffDueDate` date DEFAULT NULL COMMENT 'Staff due date - maps to DIGGS projectEvent',
  
  -- =====================================================
  -- CUSTOM PROPERTIES (maps to DIGGS otherProjectProperty)
  -- =====================================================
  `GLTrackNumber` varchar(6) NOT NULL DEFAULT '' COMMENT 'GL tracking number - maps to DIGGS otherProjectProperty',
  `EA` varchar(6) NOT NULL DEFAULT '' COMMENT 'Expenditure authorization - maps to DIGGS otherProjectProperty',
  `StructureNumber` varchar(20) DEFAULT NULL COMMENT 'Bridge/Structure number - maps to DIGGS otherProjectProperty',
  `FA` tinyint(3) unsigned DEFAULT NULL COMMENT 'FA charge code - maps to DIGGS otherProjectProperty',
  `ActivityCode` smallint(3) unsigned zerofill DEFAULT '000' COMMENT 'Activity code - maps to DIGGS otherProjectProperty',
  `MSACode` varchar(20) DEFAULT NULL COMMENT 'MSA charge code - maps to DIGGS otherProjectProperty',
  `SubJob` varchar(40) DEFAULT NULL COMMENT 'Subjob code - maps to DIGGS otherProjectProperty',
  `SpecialDesignation` varchar(40) DEFAULT NULL COMMENT 'Special designation - maps to DIGGS otherProjectProperty',
  `T_101Numbers` varchar(200) DEFAULT NULL COMMENT 'TL-101 form numbers - maps to DIGGS otherProjectProperty',
  
  -- =====================================================
  -- CLIENT/CONTRACT INFO (maps to DIGGS contract)
  -- =====================================================
  `ClientOffice` varchar(50) DEFAULT NULL COMMENT 'Client office - maps to DIGGS contract',
  `ClientPhone` varchar(20) DEFAULT NULL COMMENT 'Client phone - maps to DIGGS contract',
  `ClientLastName` varchar(30) DEFAULT NULL COMMENT 'Client last name - maps to DIGGS contract',
  `ClientFirstName` varchar(30) DEFAULT NULL COMMENT 'Client first name - maps to DIGGS contract',
  
  -- =====================================================
  -- SYSTEM FIELDS
  -- =====================================================
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  -- =====================================================
  -- PRIMARY KEY
  -- =====================================================
  PRIMARY KEY (`ProjectID`),
  
  -- =====================================================
  -- INDEXES FOR PERFORMANCE
  -- =====================================================
  INDEX `idx_gl_track_number` (`GLTrackNumber`),
  INDEX `idx_project_name` (`ProjectName`),
  INDEX `idx_district` (`District`),
  INDEX `idx_route` (`Route`),
  INDEX `idx_started_date` (`StartedDate`),
  INDEX `idx_client_due_date` (`ClientDueDate`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Project table - DIGGS compliant mapping to Project element';

-- =====================================================
-- INSERT SAMPLE DATA (Optional - for testing)
-- =====================================================
/*
INSERT INTO `project` (
  `ProjectName`, `GLTrackNumber`, `EA`, `District`, `County`, `Route`, 
  `PMFrom`, `PMTo`, `ClientDueDate`, `RequestedDate`, `StartedDate`
) VALUES (
  'Highway 101 Bridge Rehabilitation', 'GL1234', 'EA5678', '01', '001', 101,
  '10.5', '12.3', '2025-06-30', '2025-01-15', '2025-02-01'
);
*/

-- =====================================================
-- DIGGS MAPPING SUMMARY
-- =====================================================
-- Total Fields: 30
-- Directly DIGGS Compliant: 13 fields
-- Custom Properties: 17 fields (via otherProjectProperty)
-- Contract Properties: 4 fields (via contract element)
-- 
-- DIGGS Elements Mapped:
-- - gml:id → ProjectID
-- - name → ProjectName  
-- - locality → District, DistrictLocation, County
-- - linearExtent → Route, PMFrom, PMTo
-- - projectDateTimeSpan → StartedDate, EstimatedDeliveryDate
-- - projectEvent → Various date fields
-- - contract → Client information fields
-- - otherProjectProperty → Custom fields (GLTrackNumber, EA, etc.)
-- ===================================================== 
