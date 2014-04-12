/*
 *  Copyright 2014 Richard Van Tassel
 *
 *  This file is part of Coin-chance.
 *
 *  Coin-chance is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Coin-chance is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Coin-chance.  If not, see <http://www.gnu.org/licenses/>.
 */

var BigNumber = require("bignumber.js");

// How small the coin can be divided (Bitcoin has 8, for instance)
exports.DECIMAL_PLACES = 8;

// Decimal places for investment calculation. Be sure that it is at least precise enough to measure the house cut of the smallest possible wager.  MUST BE HIGHER THAN DECIMAL_PLACES!!

exports.INVESTMENT_DECIMAL_PLACES = 16;

exports.SRC_LINK = "";

// Mongodb connection string
exports.MONGO_CONN_STR = process.env.COIN_CHANCE_CONNSTR; // "mongodb://localhost/test"

// Name of site
exports.SITE_NAME = "Coin-chance.com";
exports.SITE_TITLE = "Coin-chance";
exports.SITE_DESCRIPTION = "1% house edge - play and invest";

// Symbol of currency
exports.CURRENCY_SYMBOL = "Test BTC";

// Base URL of site
exports.BASE_URL = "https://Coin-chance.com";

// Port of site
exports.SOCKETIOPORT = 4000;
exports.HTTPSPORT = 3000;

// SSL files
exports.SSLKEY = process.env.COIN_CHANCE_SSLKEY; // '/path/to/ssl.key' 
exports.SSLCERT = process.env.COIN_CHANCE_SSLCERT; // 'path/to/ssl.crt' 

// SECRET
exports.COOKIE_SECRET = process.env.COIN_CHANCE_COOKIESECRET; //'my_cookie_secret';

// Directory to keep cached minified js/css. false for memory cache
exports.MINIFY_CACHE_DIR = false;


// House cut (OF WAGES)
// This / house edge = house cut of expected profits
exports.HOUSE_CUT = BigNumber(0.001);

// Minimum stake. (not counting 0 stake)
exports.MINIMUM_BET     = BigNumber(0.00000001);

// Minimum stake before delay occurs. 0 for no delay
exports.DELAY_BET_AMOUNT = BigNumber(0.0001);

// Minimum bets required before re-randomization can be done.
exports.MINIMUM_BETS_BEFORE_RANDOMIZE = 10;

// House edge 
exports.HOUSE_EDGE = BigNumber(0.01);

// Maximum safe user profit portion of bankroll
// Kelly criterion suggests safe maximum is the house edge.
// even at extremely low payouts
exports.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL = exports.HOUSE_EDGE;

exports.MIN_DEPOSIT_CONFIRMATIONS = 3;
exports.COIN_NETWORK_FEE = BigNumber(0.00050000);
exports.TOTAL_WITHDRAW_FEE = BigNumber(0.00100000);

//Json-RPC strings for coin client

exports.COIN_RPC_PORT = process.env.COIN_CHANCE_RPCPORT; //"18332";
exports.COIN_RPC_HOST = process.env.COIN_CHANCE_RPCHOST; //"localhost";
//exports.COIN_RPC_SSL_OPTIONS = {cert:exports.SSLCERT,key:exports.SSLKEY};
exports.COIN_RPC_USER = process.env.COIN_CHANCE_RPCUSER; //"user";
exports.COIN_RPC_PASSWORD = process.env.COIN_CHANCE_RPCPASSWORD; //"password";

exports.CHAT_MESSAGE_HISTORY_LENGTH= 50;
