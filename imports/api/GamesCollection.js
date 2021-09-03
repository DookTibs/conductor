import { Mongo } from 'meteor/mongo';

console.log("GamesCollection def from [" + (Meteor.isClient ? "client" : "server") + "]");
export const GamesCollection = new Mongo.Collection('games');

export const insertStubbedGame = function(game_type_id, context_code) {
    console.log("inserting stubbed game from [" + (Meteor.isClient ? "client" : "server") + "]");
    GamesCollection.insert({
        game_type: game_type_id,
        context_code: context_code
    });
};

export const findGameByContextCode = function(context_code) {
    console.log("finding game with code [" + context_code + "] from [" + (Meteor.isClient ? "client" : "server") + "]");
    return GamesCollection.find({
        context_code: context_code
    });
};
