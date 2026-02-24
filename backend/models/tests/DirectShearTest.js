const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DirectShearTest = sequelize.define('DirectShearTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    NormalStress: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    ShearStress: {
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
    tableName: 'direct_shear_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return DirectShearTest;
};
