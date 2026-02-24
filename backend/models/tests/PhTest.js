const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PhTest = sequelize.define('PhTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    PH: {
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
    tableName: 'ph_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return PhTest;
};
