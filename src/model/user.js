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
    autoIncrement = require('mongoose-auto-increment'),
    crypto = require('crypto'),
    biguint = require('biguint-format'),
    RollModel = require('./roll'),
    bcrypt = require('bcrypt'),
    Coin = require('./coin'),
    ChatModel = require('./chat'),
    House = require('./house'),
    GetLucky = require('./getlucky'),
    config = require('../../config'),
    randomName = require('random-name'),
    BigNumber = require('bignumber.js');

BigNumber.config({ DECIMAL_PLACES:4*config.INVESTMENT_DECIMAL_PLACES, ROUNDING_MODE: BigNumber.ROUND_DOWN});

var userSchema = mongoose.Schema({
    lastLogin: Date,
    accountSecret: {                // This is effectively a player's permament username/password combo. Keep PRIVATE
                        type: 'string',
                        unique: true,
                        required: true},           
    hash: {
                        type: 'string',
                        unique: true,
                        required: true},
    displayName: String,            // What shows up in chat
    loginName: {                    //Logs in using this name
                        type: 'string',
                        lowercase: true,
                        sparse: true,
                        unique: true},
    loginPassword: String,           // Logs in using this password
    passwordResetKey: {
                        type: 'string',
                        sparse: true,
                        unique: true},
    otpSecret: {
                        type: 'string',
                        unique: true,
                        sparse: true},
    email: String,                   // Contact email
    emergencyAddress: String,        // Emergency withdrawal address
    wins: Number,                    // Total win count
    losses: Number,                  // Total loss count
    luck: String,                    // Win count / expected win count
    wagered: String,                 // Total amount wagered
    wageredProfit: String,           // Total amount profit from wagers 
    invested: String,                // Current amount invested 
    investedProfit: String,          // Total amount profit from investing 
    softNetBalance: String,             // User's balance that isn't in user's account 
    serverSeed: String,              // User's current server seed
    clientSeed: String,              // User's current client seed
    clientSeedLocked: Boolean,       // If User can still change the client seed
    betCount: Number                 // How many bets have been done at current client seed
});

userSchema.plugin(autoIncrement.plugin, 'User');

userSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('loginPassword') || ! user.loginPassword) {
        return next();
    }

    // hash the password along with our new salt
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(user.loginPassword,  salt, function(err, hash) {
            if (err) {
                return next(err);
            }
            // override the cleartext password with the hashed one
            user.loginPassword = hash;
            next();
        });
    });
});

userSchema.methods.chat = function(msg, cb) {
    var chat = new ChatModel.ChatModel({user:this.id,message:msg});
    chat.save(cb);  
};

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.loginPassword, function(err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

userSchema.methods.updateLastLogin = function() {
    this.lastLogin = Date.now();
    this.save();
};

userSchema.methods.getCoinAddress = function(cb) {
    Coin.getUserAddress(this.hash, cb);
};

// amount is a BigNumber
userSchema.methods.withdraw = function(addr,amount,cb) {
    var user = this;
    Coin.withdraw(this.hash, addr, amount, function (err){
        console.log("in withdraw cb in usermodel. amount=",amount);
        if (err) {
            console.error(err);
            cb(err);
            return;
        }
        
        user.softNetBalance = BigNumber(user.softNetBalance).minus(
            amount.plus(config.TOTAL_WITHDRAW_FEE)
            ).toString(10);
        user.save(cb);
    });
};

userSchema.methods.getHistory = function (n, offset, cb) {
    Coin.getHistory(this.hash,n,offset,cb);
};

// investAmount is a BigNumber
userSchema.methods.invest = function(investAmount,cb) {

    this.softNetBalance = investAmount.neg().plus(this.softNetBalance).toString(10);
    this.invested = investAmount.plus(this.invested).toString(10);
    this.save( function (err, resUser) {
        if (err) {
            cb(err);
        }
        House.House.bankRoll = investAmount.plus(House.House.bankRoll).toString(10);
        House.House.save( function (err, resHouse) {
            if (err) {
                cb(err);
            }
            resUser.getBalance( function (err,bal) {
                cb(err, bal, BigNumber(resUser.invested)); 
            });
        });
    });
};

// divestAmount is a BigNumber
userSchema.methods.divest = function(divestAmount, cb) {
    this.softNetBalance = divestAmount.plus(this.softNetBalance).toString(10);
    this.invested = divestAmount.neg().plus(this.invested).toString(10);
    this.save( function (err, resUser) {
        if (err) {
            cb(err);
        }
        House.House.bankRoll = divestAmount.neg().plus(House.House.bankRoll).toString(10);
        House.House.save( function (err, resHouse) {
            if (err) {
                cb(err);
            }
            resUser.getBalance( function (err,bal) {
                cb(err,bal, BigNumber(resUser.invested));
            });
        });
    });
};

userSchema.methods.useClientSeed = function (clientSeed) {
    if (this.clientSeedLocked) {
        return;
    }

    this.clientSeed = clientSeed;
    this.clientSeedLocked = true;
    this.save();
};

userSchema.methods.randomize = function(cb) {
    var previousSeed = this.serverSeed;
    var previousHash =  crypto.createHash('sha256').update(this.serverSeed).digest('hex');
    var previousClientSeed = this.clientSeed;
    var previousBetCount = this.betCount;
    
    var seeds = exports.randomize();
    this.clientSeed = seeds.cSeed;
    this.clientSeedLocked = false;
    this.serverSeed = seeds.sSeed;
    this.betCount = 0;
    this.save();

    RollModel.RollModel.update({'serverSeedHash':previousHash}, {'serverSeedRevealed':true}).exec();
    
    cb (
            previousSeed,
            previousHash,
            previousClientSeed,
            previousBetCount,
            crypto.createHash('sha256').update(this.serverSeed).digest('hex'),this.clientSeed);
};

userSchema.methods.getLuckyNumber = function() {
    return GetLucky.getLucky(this.betCount, this.serverSeed,this.clientSeed);
};


userSchema.methods.getBalance = function(cb) {
    var usr = this;
    Coin.getUserBalance(usr.hash, function(err,bal){
        if (err) {
            console.error(err);
            cb(err, BigNumber(usr.softNetBalance));
        } else {
            console.log("Got balance: ",bal.toString());
            if (bal.greaterThan(0)) {
                Coin.subsume(usr.hash, function (err, subsumed) {
                    if (err) {
                        console.error("Error subsuming coins!  " + err);
                        cb(err, BigNumber(usr.softNetBalance));
                    } else {
                        usr.softNetBalance = subsumed.plus(usr.softNetBalance).toString(10);
                        usr.save(function (err, savedUser) {
                            if (err) {
                                console.error("Error saving user after subsumption");
                                cb(err, BigNumber(usr.softNetBalance));
                            }
                            cb(err, BigNumber(savedUser.softNetBalance));
                        });
                    }
                });
            } else {
                cb(err, BigNumber(usr.softNetBalance));
            }
        }
    });
};

// chance is a BigNumber from 0-100
// betSize is a BigNumber
userSchema.methods.bet = function(chance,isHighGuess, betSize, cb) {
    this.clientSeedLocked = true;
    this.betCount += 1;

    // luckyNumber is a BigNumber from 0-100 
    var luckyNumber = this.getLuckyNumber();

    var target = chance;
    if (isHighGuess) {
        target = chance.neg().plus("99.9999");
    }

    var win = (
            (isHighGuess && target.lessThan(luckyNumber)) ||
            (!isHighGuess && target.greaterThan(luckyNumber))
            );

    var edge = config.HOUSE_EDGE;
    var multiplier = BigNumber(100).minus(edge.times(100)).div(chance);
    var rollInfo = {
        'date': Date.now(),
        'userId': this.id,
        'multiplier': multiplier.toFixed(8),
        'stake': betSize.toFixed(config.DECIMAL_PLACES),
        'profit': win ? betSize.times(multiplier).minus(betSize).toFixed(config.DECIMAL_PLACES) : betSize.neg().toFixed(config.DECIMAL_PLACES), 
        'chance': chance.toFixed(8),
        'target': target.toFixed(4),
        'isHighGuess': isHighGuess,
        'lucky': luckyNumber.toFixed(4),
        'didWin': win,
        'serverSeedHash': crypto.createHash('sha256').update(this.serverSeed).digest('hex'),
        'serverSeed': this.serverSeed,
        'serverSeedRevealed': false,
        'clientSeed': this.clientSeed,
        'nonce': this.betCount
    };
    var roll = new RollModel.RollModel(rollInfo);
    //console.log(roll);

    this.wagered = betSize.plus(this.wagered).toFixed(config.DECIMAL_PLACES);

    var minLuck = BigNumber(0.000001);
    if (minLuck.greaterThan(this.luck)) {
        this.luck = minLuck.toString(10);
    }
    if (minLuck.greaterThan(House.House.luck)) {
        House.House.luck = minLuck.toString(10);
    }
    var expectedPrevWins = BigNumber(this.wins).div(this.luck).times(100);
    var expectedHousePrevWins = BigNumber(House.House.wins).div(House.House.luck).times(100);

    var delta;

    if (win) {
        this.wins = BigNumber(1).plus(this.wins).toString(10);
        House.House.wins = BigNumber(1).plus(
                House.House.wins).toString(10);
        delta = BigNumber(rollInfo.profit).neg();
    } else {
        this.losses = BigNumber(1).plus(this.losses).toString(10);
        House.House.losses = BigNumber(1).plus(
                House.House.losses).toString(10);
        delta = BigNumber(rollInfo.stake);
    }
    var user = this;

    var cut = BigNumber(rollInfo.stake).times(config.HOUSE_CUT).round(config.INVESTMENT_DECIMAL_PLACES,BigNumber.ROUND_DOWN);

    exports.ModifyInvestments(delta.minus(cut), cut, function (err) {
        if (err) {
            console.error(err);
        }

        var profit = BigNumber(rollInfo.profit);
        user.wageredProfit = profit.plus(
            user.wageredProfit).toString(10);
        user.softNetBalance = profit.plus(
            user.softNetBalance).toString(10);
        House.House.wageredProfit = profit.plus(
            House.House.wageredProfit).toString(10);

        user.luck = BigNumber(100).times(user.wins).div(
                expectedPrevWins.plus(chance.div(100))).toFixed(8);
        House.House.luck = 100 * House.House.wins / ( expectedHousePrevWins + chance/100);
        House.House.luck = BigNumber(100).times(
            House.House.wins).div(
                expectedHousePrevWins.plus(chance.div(100))).toFixed(8);

        console.log("Saving roll...");
    
        var displayName = user.displayName;
        var luck = user.luck;

        user.save(function (err,savedUser){
            if (err) {
                console.error(err);
                cb("There was a problem saving a user after a bet", null);
                return;
            }
            House.House.save(function (err, savedHouse){
                if (err) {
                    console.error(err);
                    cb("There was a problem saving the house after a bet", null);
                    return;
                }
                roll.save(function (err,savedRoll){
                    if (err) {
                        console.error(err);
                        cb("There was a problem saving a bet",null);
                        return;
                    }
                    //console.log(savedRoll)
                    var returndata = {
                        'rollid': savedRoll._id,
                        'playerDisplayName': displayName,
                        'playerID': rollInfo.userId,
                        'lucky': rollInfo.lucky,
                        'target': rollInfo.target,
                        'didWin': win,
                        'profit': rollInfo.profit,
                        'chance': rollInfo.chance,
                        'mult': "x"+rollInfo.multiplier,
                        'stake': rollInfo.stake,
                        'date': rollInfo.date,
                        "isHighGuess": isHighGuess,
                        "newLuck": luck,
                        "newHouseLuck": House.House.luck,
                        "newHouseWinCount": House.House.wins,
                        "newHouseLossCount": House.House.losses,
                        "newHouseWageredProfit": House.House.wageredProfit,
                        "newHouseInvestedProfit": House.House.investedProfit,
                        "newBankRoll": House.House.bankRoll,
                        "maxProfit": config.HOUSE_MAX_USER_PROFIT_PORTION_OF_BANKROLL.times(House.House.bankRoll).toFixed(config.DECIMAL_PLACES),
                        "houseCommission": House.House.revenue
                    };
                    //console.log("returning: " + JSON.stringify(returndata));
                    cb(null,returndata);
                });
            });
        });
    });
};


exports.UserModel = mongoose.model( 'User',userSchema);

exports.Login = function(username, password,otp, cb) {
    exports.UserModel.findOne({loginName:username}, function (err, user) {
        if (err||!user) {
            cb(err, false);
        } else {
            user.comparePassword(password, function (err, isMatch) {
                if (err) {
                    cb(err, isMatch);
                } else if (! user.otp) {
                    cb(null, isMatch, user);
                } else {
                    user.verifyOtp(otp, function (err, isMatch) {
                        if (err) {
                            cb(err, false);
                        } else if (isMatch) {
                            cb(null, true, user);
                        } else {
                            cb(null, false, user);
                        }
                    });
                }
            });
        }
    });
};

exports.ModifyInvestments = function(diffTotal, cutTotal, cb) {
    diffTotal = BigNumber(diffTotal);
    cutTotal = BigNumber(cutTotal);

    var bankRoll = BigNumber(House.House.bankRoll);
    console.log("diffTotal, cutTotal" + diffTotal.toString(10) + " " + cutTotal.toString(10));

    console.log("Starting modifying investments");
    exports.UserModel.find(
        {invested: {$gt:0}}, 
        function (err, users) {
            users.reduce(function(totals,usr){
                if (totals.diff.equals(0)) {
                    return totals;
                }

                var diff = totals.diff.times(usr.invested).div(totals.investment).round(config.INVESTMENT_DECIMAL_PLACES,BigNumber.ROUND_DOWN);
                var next = {
                    diff: diff.neg().plus(totals.diff),
                    investment: totals.investment.minus(usr.invested)
                };
                usr.invested = diff.plus(usr.invested).toString(10);
                usr.investedProfit = diff.plus(usr.investedProfit).toString(10);
                usr.save();
                return next;
            },{
                diff: BigNumber(diffTotal),
                investment: bankRoll
            });
            House.House.investedProfit = diffTotal.plus(House.House.investedProfit).toString(10);
            House.House.bankRoll = diffTotal.plus(House.House.bankRoll).toString(10);
            House.House.revenue = cutTotal.plus(House.House.revenue).toString(10);
            cb(null);
        }
    );
};

exports.getUserByHash = function getUserByHash(hash,cb) {
    var User = mongoose.model('User');
    User.findOne({'hash': hash}, cb);
};

exports.getUserByAccountSecret = function getUserByAccountSecret(accountSecret,cb) {
    var User = mongoose.model('User');
    //console.log ("looking for user as: " + accountSecret);
    User.findOne({'accountSecret': accountSecret}, cb);
};

exports.randomize = function randomize() {
    var sSeed = crypto.randomBytes(48).toString('base64');
    var cSeed = biguint(crypto.randomBytes(10),'dec', {padstr:'0', size:24});
    cSeed = cSeed.substr(cSeed.size-24);

    return {
        "sSeed":sSeed,
        "cSeed":cSeed
    };
};

exports.createNewUser = function createNewUser(cb) {
    var seeds = exports.randomize();
    // TODO: Any way to ensure that we regen aSec until a unique one occurs?
    var aSec = crypto.randomBytes(64).toString('hex');
    var aSecHash = crypto.createHash('sha256').update(aSec).digest('hex');

    var userInfo = {
        accountSecret: aSec,
        hash: aSecHash,
        displayName: randomName.first() + " " + randomName.last(), 
        loginPassword: null,
        email: "",
        emergencyAddress: "",
        wins: 0,
        losses: 0,
        luck: "100.0",
        wagered: "0",
        wageredProfit: "0",
        softNetBalance: "0",
        invested: "0",
        investedProfit: "0",
        serverSeed: seeds.sSeed,
        clientSeed: seeds.cSeed,
        clientSeedLocked: true,
        betCount: 0};

    var User = mongoose.model('User');
    var newUser = new User(userInfo);
    newUser.save( function (userErr, userRes) {
        if (userErr || ! userRes) {
            console.error("----Error encountered making a new user.----");
        }

        House.House.save( function (err, res){
            cb(userErr,userRes);
        });
    });
};
