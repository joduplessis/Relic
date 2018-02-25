const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Constants = require('../Constants');

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  campaign: String
});

UserSchema.methods.toJSON = function() {
  const user = this.toObject();

  delete user.password;

  return user;
}

UserSchema.methods.comparePassword = function(password, callback) {
  bcrypt.compare(password, this.password, callback);
}

// Before we save, we encrypt the password
UserSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, (err, hash) => {

      if (err) return next(err);

      user.password = hash;
      next();
    });
  });
});

module.exports = mongoose.model('User', UserSchema);
