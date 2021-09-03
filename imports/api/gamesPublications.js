import { Mongo } from 'meteor/mongo';
import { GamesCollection } from '/imports/api/GamesCollection';

if (Meteor.isServer) {
	console.log("publishing from server...");
	Meteor.publish('foogames', function publishGames() {
		  return GamesCollection.find({ });
	});

	Meteor.publish('game_with_context_code', function publishGameWithId(context_code) {
		console.log("RUNNING PUBLISH METHOD WITH [" + context_code + "] arg");
		  return GamesCollection.find({ context_code: context_code });
	});
}
