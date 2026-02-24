const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    AuditLogID: {
      type: DataTypes.MEDIUMINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    AuditLogName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    AuditLogDescription: {
      type: DataTypes.TEXT,
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
    tableName: 'audit_log',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return AuditLog;
};
