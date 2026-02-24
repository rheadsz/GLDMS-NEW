const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Users = sequelize.define('Users', {
    UserID: {
      type: DataTypes.MEDIUMINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    UserName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    UserType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
  });

  return Users;
};
