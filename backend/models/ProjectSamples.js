const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectSamples = sequelize.define('ProjectSamples', {
    SampleID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    BoreholeID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    SampleNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    SampleType: {
      type: DataTypes.ENUM('Soil', 'Rock'),
      allowNull: true,
    },
    DepthFrom: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    DepthTo: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    TL101Number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ContainerType: {
      type: DataTypes.ENUM('Tube', 'Jar', 'Bag', 'Core'),
      allowNull: false,
      defaultValue: 'Tube',
    },
    ContainerSizeOption: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ContainerSizeManual: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    Quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    FieldCollectionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    SampleStatus: {
      type: DataTypes.ENUM('Record Created', 'Not Received', 'Accepted', 'Rejected'),
      defaultValue: 'Record Created',
    },
    ShippedToLab: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    RequestID: {
      type: DataTypes.STRING(20),
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
    tableName: 'project_samples',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return ProjectSamples;
};
