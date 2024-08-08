const Ebook = require('../models/Ebooks');

class IndexController {
    async getIndex(req, res) {
        if (req.session.user) {
            try {
                const ebooksDataNewest = await Ebook.aggregate([
                    { $match: { state: { $ne: 'Pending' } } },
                    { $sort: { date: -1 } },
                    { $limit: 3 } 
                ]);
    
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
                
    
                const ebooksDataPopular = await Ebook.aggregate([{ $sample: { size: 4 } }]);
    
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
    
                const ebooksDataUser = await Ebook.aggregate([
                    { $match: { author: username } },
                    { $sample: { size: 4 } }
                ]);
    
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
