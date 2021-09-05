import { demoUpdate } from '/imports/api/GamesCollection';
import { createStubbedGame, setGamePlayers, genericGameUpdate, renderTemplate } from '/client/main';
import { setArbitraryData } from '/imports/api/GamesCollection';

var RAILROAD_COLORS = [
    "yellow", "red", "purple", "orange", "aqua"
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

export const postCreated = function() {
	console.log("postCreated!");
	$("div#iberian_gauge").html("this was set by ibgauge js a");

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
			"stock": 0,
			"income": 10 * i + 50,
			"treasury": 0,
			"shares": shares
		};

		companies.push(company);
	}

	return companies;
};

export const postSetupRendered = function() {
	$("#startIberianGauge").click(function() {
		var playerNames = [];
		for (var i = 1 ; i <= 5 ; i++) {
			var playerName = $("#player" + i).val();
			if (playerName === undefined) {
				playerName = "";
			}

			playerName = playerName.trim();
			if (playerName != "") {
				playerNames.push(playerName);
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

				console.log("! SETTING PLAYERS");

				setGamePlayers(contextCode, playerNames, function() {
					console.log("! SETTING COMPANIES");

					genericGameUpdate(contextCode, "defaultSetup", {
						"state": "SR1",
						"companies": makeRandomizedCompanyList()
					}, function() {
						renderTemplate("iberian_gauge_gameplay");
					});

				});
			});

			return false;
		}
	});
};

export const postRendered = function() {
	console.log("postRendered!");
	$("div#iberian_gauge").html("this was set by ibgauge js b");

	$("#triggerfoo").click(function() {
		console.log("triggerclick");
		var val = $("#foodemo").val();
		var sess = Session.get("CONTEXT_ID");
		console.log("work on '" + sess + "' / '" + val + "'");
		demoUpdate(sess, val);
	});
};
