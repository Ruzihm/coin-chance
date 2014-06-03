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

var mongoose = require('mongoose'),
    userData = require('../model/user');

exports.logout = function(req, res){
    console.log("Logging out... hopefully.");
    req.session.destroy();
    res.clearCookie('userHash');
    res.redirect('/');
};
