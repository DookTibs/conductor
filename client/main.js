import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { GamesCollection, insertStubbedGame, setPlayersForGame, findGameByContextCode } from '/imports/api/GamesCollection';
import { makeId } from '/imports/util/util.js';

window.GamesCollection = GamesCollection;

// import { FlowRouter } from 'meteor/kadira:flow-router';
// import { BlazeLayout } from 'meteor/kadira:blaze-layout';
// import { CONTEXT_ID } from '/imports/main/setup.js';

Session.set("CONTEXT_ID", "");

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
		var contextCode = queryParams["contextCode"];
		console.log("join [" + contextCode + "]");

		// seems backwards; we need to subscribe, and then run a separate query? if I don't subscribe and wait,
		// then gameProbe is loaded async and is usually null when I check it...
		Meteor.subscribe('game_with_context_code', contextCode, function() {
			var gameProbe = findGameByContextCode(contextCode);
			// window.gameProbe = gameProbe;
			if (gameProbe.count() == 1) {
				Session.set("CONTEXT_ID", contextCode);
				loadGameModule();
			} else {
				console.log("error; code [" + contextCode + "] returned [" + gameProbe.count() + "] matches");
			}

		});
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

export const setGamePlayers = function(contextCode, playerNames, callbackFxn) {
	Meteor.call('setPlayersForGame', {
		contextCode: contextCode,
		playerNames: playerNames
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
