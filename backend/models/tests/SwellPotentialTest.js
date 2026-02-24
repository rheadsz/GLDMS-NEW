const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SwellPotentialTest = sequelize.define('SwellPotentialTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    InitialVolume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    SwellVolume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    SwellRatio: {
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
    tableName: 'swell_potential_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return SwellPotentialTest;
};
