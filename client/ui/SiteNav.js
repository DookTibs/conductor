import { Template } from 'meteor/templating';

import './SiteNav.css';
import './SiteNav.html';

Template.siteTopNavBar.helpers({
	contextId() {
		return Session.get("CONTEXT_ID")
	}
});
