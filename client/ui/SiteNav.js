import { Template } from 'meteor/templating';
import { GameOp, undoLastOp } from '/client/main';

import './SiteNav.css';
import './SiteNav.html';

Template.siteTopNavBar.helpers({
	contextId() {
		return Session.get("CONTEXT_ID")
	}
});

Template.siteTopNavBar.onRendered(function x() {
	$("#undo a").click(function() {
		undoLastOp();
	});
});

Template.siteBottomNavBar.onRendered(function x() {
	$("#expander a").click(function() {
		console.log("expand...");
		var bottomNavDiv = $("div.bottom_nav");
		if (bottomNavDiv.hasClass("expanded")) {
			bottomNavDiv.removeClass("expanded");
			$("div#__blaze-root").removeClass("shrunk");
			$(this).html("[+]");
		} else {
			bottomNavDiv.addClass("expanded");
			$("div#__blaze-root").addClass("shrunk");
			$(this).html("[-]");

			// scroll the log to the bottom
			$('div.full textarea').scrollTop($("div.full textarea")[0].scrollHeight); 
		}

	});
});

Template.siteBottomNavBar.helpers({
	lastOp() {
		var gameState = Session.get("GAME_STATE");
		var rawOps = gameState.gameOps;
		if (rawOps !== undefined && rawOps.length > 0) {
			var lastGameOp = GameOp.reconstruct(rawOps[rawOps.length-1]);
			return lastGameOp.getReadableVersion();
		}
	},
	allOps() {
		var gameState = Session.get("GAME_STATE");
		var rawOps = gameState.gameOps;

		if (rawOps !== undefined && rawOps.length > 0) {
			var gameOps = [];
			for (var i = 0 ; i < rawOps.length ; i++) {
				var gameOp = GameOp.reconstruct(rawOps[i]);
				gameOps.push("[" + (i+1) + "] " + gameOp.getReadableVersion() + "\n");
			}
			return gameOps;
		} else {
			return [];
		}
	}
});
