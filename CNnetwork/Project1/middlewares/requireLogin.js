// A middleware to check whether a user is logged in
const requireLogin = (req, res, next) =>
{
	// If a user is logged in, move to the next middleware
	if (req.session.user) {
		next();
	}

	// Else, move to the login page.
	else {
		res.redirect("/login");
	}
};


module.exports = {requireLogin};