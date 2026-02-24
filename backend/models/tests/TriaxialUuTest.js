const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TriaxialUuTest = sequelize.define('TriaxialUuTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    ConfinedPressure: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    DeviatorStress: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    UndrainedShearStrength: {
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
    tableName: 'triaxial_uu_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return TriaxialUuTest;
};
