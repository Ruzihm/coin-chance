/*
 *  Copyright 2014 Rick Van Tassel<rickvt@gmail.com>
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

var mongoose = require('mongoose');

var houseSchema = mongoose.Schema({
    revenue: String,
    bankRoll: String,
    investedProfit: String,
    wins: Number,
    losses: Number,
    luck: String,
    wageredProfit: String,
});

exports.HouseModel = mongoose.model('House', houseSchema);

exports.HouseModel.count({}, function (err, count) {
    if (count > 0) {
        exports.HouseModel.findOne({}, function (err, house){
            exports.House = house;
        });
        
    } else {
        exports.House = new exports.HouseModel({
            revenue: "0",
            bankRoll: "0",
            investedProfit: "0",
            wageredProfit: "0",
            wins: 0,
            losses: 0,
            luck: "100",
        });
        exports.House.save();
    }
});
