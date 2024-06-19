const Ebook = require('../models/Ebooks');

class IndexController {
    async getIndex(req, res) {
        if (req.session.user) {
            try {
                // Fetch the 5 most recent eBooks
                const ebooksDataNewest = await Ebook.aggregate([
                    { $sort: { date: -1 } }, // Sort by date in descending order
                    { $limit: 3 } // Limit the results to 3
                ]);
    
                // Format the dates
                const formattedEbookDataNewest = ebooksDataNewest.map((ebook) => {
                    const date = new Date(ebook.date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                
                    const originalFileName = ebook.imageFile.split('\\').pop();
                    const formattedImageFile = `contents/${originalFileName}`;
                
                    return {
                        ...ebook,
                        formattedDate,
                        formattedImageFile
                    };
                });            
                
                console.log(formattedEbookDataNewest)
    
                const ebooksDataPopular = await Ebook.aggregate([{ $sample: { size: 4 } }]);
    
                // Format the dates
                const formattedEbookDataPopular = ebooksDataPopular.map((ebook) => {
                    const date = new Date(ebook.date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
    
                    const originalFileName = ebook.imageFile.split('\\').pop();
                    const formattedImageFile = `contents/${originalFileName}`;
    
                    return {
                        ...ebook,
                        formattedDate,
                        formattedImageFile
                    };
                });
    
                const user = req.session.user || null;
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
    
                    const originalFileName = ebook.imageFile.split('\\').pop();
                    const formattedImageFile = `contents/${originalFileName}`;
    
                    return {
                        ...ebook,
                        formattedDate,
                        formattedImageFile
                    };
                });
    
                res.render("index.ejs", {
                    formattedEbookDataNewest,
                    formattedEbookDataPopular,
                    formattedEbookDataUser,
                    user
                });
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
