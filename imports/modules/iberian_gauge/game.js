import { demoUpdate } from '/imports/api/GamesCollection';
import { GameOp, genericGameUpdateWithCustomFilter, createStubbedGame, setGamePlayers, genericGameUpdate, renderTemplate } from '/client/main';

var LEGAL_GAME_ROUNDS = [
	"SR1", "OR1", "SR2", "OR2a", "OR2b", "SR3", "OR3a", "OR3b", "SR4", "OR4"
];

var RAILROAD_COLORS = [
    "yellow", "red", "purple", "orange", "aqua"
];

var PLAYER_COLORS = [
    "pink", "white", "green", "blue", "magenta"
];

var STOCK_BUMP_THRESHOLDS = [
    100, 90, 80, 70, 55, 40, 25
];

var NUM_SHARES_BY_RAILROAD = {
    "red": 6,
    "orange": 5,
    "aqua": 5,
    "purple": 4,
    "yellow": 4
};

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  var currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

/*
export const foo = function() {
	console.log("foo iberican gauge!");
};
export const bar = "hello from ibgauge module!";
*/

// var something = 0;
Session.set("something", 0);

export const getSetupTemplateVars = function() { return { } };

export const getTemplateVars = function() {
	return {
		"hello": "world",
		"mol": 42
	}
};

import "./game.html";

Template.initialSetup.helpers({
	mol() {
		console.log("helper for mol firing");
		return Session.get("something");
	}
});

var setGameOpListeners = function() {
	$("#float_run").click(function() {
		var floatPlayer = $("#float_player").val();
		var floatCompany = $("#float_company").val();
		var floatPrice = $("#float_price").val();

		// TODO - when player is selected we could disable certain float values...
		var player = getPlayerByName(floatPlayer);
		if (player.cash < floatPrice) {
			alert(floatPlayer + " only has " + player.cash + " pesetas; cannot float " + floatCompany + " at " + floatPrice + ".");
			return;
		} else {
			// TODO - some ops are 'auto' -- made by the game (like a transition from SR1->OR1). These ones maybe shouldn't
			// display, should be bundled together when undo'ing, etc.

			var op = new FloatOp(floatPlayer, floatCompany, floatPrice);
			op.sendActionToServer();
		}
	});

	$("#invest_run").click(function() {
		var investPlayer = $("#invest_player").val();
		var investCompany = $("#invest_company").val();
		var company = getCompanyByColor(investCompany);

		var player = getPlayerByName(investPlayer);
		if (player.cash < company.stock) {
			alert(investPlayer + " only has " + player.cash + " pesetas; cannot invest in " + investCompany + ".");
			return;
		} else {
			var shareIndex = -1;
			for (var i = 0 ; i < company.shares.length ; i++) {
				if (company.shares[i] == null) {
					shareIndex = i;
					break;
				}
			}

			if (shareIndex >= 0) {
				var op = new InvestOp(investPlayer, investCompany, company.stock, shareIndex);
				op.sendActionToServer();
			}
		}
	});

	$("#stock_pass_run").click(function() {
		var passPlayer = $("#stock_pass_player").val();

		// TODO - when player is selected we could disable certain float values...
		var player = getPlayerByName(passPlayer);

		var op = new StockPassOp(passPlayer);
		op.sendActionToServer();
	});
};

export const makeOpReadable = function(op) {
	var rebuilt = GameOp.reconstruct(op);
	return rebuilt.getReadableVersion();
};

export const postGameCreated = function() {
	console.log("postGameCreated!");

	// $("div#iberian_gauge").html("this was set by ibgauge js a");

	/*
	let timerId = setInterval(function() {
		Session.set("something", Session.get("something") + 1);
		console.log("timer running; now [" + Session.get("something") + "]");
	}, 1000);
	*/
};

var makeRandomizedCompanyList = function() {
	var randomCompanyOrder = shuffle(RAILROAD_COLORS);

	var companies = [];
	for (var i = 0 ; i < randomCompanyOrder.length ; i++) {
		var numShares = NUM_SHARES_BY_RAILROAD[randomCompanyOrder[i]];
		var shares = [];
		for (var k = 0 ; k < numShares ; k++) {
			shares.push(null);
		}

		var company = {
			"color": randomCompanyOrder[i],
			"stock": null,
			"income": null,
			"treasury": null,
			"shares": shares
		};

		companies.push(company);
	}

	return companies;
};

var rebuildDash = function() {
	var gameState = Session.get("GAME_STATE");
	window.gameState = gameState;
	if (gameState === undefined || gameState["_id"] === undefined) {
		console.log("BAILING");
		return;
	}

	var container = $("#ibDash").empty();

	var table = $("<table border=0>").addClass("dividendChart").appendTo(container);

	var companies = gameState["companies"];

	var justRenderedStockBump = false;
	for (var income = 100 ; income >= 10 ; income -= 5) {
		var incomeRow = $("<tr/>").appendTo(table);

		if (STOCK_BUMP_THRESHOLDS.indexOf(income) != -1) {
			$("<td rowspan=2/>").addClass("stockbump").html("&#128200;&#10140;").appendTo(incomeRow);
			justRenderedStockBump = true;
		} else {
			if (justRenderedStockBump) {
				justRenderedStockBump = false;
			} else {
				$("<td/>").html("&nbsp;").appendTo(incomeRow);
			}
		}

		for (var i = 0 ; i < companies.length ; i++) {
			var company = companies[i];
			// $("<td/>").html(company.income == income ? calculateDividendForCompany(company) : "&nbsp;").appendTo(incomeRow);
			var td = $("<td/>").appendTo(incomeRow);

			if (company.income == income) {
				var circle = $("<div/>").addClass("railroad circle small").addClass(company.color).appendTo(td);
				var p = $("<p/>").html(calculateDividendForCompany(company)).appendTo(circle);
			} else {
				// td.html("&nbsp;");
				var circle = $("<div/>").addClass("railroad circle tiny ghosted").addClass(company.color).appendTo(td);
				var p = $("<p/>").html(calculateDividendForCompanyAtIncome(company, income)).appendTo(circle);
			}
		}
	}

	var treasuryRow = $("<tr/>").appendTo(table);
	$("<td/>").html("Treasury").appendTo(treasuryRow);
	for (var i = 0 ; i < companies.length ; i++) {
		var company = companies[i];
		var td = $("<td/>").html(company["treasury"] == null ? "&nbsp;" : company["treasury"]).appendTo(treasuryRow);
	}

	var stockRow = $("<tr/>").appendTo(table);
	$("<td/>").html("Stock").appendTo(stockRow);
	for (var i = 0 ; i < companies.length ; i++) {
		var company = companies[i];
		var td = $("<td/>").html(company["stock"] == null ? "&nbsp;" : company["stock"]).appendTo(stockRow);
	}


	var playerTable = $("<table border=0>").addClass("playerHoldings").appendTo(container);
	var header = $("<tr/>").appendTo(playerTable);
	$("<td/>").html("&nbsp;").appendTo(header);
	$("<td/>").html("Cash").appendTo(header);
	var players = gameState["players"];
	for (var i = 0 ; i < players.length ; i++) {
		var playerRow = $("<tr/>").appendTo(playerTable);
		$("<td/>").html(players[i].name).appendTo(playerRow);
		$("<td/>").html(players[i].cash).appendTo(playerRow);
	}

	buildUi();

	displayLogData();
};

var buildUi = function() {
	var gameState = Session.get("GAME_STATE");
	var companies = gameState["companies"];

	if (gameState.state.startsWith("SR")) {
		$("#ui_stock_rounds").show();
		$("#ui_operating_rounds").hide();

		// active player
		var activePlayerIdx = getPlayerIndexByName(gameState.playerTurn);
		var activePlayer = gameState.players[activePlayerIdx];

		// FLOAT UI
		var floatableCompanies = [];
		for (var i = 0 ; i < companies.length ; i++) {
			if (companies[i].shares[0] == null) {
				floatableCompanies.push(companies[i].color);
			}
		}
		if (floatableCompanies.length > 0 && activePlayer.cash >= 12) {
			$("div#ui_sr_float").show();
			$("#float_company").empty();
			for (var k = 0 ; k < floatableCompanies.length ; k++) {
				var opt = $("<option/>").val(floatableCompanies[k]).html(floatableCompanies[k]).appendTo($("#float_company"));
			}

			$("#float_player").val(gameState.playerTurn);
			$("#float_player_display").html(gameState.playerTurn);
		} else {
			$("div#ui_sr_float").hide();
		}

		// INVEST UI
		// TODO - this currently lets you invest in a company multiple times in a single SR...
		var investableCompanies = [];
		for (var i = 0 ; i < companies.length ; i++) {
			console.log("checking company [" + i + "] / " + companies[i].shares.slice(companies[i].shares.length - 1)[0] );
			if (companies[i].stock != null &&
				companies[i].shares.slice(companies[i].shares.length-1)[0] == null &&
				activePlayer.cash >= companies[i].stock
			) {
				investableCompanies.push(companies[i].color);
			}
		}

		if (investableCompanies.length > 0 && activePlayer.cash >= 12) {
			$("div#ui_sr_invest").show();
			$("#invest_company").empty();
			for (var k = 0 ; k < investableCompanies.length ; k++) {
				var company = getCompanyByColor(investableCompanies[k]);
				var opt = $("<option/>").val(investableCompanies[k]).html(investableCompanies[k] + " for " + company.stock).appendTo($("#invest_company"));
			}

			$("#invest_player").val(gameState.playerTurn);
			$("#invest_player_display").html(gameState.playerTurn);
		} else {
			$("div#ui_sr_invest").hide();
		}

		$("#stock_pass_player").val(gameState.playerTurn);
		$("#stock_pass_player_display").html(gameState.playerTurn);
	} else {
		$("#ui_stock_rounds").hide();
		$("#ui_operating_rounds").show();
	}
};

// TODO - this should be part of the core - every game should probably be showing this stuff
var displayLogData = function() {
	var gameLogContainer = $("#gameLog").empty();

	var gameState = Session.get("GAME_STATE");
	var ops = gameState.gameOps;
	if (ops.length > 0) {
		$("<div/>").addClass("logHeading").html("Most Recent Activity:").appendTo(gameLogContainer);
		var numShown = 0;
		for (var i = ops.length - 1 ; i >= 0 && numShown <= 5 ; i--) {
			$("<div/>").addClass("logEntry").html(makeOpReadable(ops[i])).appendTo(gameLogContainer);
			numShown++;
		}
	}
};

export const getNameOfNextPlayer = function(playerName) {
	var gameState = Session.get("GAME_STATE");

	if (playerName === undefined) {
		playerName = gameState.playerTurn;
	}

	var idx = getPlayerIndexByName(playerName);
	var nextIdx = idx == gameState.players.length - 1 ? 0 : idx + 1;
	return gameState.players[nextIdx].name;
};

export const getNameOfPreviousPlayer = function(playerName) {
	var gameState = Session.get("GAME_STATE");

	if (playerName === undefined) {
		playerName = gameState.playerTurn;
	}

	var idx = getPlayerIndexByName(playerName);
	var prevIdx = idx == 0 ? gameState.players.length - 1 : idx - 1;
	return gameState.players[prevIdx].name;
};

export const postSetupRendered = function() {
	for (var i = 1 ; i <= 5 ; i++) {
		for (var k = 0 ; k < PLAYER_COLORS.length ; k++) {
			var opt = $("<option/>").val(PLAYER_COLORS[k]).html(PLAYER_COLORS[k]).appendTo($("#color" + i));
			if (i-1 == k) {
				opt.attr("selected", true);
			}
		}
	}

	$("#startIberianGauge").click(function() {
		var playerNames = [];
		var playerColors = [];
		var chosenColors = {};
		for (var i = 1 ; i <= 5 ; i++) {
			var playerName = $("#player" + i).val();
			if (playerName === undefined) {
				playerName = "";
			}

			playerName = playerName.trim();
			if (playerName != "") {
				playerNames.push(playerName);

				var selectedColor = $("#color" + i).val();
				if (chosenColors[selectedColor] !== undefined) {
					alert("Each player needs their own color");
					return false;
				} else {
					playerColors.push(selectedColor);
					chosenColors[selectedColor] = true;
				}
			}
		}

		if (playerNames.length < 3) {
			alert("You need at least three players to play Iberian Gauge");
			return false;
		} else {
			// TODO -- 'iberian_gauge' should be inferred

			console.log("! CREATING STUB?");
			createStubbedGame("iberian_gauge", function() {
				var contextCode = Session.get("CONTEXT_ID");

				setGamePlayers(contextCode, playerNames, playerColors, function() {
					var updateObj = {
						"state": LEGAL_GAME_ROUNDS[0],
						"companies": makeRandomizedCompanyList()
					};
					for (var i = 0 ; i < playerNames.length ; i++) {
						updateObj["players." + i + ".cash"] = 40;
					}

					randomizedPlayerNames = shuffle(playerNames);
					updateObj["playerTurn"] = randomizedPlayerNames[0];

					genericGameUpdate(contextCode, "defaultSetup", updateObj, function() {
						FlowRouter.go("/game?contextCode=" + Session.get("CONTEXT_ID"));
					});

				});
			});

			return false;
		}
	});
};

export const allPlayersJustPassed = function() {
	var gameState = Session.get("GAME_STATE");
	var ops = gameState.gameOps;
	var numPlayers = gameState.players.length;
	var numConsecutivePasses = 0;
	for (var i = ops.length - 1 ; i >= 0 ; i--) {
		var op = ops[i];
		if (op.type == "stock_pass") {
			numConsecutivePasses++;
		} else {
			break;
		}
	}

	return numConsecutivePasses == numPlayers;
};

getCurrentAndNextGameRounds = function() {
	var gameState = Session.get("GAME_STATE");
	var currRound = gameState.state;
	var idx = LEGAL_GAME_ROUNDS.indexOf(currRound);
	var nextRound = idx < LEGAL_GAME_ROUNDS.length-1 ? LEGAL_GAME_ROUNDS[idx + 1] : null;
	return {
		current: currRound,
		next: nextRound
	};
};

export const processGameUpdate = function(addUpdateDelete, gameState) {
	console.log("##### processGameUpdate: start (" + addUpdateDelete + ")");
	console.log(gameState);
	console.log("##### processGameUpdate: end");

	if (allPlayersJustPassed()) {
		console.log("##### EVERYONE PASSED - NOW WHAT?!?!");
		var rounds = getCurrentAndNextGameRounds();
		console.log(rounds);
		var op = new StateChangeOp(rounds.current, rounds.next);
		op.sendActionToServer();
	}

	rebuildDash();
};

export const postGameRendered = function() {
	console.log("postGameRendered!");

	// TODO - populate the UI elements
	setGameOpListeners();

	/*
	$("div#iberian_gauge").html("this was set by ibgauge js b");

	$("#triggerfoo").click(function() {
		console.log("triggerclick");
		var val = $("#foodemo").val();
		var sess = Session.get("CONTEXT_ID");
		console.log("work on '" + sess + "' / '" + val + "'");
		demoUpdate(sess, val);
	});
	*/
	rebuildDash();
};

function getCompanyByColor(color) {
	var gameState = Session.get("GAME_STATE");
	var companies = gameState.companies;
	for (var i = 0 ; i < companies.length ; i++) {
		if (companies[i].color == color) {
			return companies[i];
		}
	}
}

function getCompanyIndexByColor(color) {
	var gameState = Session.get("GAME_STATE");
	var companies = gameState.companies;
	for (var i = 0 ; i < companies.length ; i++) {
		if (companies[i].color == color) {
			return i;
		}
	}
}

function getPlayerByName(name) {
	var gameState = Session.get("GAME_STATE");
	var players = gameState.players;
	for (var i = 0 ; i < players.length ; i++) {
		if (players[i].name == name) {
			return players[i];
		}
	}
}

function getActivePlayer() {
	var gameState = Session.get("GAME_STATE");
	return getPlayerByName(gameState.playerTurn);
}

function getPlayerIndexByName(name) {
	var gameState = Session.get("GAME_STATE");
	var players = gameState.players;
	for (var i = 0 ; i < players.length ; i++) {
		if (players[i].name == name) {
			return i;
		}
	}
}

function calculateDividendForCompanyColor(color) {
	var company = getCompanyByColor(color);
	return calculateDividendForCompany(company);
}

function calculateDividendForCompany(company) {
	var numShares = company.shares.length;
	var income = company.income;

	return Math.ceil(income / numShares);
}

function calculateDividendForCompanyAtIncome(company, income) {
	var numShares = company.shares.length;

	return Math.ceil(income / numShares);
}

class FloatOp extends GameOp {
	fieldsToSave= ["actor", "target", "price"];

	constructor(actorName, companyColor, floatPrice) {
		super("float_company");
		this.actor = actorName;
		this.target = companyColor;
		this.price = Number(floatPrice);
	}

	getUndoUpdateObj() {
		return null;
	}

	getActionUpdateObj() {
		var player = getPlayerByName(this.actor);
		var companyIdx = getCompanyIndexByColor(this.target);
		var playerIdx = getPlayerIndexByName(this.actor);

		var updateObj = {};
		updateObj["playerTurn"] = getNameOfNextPlayer();
		updateObj["companies." + companyIdx + ".shares.0"] = this.actor;
		updateObj["companies." + companyIdx + ".treasury"] = this.price;
		updateObj["companies." + companyIdx + ".stock"] = this.price;
		updateObj["companies." + companyIdx + ".income"] = 10;
		updateObj["players." + playerIdx + ".cash"] = Number(player.cash - this.price);

		return updateObj;
	}

	getReadableVersion() {
		return this.actor + " floated " + this.target + " at " + this.price + ".";
	}
}

class InvestOp extends GameOp {
	fieldsToSave= ["actor", "target", "price", "shareIndex"];

	constructor(actorName, companyColor, floatPrice, shareIndex) {
		super("invest_company");
		this.actor = actorName;
		this.target = companyColor;
		this.price = Number(floatPrice);
		this.shareIndex = shareIndex;
	}

	getUndoUpdateObj() {
		return null;
	}

	getActionUpdateObj() {
		var player = getPlayerByName(this.actor);
		var companyIdx = getCompanyIndexByColor(this.target);
		var company = Session.get("GAME_STATE").companies[companyIdx];
		var playerIdx = getPlayerIndexByName(this.actor);

		var updateObj = {};
		updateObj["playerTurn"] = getNameOfNextPlayer();
		updateObj["companies." + companyIdx + ".shares." + this.shareIndex] = this.actor;
		updateObj["companies." + companyIdx + ".treasury"] = company.treasury + this.price;
		updateObj["players." + playerIdx + ".cash"] = Number(player.cash - this.price);

		return updateObj;
	}

	getReadableVersion() {
		var company = getCompanyByColor(this.target);
		var nth = null;
		if (this.shareIndex == 1) {
			nth = "second";
		} else if (this.shareIndex == 2) {
			nth = "third";
		} else if (this.shareIndex == 3) {
			nth = "fourth";
		} else if (this.shareIndex == 4) {
			nth = "fifth";
		} else if (this.shareIndex == 5) {
			nth = "sixth";
		}

		if (this.shareIndex == company.shares.length - 1) {
			nth += " and final";
		}

		return this.actor + " bought the " + nth + " share in " + this.target + " for " + this.price + ".";
	}
}

class StockPassOp extends GameOp {
	fieldsToSave= ["actor"];

	constructor(actorName) {
		super("stock_pass");
		this.actor = actorName;
	}

	getUndoUpdateObj() {
		return {
			"playerTurn": getNameOfPreviousPlayer()
		};
	}

	getActionUpdateObj() {
		return {
			"playerTurn": getNameOfNextPlayer()
		};
	}

	getReadableVersion() {
		return this.actor + " passed.";
	}
}

class StateChangeOp extends GameOp {
	fieldsToSave= ["fromState", "toState"];

	constructor(fromState, toState) {
		super("state_change");
		this.fromState = fromState;
		this.toState = toState;

		this.isAutoOp = true;
	}

	getUndoUpdateObj() {
		var updateObj = {};
		updateObj["state"] = this.fromState;

		return updateObj;
	}

	getActionUpdateObj() {
		var updateObj = {};
		updateObj["state"] = this.toState;

		return updateObj;
	}

	getReadableVersion() {
		return "Game moved from " + this.fromState + " to " + this.toState;
	}
}

GameOp.registerGameOps([FloatOp, InvestOp, StockPassOp, StateChangeOp]);
