const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectBoreholes = sequelize.define('ProjectBoreholes', {
    BoreholeID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    StructureID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    BoreholeNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    Latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
    },
    Longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
    },
    Northing: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },
    Easting: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },
    GroundSurfaceElevation: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
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
    tableName: 'project_boreholes',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return ProjectBoreholes;
};
