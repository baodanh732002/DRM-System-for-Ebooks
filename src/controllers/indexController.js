const Ebook = require('../models/Ebooks');

class IndexController {
    async getIndex(req, res) {
        if (req.session.user) {
            try {
                // Fetch the 5 most recent eBooks
                const ebooksDataNewest = await Ebook.find()
                                              .sort({ date: -1 }) // Sort by date in descending order
                                              .limit(4); // Limit to 5 documents

                // Format the dates
                const formattedEbookDataNewest = ebooksDataNewest.map((ebook) => {
                    const date = new Date(ebook.date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    return {
                        ...ebook.toObject(),
                        formattedDate
                    };
                });

                const ebooksDataPopular = await Ebook.aggregate([{ $sample: { size: 4 } }]);

                // Format the dates
                const formattedEbookDataPopular = ebooksDataPopular.map((ebook) => {
                    const date = new Date(ebook.date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    return {
                        ...ebook,
                        formattedDate
                    };
                });

                const username = req.session.user.username;

                // Fetch 5 random eBooks authored by the user
                const ebooksDataUser = await Ebook.aggregate([
                    { $match: { author: username } },
                    { $sample: { size: 4 } }
                ]);

                // Format the dates
                const formattedEbookDataUser = ebooksDataUser.map((ebook) => {
                    const date = new Date(ebook.date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    return {
                        ...ebook,
                        formattedDate
                    };
                });
                res.render("index.ejs", { formattedEbookDataNewest, formattedEbookDataPopular, formattedEbookDataUser});
            } catch (error) {
                console.error('Error fetching ebooks:', error);
                res.status(500).send('Internal Server Error');
            }
        } else {
            res.redirect("/login");
        }
    }
}

module.exports = new IndexController();
