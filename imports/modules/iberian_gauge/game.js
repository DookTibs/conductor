import { demoUpdate } from '/imports/api/GamesCollection';
import { genericGameUpdateWithCustomFilter, createStubbedGame, setGamePlayers, genericGameUpdate, renderTemplate } from '/client/main';

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
			var op = {
				type: "float_company",
				actor: floatPlayer,
				target: floatCompany,
				price: floatPrice
			};

			/*
				db.games.update({
						context_code: "UXIR",
						"companies.3.shares.1": { "$type": 10 }
				}, {
						"$set": {
								"companies.3.shares.1": "Bar"
						}
				});
			*/
			var contextCode = Session.get("CONTEXT_ID");
			var companyIdx = getCompanyIndexByColor(floatCompany);
			var playerIdx = getPlayerIndexByName(floatPlayer);
			var filter = { };
			filter["companies." + companyIdx + ".shares.0"] = { "$type": 10 };
			filter["players." + playerIdx + ".cash"] = player.cash;

			var updateObj = {};
			updateObj["companies." + companyIdx + ".shares.0"] = floatPlayer;
			updateObj["companies." + companyIdx + ".treasury"] = Number(floatPrice);
			updateObj["players." + playerIdx + ".cash"] = Number(player.cash - floatPrice);

			genericGameUpdateWithCustomFilter(contextCode, filter, op, updateObj, function() {
				console.log("BACK, did it work?!?!");
			});
		}
	});
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
			"income": 10 * i + 50,
			"treasury": null,
			"shares": shares
		};

		companies.push(company);
	}

	return companies;
};

var rebuildDash = function() {
	var gameState = Session.get("GAME_STATE");
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

	// set the UI elements - start
	var floatableCompanies = [];
	for (var i = 0 ; i < companies.length ; i++) {
		if (companies[i].shares[0] == null) {
			floatableCompanies.push(companies[i].color);
		}
	}

	var floatCapablePlayers = [];
	for (var i = 0 ; i < players.length ; i++) {
		if (players[i].cash >= 12) {
			floatCapablePlayers.push(players[i].name);
		}
	}

	if (floatableCompanies.length > 0 && floatCapablePlayers.length > 0) {
		$("div#ui_sr_float").show();
		$("#float_company").empty();
		for (var k = 0 ; k < floatableCompanies.length ; k++) {
			var opt = $("<option/>").val(floatableCompanies[k]).html(floatableCompanies[k]).appendTo($("#float_company"));
		}

		$("#float_player").empty();
		for (var k = 0 ; k < floatCapablePlayers.length ; k++) {
			var opt = $("<option/>").val(floatCapablePlayers[k]).html(floatCapablePlayers[k]).appendTo($("#float_player"));
		}
	} else {
		$("div#ui_sr_float").hide();
	}
	// set the UI elements - end

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
						"state": "SR1",
						"companies": makeRandomizedCompanyList()
					};
					for (var i = 0 ; i < playerNames.length ; i++) {
						updateObj["players." + i + ".cash"] = 40;
					}

					genericGameUpdate(contextCode, "defaultSetup", updateObj, function() {
						FlowRouter.go("/game?contextCode=" + Session.get("CONTEXT_ID"));
					});

				});
			});

			return false;
		}
	});
};

export const processGameUpdate = function(op, gameState) {
	console.log("##### processGameUpdate: start (" + op + ")");
	console.log(gameState);
	console.log("##### processGameUpdate: end");
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
