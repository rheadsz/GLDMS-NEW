const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PointLoadTest = sequelize.define('PointLoadTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    Load: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    Diameter: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    UnconfinedStrength: {
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
    tableName: 'point_load_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return PointLoadTest;
};
