/*
export const foo = function() {
	console.log("foo iberican gauge!");
};
export const bar = "hello from ibgauge module!";
*/

// var something = 0;
Session.set("something", 0);

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

export const postRendered = function() {
	console.log("postRendered!");
	$("div#iberian_gauge").html("this was set by ibgauge js b");
};
