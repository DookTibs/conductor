import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { GamesCollection, insertStubbedGame } from '/imports/api/GamesCollection';
import { makeId } from '/imports/util/util.js';

// import { FlowRouter } from 'meteor/kadira:flow-router';
// import { BlazeLayout } from 'meteor/kadira:blaze-layout';
// import { CONTEXT_ID } from '/imports/main/setup.js';

Session.set("CONTEXT_ID", "foo");

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
	}
});

FlowRouter.route("/startNewContext", {
	name: "start",
	action: function(params, queryParams) {
		console.log("action for /startNewContext route");
		var contextType = queryParams["type"];
		console.log("start [" + contextType + "]");

		var newContextCode = makeId();
		Session.set("CONTEXT_ID", newContextCode);
		insertStubbedGame(contextType, newContextCode);

		// now somehow load in the game module...
		console.log("about to import from the module...");
		import { postCreated, postRendered, getTemplateVars } from '/imports/modules/iberian_gauge/game';
		// import { foo } from '/imports/modules/iberian_gauge/game';
		// foo();
		import '/imports/modules/iberian_gauge/game.html';
		console.log("past the import!");

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
		});
	}
});

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
