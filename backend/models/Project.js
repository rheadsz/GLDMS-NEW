const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    ProjectID: {
      type: DataTypes.MEDIUMINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    ProjectName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    District: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: '',
    },
    DistrictLocation: {
      type: DataTypes.CHAR(2),
      allowNull: true,
    },
    County: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    Route: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: true,
    },
    PMFrom: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    PMTo: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    StartedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    EstimatedDeliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    RequestedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ClientDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ApprovedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    SampledDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    SampleReceivedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    ToGradeBenchDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    StaffDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    GLTrackNumber: {
      type: DataTypes.STRING(6),
      allowNull: false,
      defaultValue: '',
    },
    EA: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '',
    },
    StructureNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    FA: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    ActivityCode: {
      type: DataTypes.SMALLINT.UNSIGNED.ZEROFILL,
      allowNull: true,
      defaultValue: 0,
    },
    MSACode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    SubJob: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    SpecialDesignation: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    T_101Numbers: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    ClientOffice: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ClientPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ClientLastName: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    ClientFirstName: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    EfisProjectId: {
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
    tableName: 'project',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return Project;
};
