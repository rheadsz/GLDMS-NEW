const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Specimen = sequelize.define('Specimen', {
    SpecimenID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    SpecimenName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
    },
    SampleID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    TestTypeID: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    SpecimenNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    SpecimenType: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    SpecimenCondition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    SpecimenDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    PreparationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    PreparationMethod: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    PreparationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    SpecimenWeight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
    },
    SpecimenDimensions: {
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
    tableName: 'specimen',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return Specimen;
};
