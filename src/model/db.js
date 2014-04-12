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

var config = require('../../config');

// Mongodb connection string
var MONGO_CONN_STR = config.MONGO_CONN_STR;

// Import misc libs:
var bcrypt = require('bcrypt');

// Connect to db
var mongoose = require('mongoose'),
    autoIncrement = require('mongoose-auto-increment');

exports.connection = mongoose.createConnection(MONGO_CONN_STR);
autoIncrement.initialize(exports.connection);

mongoose.connect(MONGO_CONN_STR);
