class LogoutController {
    logout(req, res) {
        try {
            req.session.destroy(function (err) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/login');
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Failed to logout.');
        }
    }
}

module.exports = new LogoutController();
