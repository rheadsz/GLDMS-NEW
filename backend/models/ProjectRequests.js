const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectRequests = sequelize.define('ProjectRequests', {
    RequestID: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    ProjectID: {
      type: DataTypes.MEDIUMINT.UNSIGNED,
      allowNull: false,
    },
    RequestingUser: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    RequestDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    Status: {
      type: DataTypes.ENUM('Submitted', 'In Progress', 'Completed', 'Rejected', 'PendingApproval'),
      defaultValue: 'Submitted',
    },
    Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    RequesterName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    RequesterEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    RequesterPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    SupervisorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    SupervisorEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    SupervisorPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    RequesterOffice: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    RequesterBranch: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    RequesterOfficeOther: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    RequesterBranchOther: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    TestResultsDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  }, {
    tableName: 'project_requests',
    timestamps: false,
  });

  return ProjectRequests;
};
