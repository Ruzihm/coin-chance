/*
 *  Copyright 2014 Ruzihm
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

var crypto = require('crypto'),
    BigNumber = require('bignumber.js'),
    config = require('../../config');

BigNumber.config({ DECIMAL_PLACES:4*config.INVESTMENT_DECIMAL_PLACES, ROUNDING_MODE: BigNumber.ROUND_DOWN});

exports.getLucky = function(nonce, serverSeed, clientSeed) {
    var hexstr = crypto.createHmac('sha512',
            nonce + ":" + serverSeed + ":" + nonce).
        update(nonce + ":" + clientSeed + ":" + nonce).
        digest('hex');

    for (var i=0 ; i<25; i++) {
        var hexsub = hexstr.substr(i*5,5);
        var lucky = BigNumber(hexsub,16);
        if (lucky.lessThan(1000000)) {
            return lucky.div(10000);
        }
    }
    //Impossible to get here. Last iteration of loop must result in something less than 1 million.

    return BigNumber(50.0);
};

