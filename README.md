# GLDMS 2025 - Geotechnical Laboratory Data Management System

## Overview
Modernized version of the California Department of Transportation's Geotechnical Laboratory Data Management System (GLDMS), built with React and MySQL, featuring DIGGS compliance and Single Sign-On (SSO) integration.

## Project Structure
```
GLDMS_2025/
├── SQLFILES/
│   └── GLDMS_2025_Complete_Database.sql  # Complete database schema
├── .gitignore                            # Git ignore rules
└── README.md                             # This file
```

## Database Schema
- **29 Tables** in proper dependency order
- **DIGGS Compliant** - All tables mapped to DIGGS schema elements
- **Foreign Key Relationships** properly maintained
- **UTF8MB4 Support** for full Unicode character support

### Table Categories
1. **Core Tables (Level 1)**: `project`, `test_type`, `users`, `audit_log`
2. **Sample Tables (Level 2)**: `sample`, `specimen`
3. **Test Result Tables (Level 3)**: 23 different test tables

## Installation

### Database Setup
1. Open MySQL Workbench
2. Execute the SQL file: `SQLFILES/GLDMS_2025_Complete_Database.sql`
3. Verify all 29 tables are created: `SHOW TABLES;`

### Expected Tables
- `project` - Project information
- `sample` - Sample data
- `specimen` - Specimen information
- `test_type` - Test type definitions
- `moisture_content_test` - Moisture content test results
- `unit_weight_test` - Unit weight test results
- `specific_gravity_test` - Specific gravity test results
- `atterberg_limits_test` - Atterberg limits test results
- And 20 more test result tables...

## DIGGS Compliance
All database fields are mapped to appropriate DIGGS schema elements:
- **Direct Mapping**: Fields that directly correspond to DIGGS elements
- **Custom Properties**: Fields stored as DIGGS `otherProperty` elements
- **System Fields**: Audit trail and metadata fields

## Features
- ✅ DIGGS-compliant database schema
- ✅ Proper foreign key relationships
- ✅ Performance-optimized indexes
- ✅ Audit trail with timestamps
- ✅ UTF8MB4 character support
- 🔄 React frontend (planned)
- 🔄 SSO integration (planned)

## Development Status
- ✅ Database schema complete
- 🔄 Frontend development (in progress)
- 🔄 SSO implementation (planned)
- 🔄 Data migration tools (planned)

## Contributing
This project is part of the California Department of Transportation's modernization efforts.

## License
California Department of Transportation - Internal Use Only
