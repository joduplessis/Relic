# Relic

Relic is a straightforward NodeJS/MongoDB framework for writing data-enabled USSD applications.

## Installation

Clone the repo and install packages with `yarn install` or `npm install`. Make sure you fill out the `Constants` file with the relevant details (Mongo port, etc.).

## USSD

Point your USSD service to `/ussd`. You can follow the code to add more conversation paths.

## Add users

To add users for API & data access, simply run `npm run register <email> <password>`.

## Get data

You can access the entry data at `/entries` by passing your `bearer` JWT auth token in each request header.

# Roadmap

- Better handling of conversation
- More flexible data structure for entrant details
