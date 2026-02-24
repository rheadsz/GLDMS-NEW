const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectStructures = sequelize.define('ProjectStructures', {
    StructureID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    ProjectID: {
      type: DataTypes.MEDIUMINT.UNSIGNED,
      allowNull: false,
    },
    StructureNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    ProjectComponent: {
      type: DataTypes.STRING(100),
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
    tableName: 'project_structures',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return ProjectStructures;
};
