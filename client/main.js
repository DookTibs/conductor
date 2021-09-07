import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { GamesCollection, insertStubbedGame, findGameByContextCode } from '/imports/api/GamesCollection';
import { makeId } from '/imports/util/util.js';

window.GamesCollection = GamesCollection;

// import { FlowRouter } from 'meteor/kadira:flow-router';
// import { BlazeLayout } from 'meteor/kadira:blaze-layout';
// import { CONTEXT_ID } from '/imports/main/setup.js';

console.log("CLEARING SESSION VARS");
// Session.set("CONTEXT_ID", "");
Session.set("GAME_STATE", {});

import './main.html';

// import '../imports/main/setup.js';

import './ui/SiteNav.js';
// import '../imports/ui/ContextContents.js';

// import '../imports/ui/DividendTrack.js';
//
// console.log("hi there: ");
// console.log(Meteor);
// console.log(this);
// console.log("00000");

// TODO these routes should maybe live elsewhere?
FlowRouter.route("/", {
	name: "homepage",
	action: function(params, queryParams) {
		console.log("action for / route");
		// TODO - this should be derived from what's on the filesystem...
		var hardcodedGames = [
			{ gameId:"iberian_gauge", name:"Iberian Gauge" },
			{ gameId:"chex", name:"Chicago Express" }
		];

		BlazeLayout.render('landingPage', { availableGames: hardcodedGames });
	}
});

FlowRouter.route("/joinContext", {
	name: "join",
	action: function(params, queryParams) {
		console.log("action for /joinContext route");
		var contextCode = queryParams["contextCode"].toUpperCase();
		FlowRouter.go("/game?contextCode=" + contextCode);
	}
});

FlowRouter.route("/startNewContext", {
	name: "start",
	action: function(params, queryParams) {
		console.log("action for /startNewContext route");
		var contextType = queryParams["type"];
		console.log("start [" + contextType + "]");

		/*
		var newContextCode = makeId();
		Session.set("CONTEXT_ID", newContextCode);
		insertStubbedGame(contextType, newContextCode);

		loadGameModule();
		*/
		loadGameModuleForInitialSetup();
	}
});

FlowRouter.route("/game", {
	name: "conductGame",
	action: function(params, queryParams) {
		var contextCode = queryParams["contextCode"];

		var pageJustRefreshed = false;
		if (Session.get("CONTEXT_ID") != contextCode) { // if someone reloads the page, we recreate some stuff...
			Session.set("CONTEXT_ID", contextCode);
			pageJustRefreshed = true;
		}

		// var game = findGameByContextCode(Session.get("CONTEXT_ID")).fetch()[0];
		// console.log("game is [" + game["game_type"] + "]");
		Meteor.subscribe('game_with_context_code', contextCode, function() {
			var gameCursor = findGameByContextCode(contextCode);
			var game = gameCursor.fetch()[0];
			console.log("game is [" + game["game_type"] + "]/[" + game["_id"] + "]");
			/*


	import { postCreated, postRendered, getTemplateVars } from '/imports/modules/iberian_gauge/game';
	// import { foo } from '/imports/modules/iberian_gauge/game';
	// foo();
	import '/imports/modules/iberian_gauge/game.html';
	console.log("past the import, including css!");

	console.log("render the template!");
	BlazeLayout.render("initialSetup", getTemplateVars());
	console.log("past render for [" + Template.initialSetup + "]");

	Template.initialSetup.onCreated(function x() {
		console.log("onCreated A");
		postCreated();
	});

	Template.initialSetup.onRendered(function x() {
		console.log("onRendered A");
		postRendered();

	
			*/

			console.log("IMP ALL");
			importAllModulesForGame(game["game_type"], function(jsModule, htmlModule, cssModule) {
				console.log("DONE [" + pageJustRefreshed + "]");
				if (pageJustRefreshed) {
					listenForGameUpdates(jsModule["processGameUpdate"]);
				}
				renderTemplate("gameplay", {}, jsModule["postGameCreated"], jsModule["postGameRendered"]);
			});
			/*
			import("/imports/modules/" + game["game_type"] + "/game").then(function(jsModule) {
				console.log("GAME IMPORTED");
				import("/imports/modules/" + game["game_type"] + "/game.html").then(function(htmlModule) {
					console.log("HTML IMPORTED");
					console.log(jsModule);
					console.log(htmlModule);
					if (pageJustRefreshed) {
						listenForGameUpdates(jsModule["processGameUpdate"]);
					}
					renderTemplate("gameplay", {}, jsModule["postGameCreated"], jsModule["postGameRendered"]);
				});
			});
			*/

			/*
			if (pageJustRefreshed) {
				import("/imports/modules/" + game["game_type"] + "/game").then(function(module) {
					console.log("MODULE IMPORTED:");
					listenForGameUpdates(module["processGameUpdate"]);
				});
			}
			*/
		});
	}
});

export const renderTemplate = function(templateName, templateData, onCreated, onRendered) {
	Template[templateName].onCreated(function x() {
		console.log(templateName + " onCreated...");
		if (typeof(onCreated) === "function") {
			onCreated();
		}
	});

	Template[templateName].onRendered(function x() {
		console.log(templateName + " onRendered...");
		if (typeof(onRendered) === "function") {
			onRendered();
		}
	});

	BlazeLayout.render(templateName, templateData);
}

export const setGamePlayers = function(contextCode, playerNames, playerColors, callbackFxn) {
	Meteor.call('setPlayersForGame', {
		contextCode: contextCode,
		playerNames: playerNames,
		playerColors: playerColors
	}, (err, res) => {
		if (err) {
			// communications error
			console.log("!!! setGamePlayers comms error");
		} else {
			if (res === true) {
				callbackFxn();
			} else {
				// update affected 0 rows; possible race condition
				console.log("!!! setGamePlayers no rows updated; how to recover?!!? resync somehow?");
			}
		}
	});
};

export const genericGameUpdate = function(contextCode, requiredGameState, dataToSet, callbackFxn) {
	console.log("NEW GENERIC UPDATED");
	Meteor.call('setArbitraryGameData', {
		"contextCode": contextCode,
		"gameState": requiredGameState,
		"dataToSet": dataToSet
	}, (err, res) => {
		if (err) {
			// communications error
			console.log("!!! genericGameUpdate comms error");
		} else {
			if (res === true) {
				callbackFxn();
			} else {
				console.log("!!! genericGameUpdate no rows updated; how to recover?!!? resync somehow?");
			}
		}
	});
};

export const genericGameUpdateWithCustomFilter = function(contextCode, filter, op, dataToSet, callbackFxn) {
	Meteor.call('setArbitraryGameDataWithCustomFilter', {
		"contextCode": contextCode,
		"filter": filter,
		"op": op,
		"dataToSet": dataToSet
	}, (err, res) => {
		if (err) {
			// communications error
			console.log("!!! genericGameUpdateWithCustomFilter comms error");
		} else {
			if (res === true) {
				callbackFxn();
			} else {
				console.log("!!! genericGameUpdateWithCustomFilter no rows updated; how to recover?!!? resync somehow?");
			}
		}
	});
};

export const createStubbedGame = function(contextType, callbackFxn) {
	var newContextCode = makeId();
	Session.set("CONTEXT_ID", newContextCode);
	// insertStubbedGame(contextType, newContextCode);
	Meteor.call('insertStubbedGame', {
		contextType: contextType,
		contextCode: newContextCode
	}, (err, res) => {
		if (err) {
			// communications error
			callbackFxn(false);
		} else {
			import { processGameUpdate } from '/imports/modules/iberian_gauge/game';
			listenForGameUpdates(processGameUpdate);

			callbackFxn(true);
		}
	});
};

var loadGameModuleForInitialSetup = function() {
	// now somehow load in the game module...
	console.log("about to import from the module; currently hardcoded for iberian gauge...");
	import { postSetupCreated, postSetupRendered, getSetupTemplateVars } from '/imports/modules/iberian_gauge/game';
	import '/imports/modules/iberian_gauge/game.html';
	import '/imports/modules/iberian_gauge/game.css';
	console.log("past the import!");

	Template.initialSetup.onCreated(function x() {
		if (typeof(postSetupCreated) === "function") {
			postSetupCreated();
		}
	});

	Template.initialSetup.onRendered(function x() {
		if (typeof(postSetupRendered) === "function") {
			postSetupRendered();
		}
	});

	BlazeLayout.render("initialSetup", getSetupTemplateVars());
};

// calls a function in the game module whenever the game document in mongo is modified
var listenForGameUpdates = function(moduleHandler) {
	console.log("START LISTENING");

	// how can I do something in Javascript whenever the game updates?
	// approach one - this appears to work
	var sessionContextId = Session.get("CONTEXT_ID");
	console.log("More work for [" + sessionContextId + "]");
	Meteor.subscribe('game_with_context_code', sessionContextId, function() {
		var gameCursor = findGameByContextCode(sessionContextId);

		var cursorHandle = gameCursor.observeChanges({
			added: function (newDoc) {
				console.log("doc added: " + newDoc);
				// console.log(gameCursor.fetch()[0]);
				var gameState = gameCursor.fetch()[0];
				Session.set("GAME_STATE", gameState);
				moduleHandler("ADD", gameState);
			},
			changed: function (newDoc, oldDoc) {
				console.log("doc changed:");
				// console.log(gameCursor.fetch()[0]);
				var gameState = gameCursor.fetch()[0];
				Session.set("GAME_STATE", gameState);
				moduleHandler("UPDATE", gameState);
			},
			removed: function (oldDoc) {
				console.log("doc removed: " + oldDoc);
				Session.set("GAME_STATE", {});
				moduleHandler("DELETE", oldDoc);
			}
		});
	});
};

var loadGameModule = function() {
	// now somehow load in the game module...
	console.log("about to import from the module; currently hardcoded for iberian gauge...");
	import { postCreated, postRendered, getTemplateVars } from '/imports/modules/iberian_gauge/game';
	// import { foo } from '/imports/modules/iberian_gauge/game';
	// foo();
	import '/imports/modules/iberian_gauge/game.html';
	console.log("past the import, including css!");

	console.log("render the template!");
	BlazeLayout.render("initialSetup", getTemplateVars());
	console.log("past render for [" + Template.initialSetup + "]");

	Template.initialSetup.onCreated(function x() {
		console.log("onCreated A");
		postCreated();
	});

	Template.initialSetup.onRendered(function x() {
		console.log("onRendered A");
		postRendered();

		// how can I do something in Javascript whenever the game updates?
		// approach one - this appears to work
		var sessionContextId = Session.get("CONTEXT_ID");
		console.log("More work for [" + sessionContextId + "]");
		Meteor.subscribe('game_with_context_code', sessionContextId, function() {
			var gameCursor = findGameByContextCode(sessionContextId);

			var cursorHandle = gameCursor.observeChanges({
				added: function (newDoc) {
					console.log("doc added: " + newDoc);
					console.log(gameCursor.fetch()[0]);
				},
				changed: function (newDoc, oldDoc) {
					console.log("doc changed:");
					console.log(gameCursor.fetch()[0]);
				},
				removed: function (oldDoc) {
					console.log("doc removed: " + oldDoc);
				}
			});
		});
	});

	Template.initialSetup.helpers({
		foo() {
			var game = findGameByContextCode(Session.get("CONTEXT_ID")).fetch()[0];
			return game["foo"];
		}
	});
};

var importAllModulesForGame = function(gameName, callback) {
	import("/imports/modules/" + gameName + "/game").then(function(jsModule) {
		import("/imports/modules/" + gameName + "/game.html").then(function(htmlModule) {
			import("/imports/modules/" + gameName + "/game.css").then(function(cssModule) {
				callback(jsModule, htmlModule, cssModule);
			});
		});
	});
};

/*
Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});
*/
