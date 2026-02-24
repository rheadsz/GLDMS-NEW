const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UnitWeightTest = sequelize.define('UnitWeightTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    WetWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    DryWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    Volume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    WetUnitWeight: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: true,
    },
    DryUnitWeight: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: true,
    },
    MoistureContent: {
      type: DataTypes.DECIMAL(6, 3),
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
    tableName: 'unit_weight_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return UnitWeightTest;
};
