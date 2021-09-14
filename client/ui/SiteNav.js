import { Template } from 'meteor/templating';
import { GameOp } from '/client/main';

import './SiteNav.css';
import './SiteNav.html';

Template.siteTopNavBar.helpers({
	contextId() {
		return Session.get("CONTEXT_ID")
	}
});

Template.siteTopNavBar.onRendered(function x() {
	$("#undo a").click(function() {
		var gameState = Session.get("GAME_STATE");
		if (gameState.gameOps.length > 0) {
			var lastOp = gameState.gameOps[gameState.gameOps.length-1];
			var rebuilt = GameOp.reconstruct(lastOp);
			rebuilt.sendUndoToServer();
		}

	});
});

Template.siteBottomNavBar.onRendered(function x() {
	$("#expander a").click(function() {
		console.log("expand...");
		var bottomNavDiv = $("div.bottom_nav");
		if (bottomNavDiv.hasClass("expanded")) {
			bottomNavDiv.removeClass("expanded");
			$("div#__blaze-root").removeClass("shrunk");
			$(this).html("EXPAND");
		} else {
			bottomNavDiv.addClass("expanded");
			$("div#__blaze-root").addClass("shrunk");
			$(this).html("SHRINK");
		}

	});
});
