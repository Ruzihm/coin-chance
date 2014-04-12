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

// Connect to db
var mongoose = require('mongoose'),
    rollData = require('../model/roll'),
    config = require('../../config');

exports.roll = function(req, res){
    if (! req.params.rollId) { 
        res.redirect('/');
        return;
    }
    rollData.getRollById(req.params.rollId, function (err, roll) {
        if (err || !roll) {
            console.log("failed to find a roll with that id");
            res.redirect('/');
            return;
        }
        
        res.render('roll', { 
            title: 'Roll',
            'rollId': roll._id,
            'userId': roll.userId,
            'multiplier': roll.multiplier,
            'stake': roll.stake,
            'profit': roll.profit,
            'chance': roll.chance,
            'target': roll.target,
            'isHighGuess': roll.isHighGuess,
            'lucky': roll.lucky,
            'didWin': roll.didWin,
            'serverSeedHash': roll.serverSeedHash,
            'serverSeed': (roll.serverSeedRevealed) ? roll.serverSeed : "Not published yet",
            'clientSeed': roll.clientSeed,
            'nonce': roll.nonce,
            srcLink: config.SRC_LINK
        });
    });
};
