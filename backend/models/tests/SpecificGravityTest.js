const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SpecificGravityTest = sequelize.define('SpecificGravityTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    PycnometerWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    PycnometerWaterWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    PycnometerSoilWaterWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    SoilWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    SpecificGravity: {
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
    tableName: 'specific_gravity_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return SpecificGravityTest;
};
