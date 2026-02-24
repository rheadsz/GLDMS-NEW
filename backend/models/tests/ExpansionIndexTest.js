const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExpansionIndexTest = sequelize.define('ExpansionIndexTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    InitialVolume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    ExpandedVolume: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    ExpansionIndex: {
      type: DataTypes.DECIMAL(5, 2),
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
    tableName: 'expansion_index_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return ExpansionIndexTest;
};
