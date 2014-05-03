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

var mongoose = require('mongoose'),
    userData = require('../model/user');


exports.login = function(req, res){
    var username = req.body.username.toLowerCase(),
        password = req.body.password,
        otp = req.body.otp;

    //console.log("username, password, otp", username, password,otp);

    userData.Login(username, password, otp, function (err, isSuccess, user) {
        if (err) {
            console.error(err);
        } else if (isSuccess) {
            req.session.user = user.accountSecret;
            console.log("Login successful!");
        } else {
            req.session.loginFailure = true;
        }
        res.redirect('/');
    });
};
