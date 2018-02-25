const mongoose = require('mongoose');

module.exports = mongoose.model('Entry', new mongoose.Schema({
  cid: String,
  time: Number,
  msisdn: String,
  session: Number,
  selection: String,
}));
