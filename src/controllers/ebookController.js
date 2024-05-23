const User = require('../models/Users')
const Ebook = require('../models/Ebooks')

class EbookController {
    async createNewEbook(req, res) {
        try {
            const user = req.session.user || null;
            let { title, type, language, description, author } = req.body

            const state = 'Pending'
            const date = new Date()

            const files = req.files

            if (!files || !files.imageFile || !files.ebookFile) {
                return res.render("myEbooks.ejs", {message: 'Both image and ebook file must be uploaded.'})
            }

            const existTitile = await Ebook.findOne({title: title})
            if(existTitile){
                return res.render("myEbooks.ejs", {message: "Title already existed. Please use another one!" });
            }

            const imageFile = files.imageFile[0];
            const ebookFile = files.ebookFile[0];

            const newEbook = new Ebook({
                title: title,
                type: type,
                language: language,
                description: description,
                ebookFile: ebookFile.path,
                imageFile: imageFile.path,
                state: state,
                author: author,
                date: date
            })


            await newEbook.save();

            const ebooksData = await Ebook.find({ author: author });

            const formattedEbookData = ebooksData.map((ebook) => {
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

            res.render("myEbooks",{ message: 'success', formattedEbookData, user});
        } catch (error) {
            console.error(error);
            res.status(500).render("myEbooks", { error: 'Fail to upload new Ebook, please try again later!' });
        }
    }

    async getMyEbooks(req, res) {
        const user = req.session.user || null;
        if (user) {
            try {
                const ebooksData = await Ebook.find({ author: user.username });

                const formattedEbookData = ebooksData.map((ebook) => {
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

                res.render("myEbooks", {formattedEbookData, user });
            } catch (error) {
                console.error('Error fetching ebooks:', error);
                res.status(500).send('Internal Server Error');
            }
        } else {
            res.redirect("login");
        }
    }
    async getPopular(req, res) {
        const user = req.session.user || null;
        if (user) {
            try {
                const ebooksData = await Ebook.find();

                const formattedEbookData = ebooksData.map((ebook) => {
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

                res.render("popular", {formattedEbookData, user });
            } catch (error) {
                console.error('Error fetching ebooks:', error);
                res.status(500).send('Internal Server Error');
            }
        } else {
            res.redirect("login");
        }
    }

    async getMyEbooksDetail(req, res) {
        const user = req.session.user || null;
        if (user) {
            const ebookId = req.query.id;
            const ebookData = await Ebook.findById(ebookId);
    
            if (ebookData) {
                const date = new Date(ebookData.date);
                const formattedDate = date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const formattedEbookData = {
                    ...ebookData.toObject(),
                    formattedDate
                };
    
                res.render('myEbookDetail', { user, formattedEbookData });
            } else {
                res.status(404).send('Ebook not found');
            }
        } else {
            res.status(401).send('Unauthorized');
        }
    }

    async updateMyEbookDetail(req, res) {
        try {
            const user = req.session.user || null;
            if (user) {
                const { id, title, type, language, description, author } = req.body;
                const state = 'Pending';
                const date = new Date();
    
                const updateEbook = {
                    title: title,
                    type: type,
                    language: language,
                    description: description,
                    author: author,
                    state: state,
                    date: date
                };
    
    
                const ebook = await Ebook.findByIdAndUpdate(id, updateEbook, { new: true });
                if (!ebook) {
                    return res.status(404).send("Ebook not found");
                }
    
                res.redirect('/myEbooks');
            } else {
                res.status(401).send("Unauthorized");
            }
        } catch (error) {
            console.error(error);
            res.status(500).render("myEbookDetail", {
                message: "Failed to update ebook.",
            });
        }
    }
    

    async deleteMyEbookDetail(req, res){
        try{
            const user = req.session.user || null;
            if(user){
                const {id} = req.body
                await Ebook.deleteOne({_id: id})
                res.redirect("/myEbooks")
            }
        }catch(error){
            console.error(error);
            res.status(500).render("myEbookDetail", {
              message: "Failed to delete ebook.",
            });
        }
    }

}

module.exports = new EbookController()
