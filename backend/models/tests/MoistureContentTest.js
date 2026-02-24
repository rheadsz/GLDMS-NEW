const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MoistureContentTest = sequelize.define('MoistureContentTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    WetAndTareWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    TareWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    DryAndTareWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    MoistureGram: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    MoisturePercentage: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: true,
    },
    WetAndTareWeightDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    TareWeightDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    DryAndTareWeightDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    WetAndTareWeightUser: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    TareWeightUser: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    DryAndTareWeightUser: {
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
    tableName: 'moisture_content_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return MoistureContentTest;
};
