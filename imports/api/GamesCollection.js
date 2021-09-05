import { Mongo } from 'meteor/mongo';

console.log("GamesCollection def from [" + (Meteor.isClient ? "client" : "server") + "]");
export const GamesCollection = new Mongo.Collection('games');

/*
export const insertStubbedGame = function(game_type_id, context_code) {
    console.log("inserting stubbed game from [" + (Meteor.isClient ? "client" : "server") + "]");
    GamesCollection.insert({
		state: "defaultSetup",
        game_type: game_type_id,
        context_code: context_code
    });
};
*/

export const findGameByContextCode = function(context_code) {
    console.log("finding game with code [" + context_code + "] from [" + (Meteor.isClient ? "client" : "server") + "]");
    return GamesCollection.find({
        context_code: context_code
    });
};

export const demoUpdate = function(context_code, val) {
    console.log("updating game with code [" + context_code + "], val [" + val + "] from [" + (Meteor.isClient ? "client" : "server") + "]");
	var game = findGameByContextCode(context_code).fetch()[0];
    console.log("that's game [" + game._id + "]");

    GamesCollection.update({
		_id: game._id
    }, {
		"$set": {
			"foo": val
		}
	});
};

if (Meteor.isServer) {
	Meteor.methods({
		'insertStubbedGame'({ contextType, contextCode }) {
			console.log(">>>> insertStubbedGame [" + contextType + "], [" + contextCode + "]");
			var insertedId = GamesCollection.insert({
				state: "defaultSetup",
				game_type: contextType,
				context_code: contextCode
			});
			console.log(">>>> insertStubbedGame (" + insertedId + ")");

			return insertedId !== null && insertedId !== undefined;
		}
	});
	Meteor.methods({
		'setPlayersForGame'({ contextCode, playerNames }) {
			console.log(">>>> setPlayersForGame [" + contextCode + "], [" + playerNames + "]");
			var players = [];
			for (var i = 0 ; i < playerNames.length ; i++) {
				players.push({
					"name": playerNames[i]
				});
			}

			var rowsAffected = GamesCollection.update({
				context_code: contextCode
			}, {
				"$set": {
					"players": players
				}
			});

			return rowsAffected == 1;
		}
	});

	Meteor.methods({
		'setArbitraryGameData'({ contextCode, gameState, dataToSet }) {
			console.log(">>>> setArbitraryGameData [" + contextCode + "], [" + gameState + "], [" + dataToSet + "]");
			var rowsAffected = GamesCollection.update({
				context_code: contextCode,
				state: gameState
			}, {
				"$set": dataToSet
			});

			return rowsAffected == 1;
		}
	});
}

/*
export const setPlayersForGame = function(context_code, playerNames) {
	console.log("setPlayersForGame on [" + (Meteor.isServer ? "server" : "client") + "]");
	var game = findGameByContextCode(context_code).fetch()[0];

	var players = [];
	for (var i = 0 ; i < playerNames.length ; i++) {
		players.push({
			"name": playerNames[i]
		});
	}

    GamesCollection.update({
		_id: game._id
    }, {
		"$set": {
			"players": players
		}
	});
};
*/

export const setArbitraryData = function(context_code, packagedSets) {
	var game = findGameByContextCode(context_code).fetch()[0];

    GamesCollection.update({
		_id: game._id
    }, {
		"$set": packagedSets
	});
};
