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

var rollData = require('../model/roll'),
    userData = require('../model/user'),
    House = require('../model/house'),
    Coin = require('../model/coin'),
    Chat = require('../model/chat'),
    Roll = require('../model/roll'),
    events = require('events'),
    BigNumber = require('bignumber.js'),
    CryptoAddressCheck = require('cryptoaddress-validator');
    config = require('../../config');

BigNumber.config({ DECIMAL_PLACES:config.INVESTMENT_DECIMAL_PLACES*4, ROUNDING_MODE: BigNumber.ROUND_DOWN});

var eventEmitter = new events.EventEmitter();

var config = require('../../config');

exports.io = null;

exports.onconnect = function(socket) {
    var session = socket.handshake.session;

    if (!session) {
        return;
    }

    function refreshUser (cb){ 
        userData.UserModel.findById(socket.currentUser.id, function (err, user) {
            socket.currentUser = user;
            cb();
        });
    }

    userData.getUserByAccountSecret(session.user, function (err,user) {
        if (err || !user) {
            console.log("Failed to find a user with account secret:");
            console.log(err);
        } else {
            socket.currentUser = user;
            socket.emit('message', { 
                message: 'Welcome to Coin-Chance! Your name is '+ 
                socket.currentUser.displayName +" ("+socket.currentUser.id+")" });
            // Get up to last 20 bets for that user
            Roll.RollModel.find({userId:user.id}).sort('-date').limit(20).exec(

                function (err, rolls) {
                    var rollsOut = [];
                    for (var i in rolls) {
                        rollsOut.unshift({
                            playerDisplayName: user.displayName,
                            playerID: user.id,
                            lucky: rolls[i].lucky,
                            chance: rolls[i].chance,
                            rollid: rolls[i].id,
                            target: rolls[i].target,
                            isHighGuess: rolls[i].isHighGuess,
                            stake: rolls[i].stake,
                            didWin: rolls[i].didWin,
                            profit: rolls[i].profit,
                            mult: rolls[i].multiplier
                        });
                    }
                    socket.emit('betHistory', {
                        bets: rollsOut
                    }); 
            });
        }
    });

    socket.on('accountSetup', function (data) {
        if (undefined === data) {
            return;
        }

        console.log("got account setup:",data);
        if (!data.password) {
            return;
        }
        console.log("account setup received");

        refreshUser(function () {
            var name;
            // If the current user hasn't yet been set up,
            // Require a username to be specified!
            if (!socket.currentUser.loginName) {
                if (!data.username){
                    socket.emit('accountSetupComplete', {
                        success: false,
                        error: "No username specified"
                    });
                    return;
                } 

                userData.UserModel.find({loginName:data.username}, function (err, users) {
                    if (err) {
                        console.error(err);
                        socket.emit('accountSetupCompete', {
                            success: false,
                            error: "Try again later"
                        });
                        return;
                    }

                    if (users.length > 0) {
                        socket.emit('accountSetupComplete', {
                            success: false,
                            error: "Username already taken"
                        });
                        return;
                    }
                    socket.currentUser.loginName = data.username;
                    socket.currentUser.loginPassword = data.password;
                    socket.currentUser.save(function (err, user) {
                        if (err) {
                            socket.emit("accountSetupComplete", {
                                success: false,
                                error: "Try again later"
                            });
                            return;
                        }

                        socket.emit("accountSetupComplete", {
                            success: true});
                        return;
                    });
                });
            } else {
                socket.currentUser.loginPassword = data.password;
                socket.currentUser.save(function (err,user) {
                    if (err) {
                        socket.emit("accountSetupComplete", {
                            success: false,
                            error: "Try again later"
                        });
                        return;
                    }

                    socket.emit("accountSetupComplete", {
                        success:true});
                    return;
                });
            }
        });
    });

    socket.on('changeName', function(data) {
        if (undefined === data) {
            return;
        }
        if (!data.newName) {
            return;
        }
        console.log("changeName received");
        
        if (!/^\w{1,32}$/.test(data.newName)) {
            return;
        }

        refreshUser(function () {
            socket.currentUser.displayName = data.newName;
            socket.currentUser.save(function (err, res){
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("emitting changeNameComplete");
                socket.emit('changeNameComplete', {newName:"("+socket.currentUser.id + ") " + data.newName});
            });
        });
    });

    socket.on('chatMessage', function(data) {
        if (undefined === data) {
            return;
        }

        if (!data.message) {
            return; 
        }

        var msg = data.message.slice(0,1024);

        socket.currentUser.chat(msg, function (err) {
            if (err) {
                console.error(err);
                return;
            }

            msg = Chat.formatMessage(socket.currentUser,msg);
            exports.io.sockets.in('chat').emit('message',{message:msg});
        });
    });

    socket.on('randomize', function (data) {
        refreshUser(function () {
            socket.currentUser.randomize(
                function( prevSSeed, prevSHash,  prevCSeed, 
                    prevBetCount, curSHash, curClientSeed) {
                socket.emit('randomizeOccurred', {
                    prevSSeed: prevSSeed,
                    prevSHash: prevSHash,
                    prevCSeed: prevCSeed,
                    prevBetCount: prevBetCount,
                    curSHash: curSHash,
                    curCSeed: curClientSeed
                });
            });
        });
    });

    socket.on('sendCustomSeed', function (data) {
        if (undefined === data) {
            return;
        }
        console.log("customSeed received");
        if (/^\d{1,24}$/.test(data.clientSeed)) {
            socket.currentUser.useClientSeed(data.clientSeed);
        } else {
            console.log("Invalid client seed sent: ",data.clientSeed);
        }
    });

    socket.on('divest', function (data) {
        //sanity check on input
        if (undefined === data || isNaN(data.divestAmount)) {
            return;
        }

        var divestAmount = BigNumber(data.divestAmount).round(config.DECIMAL_PLACES, BigNumber.ROUND_DOWN);

        if (divestAmount.equals(0)) {
            return;
        }

        refreshUser(function () {
            //make sure divestment does not exceed user investment
            if (divestAmount.greaterThan(socket.currentUser.invested)) {
                return;
            }

            console.log("divesting...");
            socket.currentUser.divest(divestAmount, function (err, currentBalance, currentInvested) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("divesting",currentBalance.toString(10),
                    currentInvested.toString(10));
                socket.emit("divestingOccurred", {
                    'currentInvested':currentInvested.toString(10),
                    'currentBalance':currentBalance.toString(10),
                    newBankRoll: House.House.bankRoll,
                    maxProfit: config.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL.times(House.House.bankRoll).toString(10)
                });
            });
        });
    });


    socket.on('invest', function (data) {
        if (undefined === data) {
            return;
        }

        //sanity check on input
        if (isNaN(data.investAmount)) {
            return;
        }

        var investAmount = BigNumber(data.investAmount).round(config.DECIMAL_PLACES, BigNumber.ROUND_DOWN);

        if (investAmount.lte(0)) {
            return;
        }

        refreshUser(function () {
            //make sure investment does not exceed user balance
            socket.currentUser.getBalance(function (err,userBalance) {
                if (err) {
                    console.error("Error getting user balance");
                }
                if (!userBalance) {
                    return;
                }
                if (investAmount.greaterThan(userBalance)) {
                    return;
                }

                console.log("investing...");
                socket.currentUser.invest(investAmount, function (err, currentBalance, currentInvested){
                    if (err) 
                    {
                        console.error(err);
                        return;
                    }
                    //refresh balance
                console.log("investing",
                    currentBalance.toString(10),
                    currentInvested.toString(10));
                    socket.emit("investingOccurred", {
                        'currentInvested': currentInvested.toString(10),
                        'currentBalance': currentBalance.toString(10),
                        newBankRoll: House.House.bankRoll,
                        maxProfit: config.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL.times(House.House.bankRoll).toString(10)
                    });
                });
            });
        });
    });

    socket.betCompleteListener = function (data) {
        if (undefined === data) {
            return;
        }
        refreshUser(function () {
            socket.currentUser.getBalance( function(err,userBalance){
                var isMe = (data.playerID === socket.currentUser.id);
                //console.log("data.playerID currentUser.id isMe", data.playerID, socket.currentUser.id,isMe);
                data.isMe = isMe;
                if (isMe) {
                    data.newWageredProfit = socket.currentUser.wageredProfit;
                }
                data.newInvested = socket.currentUser.invested;
                data.newInvestedProfit = socket.currentUser.investedProfit;
                data.newBalance = userBalance.toString(10);

                //console.log("Sending out bet:",data);
                socket.emit("betOccurred", data);
            });
        });
    };

    eventEmitter.on('betComplete', socket.betCompleteListener);

    socket.on('disconnect', function(data) {
        eventEmitter.removeListener('betComplete', socket.betCompleteListener);
    });

    function withdrawComplete() {
        socket.currentUser.getBalance(function (err, userBalance) {
            socket.emit('withdrawComplete',{newBalance:userBalance.toString(10)});
        });
    }

    socket.on('withdraw', function (data) {
        if (undefined === data) {
            return;
        }

        //sanity check data
        if (isNaN(data.amount) ||  
            !CryptoAddressCheck(data.address)) { 
            withdrawComplete();
            return;
        }

        var amount = BigNumber(data.amount).round(config.DECIMAL_PLACES, BigNumber.ROUND_DOWN);

        if (amount.lte(0)) {
            withdrawComplete();
            return;
        }

        refreshUser(function () {
            var addr = data.address;
            socket.currentUser.getBalance(function (err,userBalance) {
                if (config.TOTAL_WITHDRAW_FEE.plus(amount).gt(userBalance)){
                    withdrawComplete();
                    return;
                }
                socket.currentUser.withdraw(addr,amount,withdrawComplete);
            });
        });
    });

    socket.on('getHistory', function (data) {
        if (undefined === data) {
            return;
        }
        if (isNaN(data.n) || data.n <= 0 || isNaN(data.offset) || data.offset < 0) {
            return;
        }
        refreshUser(function () {
            socket.currentUser.getHistory( 
                    parseInt(data.n), 
                    parseInt(data.offset),function (err, res) {
                if (err) {
                    console.error(err);
                    res = [];
                }
                //console.log("history got: ",res);
                socket.currentUser.getBalance(function (err,userBalance) {
                    socket.emit('gotHistory', {
                        transactions:res,
                        balance:userBalance.toString(10)});
                });
            });
        });
    });

    //data.chance is player odds of winning in percentage, [0.0001,99.99-100*house edge]
    socket.on('bet', function (data) {
        if (undefined === data) {
            return;
        }

        console.log("PEEPL BETTAN: ",data);
        // Sanity check on input
        if (isNaN(data.betSize) ||  (data.betSize !== 0 && data.betSize < config.MINIMUM_BET )) {
            console.log("Betsize improper:", data.betSize);
            return;
        }
        if (isNaN(data.chance) || data.chance < 0.0001 || config.HOUSE_EDGE.times(100).neg().plus(99.99).lt(data.chance)) {
            return;
        }
        
        refreshUser(function () {
            var betSize = BigNumber(data.betSize).round(config.DECIMAL_PLACES,BigNumber.ROUND_DOWN);
            var houseBankroll = BigNumber(House.House.bankRoll).round(config.DECIMAL_PLACES, BigNumber.ROUND_DOWN);

            // Make sure profit does not exceed maximum
            var mult = BigNumber(100).minus(config.HOUSE_EDGE.times(100)).div(data.chance);
            var maxProfit = config.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL.times(houseBankroll);

            if (betSize.times(mult).minus(betSize).greaterThan(maxProfit)) {
                return;
            }

            // Make sure stake does not exceed user's balance
            socket.currentUser.getBalance(function (err,userBalance) {
                if (err) {
                    console.error("Error getting user balance");
                }
                console.log("userbalance is "+ userBalance.toString(10));
                if (undefined === userBalance) {
                    return;
                }
                if (userBalance.lt(betSize)) {
                    return;
                }

                // Run bet
                console.log("running bet");
                socket.currentUser.bet(BigNumber(data.chance),data.isHighGuess,betSize, function (err, data) {
                    //console.log("Bet result: " + JSON.stringify(data))
                    console.log("betComplete emitting");
                    eventEmitter.emit("betComplete",data);
                });
            });
        });
    });
    
    socket.on("chatStarted", function (data) {
        console.log("Trying to join chat");
        Chat.getLastNMessages(config.CHAT_MESSAGE_HISTORY_LENGTH, function (err,chats){
            if (err) {
                console.error(err);
                return;
            }

            var messageLog = [];
        
            for (var i=0; i< chats.length ; i++) { 
                var curChat = chats[i];
                messageLog.push(
                    Chat.formatMessage(curChat.user,curChat.message)
                    );
            }
        
            socket.emit('chatJoined', messageLog);
            console.log("Chat joined successfully");
            socket.join('chat');
        });
    });
};
