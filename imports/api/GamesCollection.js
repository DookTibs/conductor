import { Mongo } from 'meteor/mongo';

export const GamesCollection = new Mongo.Collection('games');

export const insertStubbedGame = function(game_type_id, context_code) {
    console.log("inserting stubbed game from [" + (Meteor.isClient ? "client" : "server") + "]");
    GamesCollection.insert({
        game_type: game_type_id,
        context_code: context_code
    });
};
