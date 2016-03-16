'use strict';

var bcrypt = require('bcrypt');
// version avec crypto
//var crypto = require('crypto');
//var salt="secret"

/*var cryptPasswd = function(user) {
    if (user.password) {
	user.password = user.hashPassword(user.password);
    }
    return;
};*/

var bcryptPasswd = function(user) {
    if (user.password) {
	user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(8));
    }
    return;
};


module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
      username: {
	  type: DataTypes.STRING,
	  unique: true
      },
      password: DataTypes.STRING,
      created_at: {
	  type: DataTypes.DATE,
	  defaultValue: DataTypes.NOW
      },
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      facebookId: DataTypes.TEXT,
      fbtoken: DataTypes.TEXT,
      resetPasswordToken: DataTypes.STRING,
      resetPasswordExpires: DataTypes.DATE
  }, {
      //crypt the password with bcrypt
      instanceMethods: {
          comparePassword: function(password, callback) {
	      bcrypt.compare(password, this.password, callback);
          }
      },
      hooks: {
	  beforeCreate: bcryptPasswd
      }
// crypt the password with crypto
/*	  comparePassword: function(cbpassword) {
	      return this.password === this.hashPassword(cbpassword);
	  }
	  hashPassword: function(password) {
	      return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
	  }
      },
      hooks: {
	  beforeCreate: cryptPasswd
      }*/
  });

    return User;
};
