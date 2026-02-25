const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env." + (process.env.NODE_ENV || "development")),
});
const { Sequelize } = require('sequelize');

// Database configuration
// create sequelize from strict env (no local fallbacks)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: process.env.DB_DIALECT || "mariadb",
    dialectModule: require("mysql2"),
    logging: false,
    define: {
      timestamps: true,
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt",
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Import models
const Project = require('./Project')(sequelize);
const TestType = require('./TestType')(sequelize);
const Sample = require('./Sample')(sequelize);
const Specimen = require('./Specimen')(sequelize);
const Users = require('./Users')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const ProjectStructures = require('./ProjectStructures')(sequelize);
const ProjectBoreholes = require('./ProjectBoreholes')(sequelize);
const ProjectSamples = require('./ProjectSamples')(sequelize);
const ProjectTests = require('./ProjectTests')(sequelize);
const ProjectRequests = require('./ProjectRequests')(sequelize);
const ProjectChargingCodes = require('./ProjectChargingCodes')(sequelize);

// Test tables
const MoistureContentTest = require('./tests/MoistureContentTest')(sequelize);
const UnitWeightTest = require('./tests/UnitWeightTest')(sequelize);
const SpecificGravityTest = require('./tests/SpecificGravityTest')(sequelize);
const AtterbergLimitsTest = require('./tests/AtterbergLimitsTest')(sequelize);
const MechanicalAnalysisTest = require('./tests/MechanicalAnalysisTest')(sequelize);
const SwellPotentialTest = require('./tests/SwellPotentialTest')(sequelize);
const CollapsePotentialTest = require('./tests/CollapsePotentialTest')(sequelize);
const DirectShearTest = require('./tests/DirectShearTest')(sequelize);
const CompactionCurveTest = require('./tests/CompactionCurveTest')(sequelize);
const PointLoadTest = require('./tests/PointLoadTest')(sequelize);
const ExpansionIndexTest = require('./tests/ExpansionIndexTest')(sequelize);
const TriaxialCuTest = require('./tests/TriaxialCuTest')(sequelize);
const TriaxialUuTest = require('./tests/TriaxialUuTest')(sequelize);
const UnconfinedCompressionTest = require('./tests/UnconfinedCompressionTest')(sequelize);
const ShrinkageLimitTest = require('./tests/ShrinkageLimitTest')(sequelize);
const SandEquivalentTest = require('./tests/SandEquivalentTest')(sequelize);
const RValueTest = require('./tests/RValueTest')(sequelize);
const CorrosionTest = require('./tests/CorrosionTest')(sequelize);
const OrganicContentTest = require('./tests/OrganicContentTest')(sequelize);
const PhTest = require('./tests/PhTest')(sequelize);
const CationExchangeTest = require('./tests/CationExchangeTest')(sequelize);

// Define associations
// Project -> Sample (1:N)
Project.hasMany(Sample, { foreignKey: 'ProjectID', as: 'samples' });
Sample.belongsTo(Project, { foreignKey: 'ProjectID', as: 'project' });

// Sample -> Specimen (1:N)
Sample.hasMany(Specimen, { foreignKey: 'SampleID', as: 'specimens' });
Specimen.belongsTo(Sample, { foreignKey: 'SampleID', as: 'sample' });

// TestType -> Specimen (1:N)
TestType.hasMany(Specimen, { foreignKey: 'TestTypeID', as: 'specimens' });
Specimen.belongsTo(TestType, { foreignKey: 'TestTypeID', as: 'testType' });

// Project -> ProjectRequests (1:N)
Project.hasMany(ProjectRequests, { foreignKey: 'ProjectID', as: 'requests' });
ProjectRequests.belongsTo(Project, { foreignKey: 'ProjectID', as: 'project' });

// ProjectRequests -> ProjectStructures (1:N)
ProjectRequests.hasMany(ProjectStructures, { foreignKey: 'RequestID', as: 'structures' });
ProjectStructures.belongsTo(ProjectRequests, { foreignKey: 'RequestID', as: 'request' });

// Project -> ProjectStructures (1:N)
Project.hasMany(ProjectStructures, { foreignKey: 'ProjectID', as: 'structures' });
ProjectStructures.belongsTo(Project, { foreignKey: 'ProjectID', as: 'project' });

// ProjectStructures -> ProjectBoreholes (1:N)
ProjectStructures.hasMany(ProjectBoreholes, { foreignKey: 'StructureID', as: 'boreholes' });
ProjectBoreholes.belongsTo(ProjectStructures, { foreignKey: 'StructureID', as: 'structure' });

// ProjectBoreholes -> ProjectSamples (1:N)
ProjectBoreholes.hasMany(ProjectSamples, { foreignKey: 'BoreholeID', as: 'samples' });
ProjectSamples.belongsTo(ProjectBoreholes, { foreignKey: 'BoreholeID', as: 'borehole' });

// ProjectSamples -> ProjectTests (1:N)
ProjectSamples.hasMany(ProjectTests, { foreignKey: 'SampleID', as: 'tests' });
ProjectTests.belongsTo(ProjectSamples, { foreignKey: 'SampleID', as: 'sample' });

// TestType -> ProjectTests (1:N)
TestType.hasMany(ProjectTests, { foreignKey: 'TestTypeID', as: 'projectTests' });
ProjectTests.belongsTo(TestType, { foreignKey: 'TestTypeID', as: 'testType' });

// ProjectRequests -> ProjectChargingCodes (1:N)
ProjectRequests.hasMany(ProjectChargingCodes, { foreignKey: 'RequestID', as: 'chargingCodes' });
ProjectChargingCodes.belongsTo(ProjectRequests, { foreignKey: 'RequestID', as: 'request' });

// Specimen -> Test result tables (1:1)
Specimen.hasOne(MoistureContentTest, { foreignKey: 'SpecimenID', as: 'moistureContentTest' });
MoistureContentTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(UnitWeightTest, { foreignKey: 'SpecimenID', as: 'unitWeightTest' });
UnitWeightTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(SpecificGravityTest, { foreignKey: 'SpecimenID', as: 'specificGravityTest' });
SpecificGravityTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(AtterbergLimitsTest, { foreignKey: 'SpecimenID', as: 'atterbergLimitsTest' });
AtterbergLimitsTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(MechanicalAnalysisTest, { foreignKey: 'SpecimenID', as: 'mechanicalAnalysisTest' });
MechanicalAnalysisTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(SwellPotentialTest, { foreignKey: 'SpecimenID', as: 'swellPotentialTest' });
SwellPotentialTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(CollapsePotentialTest, { foreignKey: 'SpecimenID', as: 'collapsePotentialTest' });
CollapsePotentialTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(DirectShearTest, { foreignKey: 'SpecimenID', as: 'directShearTest' });
DirectShearTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(CompactionCurveTest, { foreignKey: 'SpecimenID', as: 'compactionCurveTest' });
CompactionCurveTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(PointLoadTest, { foreignKey: 'SpecimenID', as: 'pointLoadTest' });
PointLoadTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(ExpansionIndexTest, { foreignKey: 'SpecimenID', as: 'expansionIndexTest' });
ExpansionIndexTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(TriaxialCuTest, { foreignKey: 'SpecimenID', as: 'triaxialCuTest' });
TriaxialCuTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(TriaxialUuTest, { foreignKey: 'SpecimenID', as: 'triaxialUuTest' });
TriaxialUuTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(UnconfinedCompressionTest, { foreignKey: 'SpecimenID', as: 'unconfinedCompressionTest' });
UnconfinedCompressionTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(ShrinkageLimitTest, { foreignKey: 'SpecimenID', as: 'shrinkageLimitTest' });
ShrinkageLimitTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(SandEquivalentTest, { foreignKey: 'SpecimenID', as: 'sandEquivalentTest' });
SandEquivalentTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(RValueTest, { foreignKey: 'SpecimenID', as: 'rValueTest' });
RValueTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(CorrosionTest, { foreignKey: 'SpecimenID', as: 'corrosionTest' });
CorrosionTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(OrganicContentTest, { foreignKey: 'SpecimenID', as: 'organicContentTest' });
OrganicContentTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(PhTest, { foreignKey: 'SpecimenID', as: 'phTest' });
PhTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });

Specimen.hasOne(CationExchangeTest, { foreignKey: 'SpecimenID', as: 'cationExchangeTest' });
CationExchangeTest.belongsTo(Specimen, { foreignKey: 'SpecimenID', as: 'specimen' });


//  connection test
(async () => {
  try {
    await sequelize.authenticate();
    console.log(" Connected to DB:", process.env.DB_HOST, "as", process.env.DB_USER);
  } catch (err) {
    console.error(" DB connection error:", err.message);
    // don't process.exit here while developing; in prod you may want to fail-fast
  }
})();




// Export all models and sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  // Core models
  Project,
  TestType,
  Sample,
  Specimen,
  Users,
  AuditLog,
  // Project wizard models
  ProjectStructures,
  ProjectBoreholes,
  ProjectSamples,
  ProjectTests,
  ProjectRequests,
  ProjectChargingCodes,
  // Test result models
  MoistureContentTest,
  UnitWeightTest,
  SpecificGravityTest,
  AtterbergLimitsTest,
  MechanicalAnalysisTest,
  SwellPotentialTest,
  CollapsePotentialTest,
  DirectShearTest,
  CompactionCurveTest,
  PointLoadTest,
  ExpansionIndexTest,
  TriaxialCuTest,
  TriaxialUuTest,
  UnconfinedCompressionTest,
  ShrinkageLimitTest,
  SandEquivalentTest,
  RValueTest,
  CorrosionTest,
  OrganicContentTest,
  PhTest,
  CationExchangeTest,
};
