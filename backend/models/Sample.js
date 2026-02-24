const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sample = sequelize.define('Sample', {
    SampleID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    SampleName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
    },
    ProjectID: {
      type: DataTypes.MEDIUMINT.UNSIGNED,
      allowNull: false,
    },
    SampleLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Elevation: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    SampleDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    SampleDepth: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    SampleType: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    SampleNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    BoringNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    SampleDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    SampleCondition: {
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
    tableName: 'sample',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return Sample;
};
