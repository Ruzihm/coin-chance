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

var config = require('../../config'),
    userData = require('../model/user'),
    House = require('../model/house'),
    Coin = require('../model/coin'),
    BigNumber = require('bignumber.js');

function displayLogin(req,res) {
    var fail = req.session.loginFailure | false;

    res.render('login',{
        title: config.SITE_TITLE,
        srcLink: config.SRC_LINK,
        description: config.SITE_DESCRIPTION,
        loginFailure: fail
    });
}

function displayPage(req, res, user, isNew) {
    req.session.user = user.accountSecret;
    res.cookie('userHash',user.hash, {
        signed:true,
        maxAge: 31536000000,
        secure: config.SSL_ENABLED,
        httpOnly: true
    });

    user.updateLastLogin();

    //console.log("Set user in session:" + user);
    user.getCoinAddress(function (err,coinAddress) {
        if (err) {
            console.error("Error getting user address: ",coinAddress);
            coinAddress = "Not available now, try again later.";
        }

        // TODO: Safe error processing
        var bankRoll = BigNumber(House.House.bankRoll);
        user.getBalance(function (err, bal) {
            var maxP =  bankRoll.times(config.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL).toFixed(config.DECIMAL_PLACES);
            console.log("max profit:",maxP);
            res.render('index', { 
                title: config.SITE_TITLE ,
                myName: user.displayName,
                description: config.SITE_DESCRIPTION,
                fullName: "("+user.id+") " + user.displayName,
                houseEdge: config.HOUSE_EDGE.toString(10),
                houseCut: config.HOUSE_CUT.toString(10),
                houseBankRoll: bankRoll,
                maxProfit: maxP,
                winCount: user.wins,
                lossCount: user.losses,
                balance: bal.toString(10),
                invested: user.invested,
                investedProfit: user.investedProfit,
                houseInvestedProfit: House.House.investedProfit,
                houseWinCount: House.House.wins,
                houseLossCount: House.House.losses,
                houseWageredProfit: House.House.wageredProfit,
                luck: user.luck+"%",
                loginLink: user.accountSecret,
                houseLuck: House.House.luck + "%",
                "coinAddress": coinAddress,
                houseCommission: House.House.revenue,
                depositAddress: coinAddress,
                withdrawFee: config.TOTAL_WITHDRAW_FEE.toString(10),
                isNewUser: isNew,
                username: user.loginName,
                REQUIRED_CONFIRMATIONS: config.MIN_DEPOSIT_CONFIRMATIONS,
                wageredProfit: user.wageredProfit,
                srcLink: config.SRC_LINK,
                minBet: config.MINIMUM_BET,
                decimalPlaces: config.DECIMAL_PLACES,
                investmentDecimalPlaces: config.INVESTMENT_DECIMAL_PLACES,
                investedPortion: BigNumber(user.invested).times(100).div(
                        bankRoll).toFixed(6)+"%",
                currencySymbol: config.CURRENCY_SYMBOL,
                maxWithdrawAmount: config.MAX_WITHDRAW_AMOUNT,
                version: require('../../package.json').version
            });
        });
    });
}

exports.index = function(req, res){
    if ( req.params.accountSecret) {
        var accountSecret = req.params.accountSecret;
        // Confirm hash is legit
        userData.getUserByAccountSecret(accountSecret, function (err,user) {
            if (err || !user) {
                console.log("failed to find a user with account secret");
            } else {
                console.log("Logged in via account Secret");
                req.session.user = user.accountSecret;
                res.cookie('userHash',user.hash, {
                    signed:true,
                    maxAge: 31536000000,
                    secure: true,
                    httpOnly: true
                });
            }
            res.redirect('/');
        });
        return;
    }


    if (!req.session.user && req.signedCookies.userHash !==undefined) {
        console.log("Logging in via user hash");
        userData.getUserByHash(req.signedCookies.userHash, function (err,user) {
            if (err || !user) {
                console.log("Failed to find a user with hash: ",req.signedCookies.userHash);
                res.clearCookie("userHash");
                res.redirect('/');
            } else {
                console.log("Found a user with given hash. User.loginName: ",user.loginName);
                if (!user.loginName) {
                    displayPage(req,res,user, false);
                } else {
                    displayLogin(req,res,user);
                }
            }
        });
    } else if (req.session.user) {
        //User already logged in
        //Set userId based on accountSecret cookie
        console.log("loggin in via cookie");
        userData.getUserByAccountSecret(req.session.user, function (err,user) {
            if (err || !user) {
                console.log("Failed to find a user with account secret:");
                res.redirect('/');
            } else {
                displayPage(req,res, user, false);
            }
        });
    } else {
        // Create next account
        console.log("Creating new account");
        userData.createNewUser(function (err, user) {
            if (err || !user){
                console.log(err);
            } else {
                displayPage(req, res, user, true);
            }
        });
    }
};
