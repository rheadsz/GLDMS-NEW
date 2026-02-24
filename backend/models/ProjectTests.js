const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectTests = sequelize.define('ProjectTests', {
    TestID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    SampleID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    TestTypeID: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    Status: {
      type: DataTypes.ENUM('Requested', 'In Progress', 'Completed', 'Cancelled'),
      defaultValue: 'Requested',
    },
    TestStatus: {
      type: DataTypes.ENUM('Record Created', 'Not Received', 'Accepted', 'Rejected'),
      allowNull: true,
    },
    RequestingUser: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    RequestedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    CompletedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    DateAssigned: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    AssignedTester: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ResultDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ReportDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    AssignmentNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    NumberOfSpecimen: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Notes: {
      type: DataTypes.TEXT,
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
    tableName: 'project_tests',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return ProjectTests;
};
