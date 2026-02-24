const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ShrinkageLimitTest = sequelize.define('ShrinkageLimitTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    InitialVolume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    FinalVolume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    Shrinkage: {
      type: DataTypes.DECIMAL(5, 2),
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
    tableName: 'shrinkage_limit_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return ShrinkageLimitTest;
};
