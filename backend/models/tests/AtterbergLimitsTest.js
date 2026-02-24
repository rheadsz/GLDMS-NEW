const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AtterbergLimitsTest = sequelize.define('AtterbergLimitsTest', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
    },
    LiquidLimitWeight1: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    LiquidLimitWeight2: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    LiquidLimitWeight3: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    LiquidLimitWeight4: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    LiquidLimitBlows1: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    LiquidLimitBlows2: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    LiquidLimitBlows3: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    LiquidLimitBlows4: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    PlasticLimitWeight1: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    PlasticLimitWeight2: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    PlasticLimitWeight3: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    LiquidLimit: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    PlasticLimit: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    PlasticityIndex: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    TestDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    TestUser: {
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
    tableName: 'atterberg_limits_test',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return AtterbergLimitsTest;
};
