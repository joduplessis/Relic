const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Util = require('./Util');
const Entry = require('./models/Entry');
const User = require('./models/User');
const jwt = require('./services/jwt');
const Constants = require('./Constants');
const path = require('path');
const util = require('util');

// Setup some global variables
const workingPath = path.dirname(fs.realpathSync(__filename));

// Setup our mongodb stuff
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${Constants.SERVER}:${Constants.PORT}/${Constants.DB}`, {
  useMongoClient: true
});

// Resume our input from the console
process.stdin.resume();
process.stdin.setEncoding('utf8');

// Receive some data
const args = process.argv;

// If it's not the right about of parameters
if (args.length != 4) {
  console.log('Usage: npm run register <email> <password>');

  process.exit();
} else {
  const email = args[2];
  const password = args[3];
  const campaign = Constants.CID;
  const newUser = new User({
    email,
    password,
    campaign
  });

  newUser.save((err) => {
    if (err) throw err;

    // Say thanks!
    console.log('User successfully created!');

    process.exit();
  });
}
