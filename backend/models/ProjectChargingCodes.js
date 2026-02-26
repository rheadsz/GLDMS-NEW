const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProjectChargingCodes = sequelize.define('ProjectChargingCodes', {
    ChargingID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    RequestID: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ChargingProjectID: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ChargingUnit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ChargingPhase: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ChargingSubObject: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ChargingReportingCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ChargingActivity: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ChargingSubActivity: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  }, {
    tableName: 'project_charging_codes',
    timestamps: false,
  });

  return ProjectChargingCodes;
};
