const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SandEquivalentTest = sequelize.define('SandEquivalentTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    SandEquivalent: {
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
    tableName: 'sand_equivalent_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return SandEquivalentTest;
};
