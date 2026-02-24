const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CompactionCurveTest = sequelize.define('CompactionCurveTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    DryDensity: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    WaterContent: {
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
    tableName: 'compaction_curve_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return CompactionCurveTest;
};
