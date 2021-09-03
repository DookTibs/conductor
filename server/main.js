import { Meteor } from 'meteor/meteor';
import { GamesCollection } from '/imports/api/GamesCollection';
import '/imports/api/gamesPublications';

Meteor.startup(() => {
  // code to run on server at startup
  console.log("currently [" + GamesCollection.find().count() + "] games in the db");
});
