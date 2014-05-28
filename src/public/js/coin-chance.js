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

$(function() {
var bets = [];
var messages = [];
/*global io*/
var Big = document.Big;
var socket = io.connect();
if ($("#isNewUser").val() === 'true') {
    var newUserModal = $("#newUserModal").modal();
    $("#newNameForm").submit(function (e){
        e.preventDefault();
        var name = $("#newName").val().trim();
        if (/^\w{3,32}$/.test(name)) {
            $("setDisplayName").removeClass('invalid');
            socket.emit('changeName', {newName:name});
            $("#newUserModal").modal("hide");
        } else {
            $("setDisplayName").addClass('invalid');
        }
        return false;
    });
}
var REQUIRED_CONFIRMATIONS = $("#REQUIRED_CONFIRMATIONS").val();
var decimalPlaces = parseInt($("#decimalPlaces").val());
var investmentDecimalPlaces = parseInt($("#investmentDecimalPlaces").val());
var betHiButton = $("#betHiButton");
var betLoButton = $("#betLoButton");
var betChance = $("#betChance");
var betSize = $("#betSize");
var betMult = $("#betMult");
var betProfit = $("#betProfit");
var maxProfit = $("#maxProfit");
var prevChance = null;
var prevSize = null;
var prevMult = null;
var prevProfit = null;
var chat = $("#chat");
var betList = $("#betList");
var betDisplay = $("#betDisplay");
var houseEdge = $("#houseEdge").val();
var houseCut = $("#houseCut").val();
var houseBankRoll = $("#housebankroll");
var houseLuck = $("#houseLuck");
var houseCommission = $("#houseCommission");
var houseWinCount = $("#houseWinCount");
var houseLossCount = $("#houseLossCount");
var invested = $("#invested");
var investedProfit = $("#investedProfit");
var houseInvestedProfit = $("#houseInvestedProfit");
var wins = $("#winCount").text()-0;
var losses = $("#lossCount").text()-0;
var depositAddress = $("#depositAddress").text();
var chatNotStarted = true;
var qrInjected = false;

function showMessage(s) {
    if (s) {
        //s = s.replace(/"rollid":(\d+)/, "<a href='/roll/$1'>$1</a>");
        messages.push(s);
        var html = '';
        for (var i=0; i<messages.length; i++) {
            html += messages[i] + '<br />';
        }
        chat.html(html);
        chat.scrollTop(chat[0].scrollHeight);
    } else {
        console.log("There is a problem:", s);
    }
}

function showBet(s) {
    if (s) {
        var betItem = $("<div class='bet'>");

        var nameItem = $("<span class='playerName'>");
        nameItem.text(s.playerDisplayName + " (" + s.playerID + ")");
        betItem.append(nameItem);
        
        var luckyItem = $("<span class='playerLucky'>");
        luckyItem.text(s.lucky);

        if (s.didWin) {
            if (s.lucky-0 < s.chance-0 && 
                    s.lucky-0 > 99.9999-s.chance) {
                luckyItem.addClass("good-luck");
            } else {
                luckyItem.addClass("good-choice");
            }
        } else if (s.lucky-0 > s.chance-0 && 
                s.lucky-0 < 99.9999-s.chance) {
                luckyItem.addClass("bad-luck");
        } else {
                luckyItem.addClass("bad-choice");
        }
        var betLink = $("<a href='/roll/" + s.rollid + "' />");
        betLink.append(luckyItem);
        betItem.append(betLink);

        var targetItem = $("<span class='playerTarget'>");
        targetItem.text((s.isHighGuess ? ">" : "<") +  s.target);
        betItem.append(targetItem);

        /*
        var chanceItem = $("<span class='playerChance'>");
        chanceItem.text(s.chance + " %");
        betItem.append(chanceItem);
        */

        var wagerItem = $("<span class='playerWager'>");
        wagerItem.text(s.stake);
        betItem.append(wagerItem);

        /*
        var multItem = $("<span class='playerMult'>");
        multItem.text(s.mult);
        betItem.append(multItem);
        */

        var profitItem = $("<span class='playerProfit'>");
        if (s.didWin) {
            profitItem.text("+"+s.profit);
            profitItem.addClass("win-profit");
        } else {
            // All losses should start with -, but dont make it redundant
            if (parseFloat(s.profit) === 0) {
                profitItem.text("-"+s.profit);
            } else {
                profitItem.text(s.profit);
            }
            profitItem.addClass("lose-profit");
        }

        betItem.append(profitItem);
        betList.prepend(betItem);

    } else {
        console.log("there is a problem:", s);
    }
}

socket.on('message', function (data) {
    showMessage(data.message);
});

socket.on('changeNameComplete', function (data) {
    var name = data.newName;
    $("#name").text(name);
    var partName = name.substitute(/^\(\d+\) /,"");
    $("#setDisplayName").value(partName);
});

socket.on('investingOccurred', function(data) {
    invested.text(parseFloat(data.currentInvested));
    $("#investTabInvested").text(parseFloat(data.currentInvested));
    $("#balance").text(parseFloat(data.currentBalance));
    $("#invest").val("");
    houseBankRoll.text(data.newBankRoll);
    $("investedPortion").text((parseFloat(data.currentInvested)*100/parseFloat(data.newBankRoll)).toFixed(6)+"%");
    maxProfit.text(data.maxProfit);
});

socket.on('divestingOccurred', function(data) {
    invested.text(parseFloat(data.currentInvested));
    $("#investTabInvested").text(parseFloat(data.currentInvested));
    $("#balance").text(parseFloat(data.currentBalance));
    $("#divest").val("");
    houseBankRoll.text(data.newBankRoll);
    $("investedPortion").text((parseFloat(data.currentInvested)*100/parseFloat(data.newBankRoll)).toFixed(6)+"%");
    maxProfit.text(data.maxProfit);
});

var UpdateAnyBet = function (data) {
    invested.text(data.newInvested);
    $("#investTabInvested").text(data.newInvested);

    investedProfit.text(data.newInvestedProfit);
    $("#investTabInvestedProfit").text(data.newInvestedProfit);

    houseBankRoll.text(data.newBankRoll);

    $("#investedPortion").text((parseFloat(data.newInvested)*100/parseFloat(data.newBankRoll)).toFixed(6)+"%");
    $("#balance").text(data.newBalance);
    houseInvestedProfit.text(data.newHouseInvestedProfit);
    houseLuck.text(data.newHouseLuck + "%");
    houseWinCount.text(data.newHouseWinCount);
    houseLossCount.text(data.newHouseLossCount);
    $("#houseWageredProfit").text(data.newHouseWageredProfit);
    maxProfit.text(data.maxProfit);
    houseCommission.text(data.houseCommission);
};

socket.on('betOccurred', function (data) {
    UpdateAnyBet(data);
    if (data.isMe) {
        myBetOccurred(data);
    }
    showBet(data);

    // Because maxprofit can change...
    validateInputs();
});

var myBetOccurred = function (data) {
    try {
        if (data.didWin) {
            wins += 1;
            $("#winCount").text(wins);
        } else {
            losses +=1;
            $("#lossCount").text(losses);
        }
        var prevBalance = Big($("#balance").text());
        var profit = Big(data.profit);
        var prevProfit = Big($("#wageredProfit").text());
        $("#wageredProfit").text(data.newWageredProfit);
        $("#balance").text(data.newBalance);
        $("#luck").text(data.newLuck + "%");
    } catch (err) {}
};

socket.on('randomizeOccurred', function (data) {
    $("#prevSSeed").text(data.prevSSeed);
    $("#prevSHash").text(data.prevSHash);
    $("#prevCSeed").text(data.prevCSeed);
    $("#prevBetCount").text(data.prevBetCount);
    $("#curSHash").text(data.curSHash);
    $("#customCSeed").val(data.curCSeed);
    $("#randomizeVals").text(
        '"'+data.prevSSeed+
        '" "'+data.prevSHash+
        '" "'+data.prevCSeed+
        '" "'+data.prevBetCount+
        '"'
    );
    $("#randomizeDialog").modal();
});

function bet(isHiBet) {
    try {
        var wager = Big($(betSize).val());
        socket.emit('bet', {
            betSize: wager.toString(),
            chance: betChance.val(),
            isHighGuess: isHiBet});
    } catch (err) {}
}

betHiButton.click(function(){bet(true);});
betLoButton.click(function(){bet(false);});
$("#decreaseChance").click(function(){
    try {
        var newc = Big(betChance.val());
    
        newc = newc.minus(1);
        betChance.val(newc.toFixed(decimalPlaces).replace(/\.?0+$/,""));
        chanceUpdated();
    } catch (err) {}
});
$("#increaseChance").click(function(){
    try {
        var newc = Big(betChance.val());

        newc = newc.plus(1);
        betChance.val(newc.toFixed(decimalPlaces).replace(/\.?0+$/,""));
        chanceUpdated();
    } catch (err) {}
});

$("#halveMult").click(function(){
    try {
        var newm = Big(betMult.val());
        
        newm = newm.div(2);
        betMult.val(newm.round(8,0).toFixed(8).replace(/\.?0+$/,""));
        multUpdated();
    } catch (err) {}
});
$("#doubleMult").click(function(){
    try {
        var newm = Big(betMult.val());
    
        newm = newm.times(2);
        betMult.val(newm.round(8,0).toFixed(8).replace(/\.?0+$/,""));
        multUpdated();
    } catch (err) {}
});
$("#halveSize").click(function(){
    try {
        var news = Big(betSize.val());

        news = news.div(2);
        betSize.val(news.round(decimalPlaces,0).toFixed(decimalPlaces).replace(/\.?0+$/,""));
        sizeUpdated();
    } catch (err) {}
});
$("#doubleSize").click(function(){
    try {
        var news = Big(betSize.val());

        news = news.times(2);
        betSize.val(news.round(decimalPlaces,0).toFixed(decimalPlaces).replace(/\.?0+$/,""));
        sizeUpdated();
    } catch (err) {}
});
$("#decreaseProfit").click(function(){
    try {
        var newp = Big(betProfit.val());

        newp = newp.minus(1);
        betProfit.val(newp.toFixed(decimalPlaces).replace(/\.?0+$/,""));
        profitUpdated();
    } catch (err) {}
});
$("#increaseProfit").click(function(){
    try {
        var newp = Big(betProfit.val());

        newp = newp.plus(1);
        betProfit.val(newp.toFixed(decimalPlaces).replace(/\.?0+$/,""));
        profitUpdated();
    } catch (err) {}
});

$("#randomizeButton").click(function(e) {
    socket.emit('randomize');
});

$("#investButton").click(function(e) {
    try {
        var investAmount = Big($("#invest").val());
        var balance = Big($("#balance").text());
        if (investAmount.gt(balance)) {
            return;
        }

        socket.emit('invest', {
            'investAmount': investAmount.toString()
        });
    } catch (err) {}
});

$("#divestButton").click(function(e) {
    try {
        var divestAmount = Big($("#divest").val());
        var investedAmount = Big($("#invested").text());
        if (divestAmount.gt(investedAmount)) {
            return;
        }

        socket.emit('divest', {
            'divestAmount': divestAmount.toString()
        });
    } catch (err) {}
});

$("#logoutButton").click(function(e) {
    window.location = "/logout";
});

$("#sendCustomSeed").click(function(e) {
    socket.emit('sendCustomSeed', {
        clientSeed: $("#customCSeed").val()
    });
    $("#randomizeDialog").modal("hide");
});

$("#chattab").on('shown.bs.tab', function (e) {
    if (chatNotStarted) {
        socket.emit('chatStarted',{});
        chatNotStarted = false;
    }
});

$("#changeNameForm").submit(function (e) {
    e.preventDefault();
    var name = $("#setDisplayName").val().trim();
    if (/^\w{3,32}$/.test(name)) {
        $("setDisplayName").removeClass('invalid');
        socket.emit('changeName', {newName:name});
    } else {
        $("setDisplayName").addClass('invalid');
    }

    return false;
});


socket.on('accountSetupComplete', function (data) {
    if (!data.success) {
        alert(data.error);
    } else {
        $("#usernameSetupZone").hide();
        $("#setPassword").val("");
        $("#setPasswordConfirm").val("");
        alert("Account saved!");
    }
});

$("#accountSetupForm").submit(function (e) {
    e.preventDefault();
    var passwd = $("#setPassword").val();
    var passwdConfirm = $("#setPasswordConfirm").val();

    if (passwdConfirm !== passwd) {
        $("#setPasswordConfirm").addClass('invalid');
        return false;
    }

    var username = "";
    if ($("#setUsername").length === 1) {
        username = $("#setUsername").val();
    }

    socket.emit('accountSetup', {
        "username": username,
        "password": passwd});

    $("#setPasswordConfirm").removeClass('invalid');

    return false;
});

$("#chatForm").submit(function (e) {
    socket.emit('chatMessage', {message: $("#chatField").val()});
    $("#chatField").val("");
    return false;
});

socket.on('chatJoined', function (messages) {
    for (var i=messages.length-1; i >= 0 ; i--) {
        var msg = messages[i];
        showMessage(msg);
    }
});


$("#depositQR").click(function(){
    window.prompt("Deposit address", depositAddress);
});

$("#historyButton").click(function() {
    socket.emit("getHistory",{n:30,offset:0});
});

$("#depositWithdrawButton").click(function(e) {
    if (!qrInjected) {
        qrInjected = true;
        $("#depositQR").qrcode({width: 128,height:128,text:depositAddress});
    }
    $("#depositWithdrawDialog").modal();
});

socket.on("gotHistory", function (data) {
    $("#historyDialog").modal();
    $("#balance").text(data.balance);
    if (!data.transactions) {
        return;
    }
    $("#history").html("");
    for (var i = 0; i < data.transactions.length ; i++) {
        var tx = data.transactions[i];
        if (tx.category !== "receive" && tx.category !== "send") {
            continue;
        }
        var amount = tx.amount;
        var confirmed;
        if (REQUIRED_CONFIRMATIONS <= parseInt(tx.confirmations)) {
            confirmed = "yes";
        } else {
            confirmed = tx.confirmations + " / " + REQUIRED_CONFIRMATIONS;
        }

        var line = $("<div class='historyLine'/>");
        line.append($("<div class='section'>").text(
            "Time: " + 
            (new Date(tx.time*1000)).toUTCString()));

        line.append($("<div class='section'>").text(
            "Amount: " + 
            tx.amount));

        line.append($("<div style='text-overflow:hidden' class='section'>").text(
            "From: " + 
            tx.address));

        line.append($("<div class='section'>").text(
            "Confirmed: " + 
            confirmed));

        $("#history").prepend($("<br />"));
        $("#history").prepend(line);
    }
});


socket.on("withdrawComplete",function(data) {
    $("#balance").text(data.newBalance);
    $("#depositWithdrawDialog").modal("hide");
    $("#withdrawButton").removeAttr('disabled');
    $("#withdrawButton").removeClass('btn-disabled');

});

socket.on("betHistory", function(data) {
    for (var i in data.bets) {
        showBet(data.bets[i]);
    }
});

$("#withdrawButton").click(function(e) {
    try {
        e.preventDefault();
        var addr = $("#withdrawAddress").val();
        var amount = Big($("#withdrawAmount").val());
        var balance = Big($("#balance").text());
        var fee = Big($("#withdrawFee").val());
        var valid = true;

        if (balance.lt(amount.plus(fee))) {
            valid = false;
            $("#withdrawAmount").addClass('invalid');
        }

        if (valid) {
            $("#withdrawAmount").removeClass('invalid');
            $("#withdrawButton").attr('disabled','true');
            $("#withdrawButton").addClass('btn-disabled');
            socket.emit('withdraw', {address:addr,"amount":amount.toString()});
        }
    } catch (err) {}

});

function invalidBetReason(betReason){
    $("#invalidBetReason").text(betReason);
    if (betReason === "" || betReason === undefined) {
        $("#invalidBetReason").hide();
    } else {
        $("#invalidBetReason").show();
    }
}

function validateInputs() {
    try {
        var balanceVal = parseFloat($("#balance").text());
        var invalid = false;
        //Validate chance. 
        //>= 0.0001, <=99.99-100*houseEdge
        var chance = Big(betChance.val());
        if (chance.lt(0.0001)) {
            betChance.addClass('invalid');
            invalid = true;
            invalidBetReason("Bet chance is too low");
        } else if (chance.gt(99.99-100*houseEdge)){
            betChance.addClass('invalid');
            invalid = true;
            invalidBetReason("Bet chance is too high");
        } else {
            betChance.removeClass('invalid');
        }

        //Validate bet size.
        //0 OR >=betMin, <=balance
        var betSizeVal = Big(betSize.val());
        if (betSizeVal.eq(0)) {
            betSize.removeClass('invalid');
        } else if (betSizeVal.lt($("#minBet").val())) {
            betSize.addClass('invalid');
            invalid = true;
            invalidBetReason("Bet size is too small");
        } else if (betSizeVal.gt(balanceVal)) {
            betSize.addClass('invalid');
            invalid = true;
            invalidBetReason("Bet size can't exceed your balance");
        } else {
            betSize.removeClass('invalid');
        }

        //Validate profit
        // >= 1e-8, <= maxProfit
        var maxProfitVal = Big($("#maxProfit").text());
        var betProfitVal = Big(betProfit.val());
        if ( (!betProfitVal.eq(0)) && betProfitVal.lt(1e-8)) {
            betProfit.addClass('invalid');
            invalid = true;
            invalidBetReason("Your profit is too small (But zero is okay)");
        } else if (betProfitVal.gt(maxProfitVal)) {
            betProfit.addClass('invalid');
            invalid = true;
            invalidBetReason("Profit can't exceed max profit (" + maxProfitVal.toString() + ")");
        } else {
            betProfit.removeClass('invalid');
        }

        if (invalid) {
            betHiButton.attr('disabled','disabled');
            betLoButton.attr('disabled','disabled');
        } else {
            invalidBetReason();
            betHiButton.removeAttr('disabled');
            betLoButton.removeAttr('disabled');
        }
    } catch (err) {}
    
}

// Assume bet size is correct, unless profit is modified. 
// In that case, change bet size only.

function chanceUpdated() {
    try {
        var chance = Big(betChance.val());
        if (prevChance !== null && chance.eq(prevChance)) {
            return;
        }

        //Keep chance small
        prevChance=chance;

        $('#hiamount').text(Big(99.9999).minus(chance).toFixed(4));
        $('#loamount').text(Big(chance).toFixed(4));
    
        //set Mult accordingly
        var mult = Big(1).minus(houseEdge).times(100).div(chance).round(8,0);
        $(betMult).val(mult.toFixed(8).replace(/\.?0+$/,""));
    
        //set profit
        var size = Big(betSize.val());

        var profit = mult.times(size).minus(size).round(decimalPlaces,0);
        betProfit.val(profit.toFixed(decimalPlaces).replace(/\.?0+$/,""));

        validateInputs();
    } catch (err) {}
}

function multUpdated() {
    try {
        var mult = Big($(betMult).val());
        if (prevMult !== null && mult.eq(prevMult)) {
            return;
        }

        // Keep mult small
        //mult = Math.floor(mult*1e8)/1e8;
        //$(betMult).val(mult);

        prevMult = mult;

        // set Chance accordingly
        var chance = Big(1).minus(houseEdge).div(mult).times(100).round(4,0);
        betChance.val(chance.toFixed(4).replace(/\.?0+$/,""));

        $('#hiamount').text(Big(99.9999).minus(chance).toFixed(4));
        $('#loamount').text(Big(chance).toFixed(4));

        //set profit
        var size = Big(betSize.val());

        var profit = Big(mult).times(size).minus(size).round(decimalPlaces,0);
        betProfit.val(profit.toFixed(decimalPlaces).replace(/\.?0+$/,""));

        validateInputs();
    } catch (err) {}
}

function sizeUpdated() {
    try {
        var size = Big(betSize.val());
        if (prevSize !== null && size.eq(prevSize)) {
            return;
        }

        prevSize = size;

        var mult = Big(betMult.val());

        var profit = Big(mult).times(size).minus(size).round(decimalPlaces,0);
        betProfit.val(profit.toFixed(decimalPlaces).replace(/\.?0+$/,""));

        validateInputs();
    } catch (err) {}
}

function profitUpdated() {
    try {
        var profit = Big(betProfit.val());
        if (prevProfit !== null && profit.eq(prevProfit)) {
            return;
        }

        prevProfit = profit;

        var mult = parseFloat(betMult.val());

        var size = Big(profit).div(Big(mult).minus(1)).round(decimalPlaces,0);
        betSize.val(size.toFixed(decimalPlaces).replace(/\.?0+$/,""));

        validateInputs();
    } catch (err) {}
}

betChance.on('keyup paste', chanceUpdated);
betMult.on('keyup paste', multUpdated);
betSize.on('keyup paste', sizeUpdated);
betProfit.on('keyup paste', profitUpdated);

betMult.val(2);
betSize.val(1);
multUpdated();
$("#joinChatButton").removeAttr('disabled');
$("#withdrawButton").removeAttr('disabled');
});
