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

var rpc = require('json-rpc2'),
    config = require('../../config'),
    BigNumber = require('bignumber.js');

var client = new rpc.Client(
    config.COIN_RPC_PORT,
    config.COIN_RPC_HOST,
    config.COIN_RPC_USER,
    config.COIN_RPC_PASSWORD
    );

// Amount is a BigNumber
exports.moveFromUserToHouse = function (userId,amount,cb) {
    console.log("movefromuser");
    amount = Number(amount.toFixed(config.DECIMAL_PLACES));
    client.call( "move", [userId,"",amount], cb);
};

// Amount is a BigNumber
exports.moveToUserFromHouse = function (userId, amount, cb) {
    console.log("movetouser");
    amount = Number(amount.toFixed(config.DECIMAL_PLACES));
    client.call( "move", [userId,"",amount], cb);
};

exports.getHistory = function(userId, n, offset, cb) {
    console.log("history");
    client.call( "listtransactions", [userId, n, offset], 
            function(err, res) {
                if (err){
                    console.err(err);
                    cb(err, []);
                }
            cb(err,res);
    });
};

// Amount is a BigNumber
exports.getUserBalance = function (userId,cb) {
    console.log("getuserbalance");
    client.call( 
        "getbalance",
        [userId, config.MIN_DEPOSIT_CONFIRMATIONS], 
        function (err,res){
            if (err | isNaN(res)) {
                cb("Problem getting a user's balance",res);
                return;
            }
            cb(err, BigNumber(res));
    });
};

exports.getUserAddress = function (userId,cb) {
    client.call( "getaccountaddress",
        [userId], 
        function(err,res){
            cb(err,res);
    });
};

// amount is a BigNumber
exports.withdraw = function (userId, addr, amount, cb) {
    var realAmount = Number(amount.toFixed(config.DECIMAL_PLACES));
    console.log("withdraw. realAmount: ", realAmount);
    client.call("move", ["", userId, realAmount+config.COIN_NETWORK_FEE], function (err, res) {
        if (err) {
            console.error(err);
            cb(err);
            return;
        }

        console.debug("Withdraw res: ",res);

        client.call("sendfrom", [
                userId,
                addr, 
                realAmount,
                config.MIN_DEPOSIT_CONFIRMATIONS], cb);

        });
};
