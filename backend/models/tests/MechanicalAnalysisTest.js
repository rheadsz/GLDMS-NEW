const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MechanicalAnalysisTest = sequelize.define('MechanicalAnalysisTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    CompressionStrength: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    TensileStrength: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    ShearStrength: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    TestDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    TestUser: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    CreatedBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    UpdatedBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  }, {
    tableName: 'mechanical_analysis_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return MechanicalAnalysisTest;
};
