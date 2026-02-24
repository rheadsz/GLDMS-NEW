const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CollapsePotentialTest = sequelize.define('CollapsePotentialTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    InitialVolume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    CollapseVolume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    CollapseRatio: {
      type: DataTypes.DECIMAL(5, 3),
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
    tableName: 'collapse_potential_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return CollapsePotentialTest;
};
