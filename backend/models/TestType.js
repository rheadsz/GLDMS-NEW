const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestType = sequelize.define('TestType', {
    TestTypeID: {
      type: DataTypes.TINYINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    TestName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: '',
    },
    Abbreviation: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '',
      unique: true,
    },
    Method: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    TableName: {
      type: DataTypes.STRING(50),
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
    tableName: 'test_type',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return TestType;
};
