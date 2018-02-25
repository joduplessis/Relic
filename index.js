  const express = require('express');
const https = require('https');
const xml = require('xml');
const fs = require('fs');
const request = require('request');
const moment = require('moment');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const mustache = require('mustache-express');
const Constants = require('./Constants');
const Util = require('./Util');
const Entry = require('./models/Entry');
const User = require('./models/User');
const jwt = require('./services/jwt');

// Start our express server
const SECRET = Constants.SECRET;
const app = express();
const server = app.listen(Constants.APP_PORT, () => {
  console.log('USSD listening on '+server.address().port);
});

// Bodyparser middleware
app.use(bodyParser.json());

// Template middelware
app.engine('html', mustache());

// Set the view engine
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,Content-Type,Authorization');

    next();
});

// Set up our Mongo connections
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${Constants.SERVER}:${Constants.PORT}/${Constants.DB}`, {
    useMongoClient: true
});

/**
 * This is the login API path for frontend applications
 */
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const { hostname } = req;
    const filter = {
        email
    };

    User.findOne(filter, function(err, usr) {
        if (err) throw err;

        if (!usr)
            return res.status(401).send({message: 'User not found.'});

        usr.comparePassword(password, function(err, isMatch) {
            if (err) throw err;

            if (!isMatch)
                return res.status(401).send({message: 'Password does not match the records.'});

            Util.createSendToken(usr, hostname, res);
        });
    });
});

/**
 * Get all of the events, uses JWT
 */
app.get('/entries', (req, res) => {
    // If it's not there
    if (!req.headers.authorization) return res.status(401).send({message: 'Not authorized'});

    // If it's not formed properly
    if (!req.headers.authorization.split(' ')[1]) return res.status(401).send({message: 'Not authorized'});

    // Get our JWT token
    const token = req.headers.authorization.split(' ')[1];
    const payload = jwt.decode(token, SECRET);

    // Get all of the data and return it
    Util.getAllEntries((result) => {
        res.json(result);
    });
});

/**
 * Flow of the USSD conversations
 */
app.get('/ussd', function(req, res) {

    // Set our content type
    res.set('Content-Type', 'text/soap+xml');
    res.set('Content-Type', 'application/soap+xml');

    // These values are sent with every USSD request
    const { msisdn, request, provider, ussdSessionId } = req.query;

    // If there is no path query parameter we assume that it's the start of
    // of the conversation for the user
    if (req.query.path==undefined) {
        console.log('User started conversation...');

        // Get the total entries for this user
        Util.getMsisdnEntries(msisdn, (result) => {
            const entries = result.length;
            let entriesThatAreValid = 0;

            // Make sure all our entries are valid, other wise start from the top
            for (let e=0; e<result.length; e++) {
                if (result[e].selection!='') {
                    entriesThatAreValid++;
                }
            }

            // If this person has entered before, we bar them from doing so again
            if (entriesThatAreValid!=0) {
                res.send('<?xml version="1.0" encoding="utf-8"?><request><headertext>Sorry, you are only allowed to enter once.</headertext><options></options></request>');
            } else {

                // If they are new we create the base document for them - we will always
                // reference them with the session ID when updating - only when checking
                // if they've entered before do we use the MSISDN value
                // This is the first reponse if they have no been found in the DB
                Util.addMsisdnEntry({
                    cid: Constants.CID,
                    time: new Date().getTime(),
                    msisdn: msisdn,
                    session: ussdSessionId,
                    selection: '',
                }, (result) => {

                    // This is the initial message to start them off with
                    res.send('<?xml version="1.0" encoding="utf-8"?>' +
                        '<request>' +
                        '<headertext>SUPERSPAR PHOLA Competition - win your share of R50,000! Answer 5 questions to enter. Can we contact you for future promotions?</headertext>' +
                        '<options>' +
                        '<option command="1" order="1" callback="'+Constants.USSD_URL+'?path=path1" display="true">Path 1</option>' +
                        '<option command="1" order="1" callback="'+Constants.USSD_URL+'?path=path2" display="true">Path 2</option>' +
                        '<option command="1" order="1" callback="'+Constants.USSD_URL+'?path=path3" display="true">Path 3</option>' +
                        '</options>' +
                        '</request>');
                });
            }
        });

    } else {

        // This is the path they follow if they are responding to the options
        const { path } = req.query;

        // If their reponse is any one of the following, we end the conversation
        if (path=="path1" || path=="path1" || path=="path3") {

            // First we update the DB
            Util.updateEntryWithUssdSessionId(ussdSessionId, {selection: path}, (result) => {

                // And say thanks
                res.send('<?xml version="1.0" encoding="utf-8"?><request><headertext>Thank you for your feedback</headertext><options></options></request>');
            });
        }

        }
        });
