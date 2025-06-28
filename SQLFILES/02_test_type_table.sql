-- =====================================================
-- GLDMS 2025 - Test Type Table (DIGGS Compliant)
-- =====================================================
-- This table maps to DIGGS Test procedure elements (Kernel.xsd)
-- Created: 2025
-- Purpose: Store test type definitions with DIGGS compliance
-- Dependencies: None (can be created after project table)
-- =====================================================

-- Drop table if exists (for clean installation)
DROP TABLE IF EXISTS `test_type`;

-- Create test_type table with DIGGS-compliant structure
CREATE TABLE `test_type` (
  -- =====================================================
  -- CORE DIGGS ELEMENTS (Direct Mapping)
  -- =====================================================
  
  -- Primary identifier (maps to gml:id)
  `TestTypeID` tinyint(3) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary key - maps to DIGGS gml:id',
  
  -- Test name (maps to DIGGS Test procedure name)
  `TestName` varchar(100) NOT NULL DEFAULT '' COMMENT 'Test name - maps to DIGGS Test procedure name',
  
  -- Test abbreviation (maps to DIGGS procedure identifier)
  `Abbreviation` varchar(20) NOT NULL DEFAULT '' COMMENT 'Test abbreviation - maps to DIGGS procedure identifier',
  
  -- =====================================================
  -- PROCEDURE ELEMENTS (maps to DIGGS procedure)
  -- =====================================================
  `Method` varchar(100) DEFAULT NULL COMMENT 'Test method - maps to DIGGS procedure method',
  
  -- =====================================================
  -- CUSTOM PROPERTIES (maps to DIGGS otherProperty)
  -- =====================================================
  `TableName` varchar(50) DEFAULT NULL COMMENT 'Database table name - maps to DIGGS otherProperty',
  
  -- =====================================================
  -- SYSTEM FIELDS
  -- =====================================================
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `CreatedBy` varchar(50) DEFAULT NULL COMMENT 'User who created the record',
  `UpdatedBy` varchar(50) DEFAULT NULL COMMENT 'User who last updated the record',
  
  -- =====================================================
  -- PRIMARY KEY AND CONSTRAINTS
  -- =====================================================
  PRIMARY KEY (`TestTypeID`),
  UNIQUE KEY `uk_abbreviation` (`Abbreviation`),
  
  -- =====================================================
  -- INDEXES FOR PERFORMANCE
  -- =====================================================
  INDEX `idx_test_name` (`TestName`),
  INDEX `idx_table_name` (`TableName`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Test type table - DIGGS compliant mapping to Test procedure elements';

-- =====================================================
-- INSERT DEFAULT TEST TYPES (DIGGS Standard Tests)
-- =====================================================
INSERT INTO `test_type` (`TestName`, `TableName`, `Abbreviation`, `Method`, `CreatedBy`) VALUES
-- Basic Soil Properties
('Moisture Content', 'moisture_content_test', 'MC', 'ASTM D2216', 'System'),
('Unit Weight', 'unit_weight_test', 'UW', 'ASTM D7263', 'System'),
('Specific Gravity', 'specific_gravity_test', 'SG', 'ASTM D854', 'System'),

-- Atterberg Limits
('Atterberg Limits', 'atterberg_limits_test', 'AT', 'ASTM D4318', 'System'),

-- Grain Size Analysis
('Mechanical Analysis', 'mechanical_analysis_test', 'MA', 'ASTM D422', 'System'),

-- Consolidation
('Consolidation', '', 'CD', 'ASTM D2435', 'System'),

-- Swell and Collapse
('Swell Potential', 'swell_potential_test', 'SP', 'ASTM D4546', 'System'),
('Collapse Potential', 'collapse_potential_test', 'CP', 'ASTM D5333', 'System'),

-- Shear Strength
('Direct Shear', 'direct_shear_test', 'DS', 'ASTM D3080', 'System'),
('Triaxial CU', 'triaxial_cu_test', 'TCU', 'ASTM D4767', 'System'),
('Triaxial UU', 'triaxial_uu_test', 'TUU', 'ASTM D2850', 'System'),

-- Compaction
('Compaction Curve', 'compaction_curve_test', 'CC', 'ASTM D698', 'System'),

-- Other Tests
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
-- DIGGS MAPPING SUMMARY
-- =====================================================
-- Total Fields: 8
-- Directly DIGGS Compliant: 4 fields
-- Custom Properties: 1 field (via otherProperty)
-- Procedure Properties: 1 field (via procedure element)
-- 
-- DIGGS Elements Mapped:
-- - gml:id → TestTypeID
-- - procedure name → TestName
-- - procedure identifier → Abbreviation
-- - procedure method → Method
-- - otherProperty → TableName
-- 
-- DIGGS Test Types Supported:
-- - Moisture Content (MC)
-- - Unit Weight (UW)
-- - Specific Gravity (SG)
-- - Atterberg Limits (AT)
-- - Mechanical Analysis (MA)
-- - Consolidation (CD)
-- - Swell Potential (SP)
-- - Collapse Potential (CP)
-- - Direct Shear (DS)
-- - Triaxial CU (TCU)
-- - Triaxial UU (TUU)
-- - Compaction Curve (CC)
-- - Point Load (PL)
-- - Expansion Index (EI)
-- - And 9 additional test types
-- ===================================================== 