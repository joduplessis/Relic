const mongoose = require('mongoose');
const Entry = require('./models/Entry');
const Constants = require('./Constants');
const moment = require('moment');
const jwt = require('./services/jwt');

module.exports = {
  getDailyCountForMsisdn: (msisdn, callback) => {
    const start = moment().startOf('day').unix()*1000;
    const now = new Date().getTime();
    const end = moment().endOf('day').unix()*1000;

    Entry.find({ $where: "this.time > "+start+" && this.time < "+end+" && this.msisdn == \""+msisdn+"\"" }, '_id cid time msisdn session optedin mostimportant householdmembers whenshopping stokvelgroup oftengroceries', function (err, res) {
      if (err) throw new Error(err);

      callback(res.length);
    });
  },

  getMsisdnEntryWithId: (_id, callback) => {
    Entry.findOne({ _id }, '_id cid time msisdn session optedin mostimportant householdmembers whenshopping stokvelgroup oftengroceries', function (err, res) {
      if (err) throw new Error(err);

      callback(res);
    });
  },

  getMsisdnEntries: (msisdn, callback) => {
    Entry.find({ msisdn }, '_id cid time msisdn session optedin mostimportant householdmembers whenshopping stokvelgroup oftengroceries', function (err, res) {
      if (err) throw new Error(err);

      callback(res);
    });
  },

  getAllEntries: (callback) => {
    Entry.find({}, '_id cid time msisdn session optedin mostimportant householdmembers whenshopping stokvelgroup oftengroceries', function (err, res) {
      if (err) throw new Error(err);

      callback(res);
    });
  },

  updateEntryWithId: (id, newData, callback) => {
    Entry.findByIdAndUpdate(id, newData, {new: true}, function(err, res) {
        if (err) throw new Error(err);

        callback(res);
    });
  },

  updateEntryWithUssdSessionId: (id, newData, callback) => {
    Entry.findOneAndUpdate({session: id}, newData, {new: true}, function(err, res) {
        if (err) throw new Error(err);

        callback(res);
    });
  },

  addMsisdnEntry: (data, callback) => {
    const newEntry = new Entry(data);

    newEntry.save(function (err, res) {
      if (err) throw new Error(err);

      callback(res);
    });
  },

  createSendToken: (usr, host, res) => {
    const user = usr.toJSON();
    const token = jwt.encode({
      iss: host,
      sub: usr.id,
      exp: Date.now()/1000,
    }, Constants.SECRET);

    res.status(200).send({
      user,
      token
    });
  }
};
