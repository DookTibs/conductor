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
			$(this).html("EXPAND");
		} else {
			bottomNavDiv.addClass("expanded");
			$("div#__blaze-root").addClass("shrunk");
			$(this).html("SHRINK");
		}

	});
});
