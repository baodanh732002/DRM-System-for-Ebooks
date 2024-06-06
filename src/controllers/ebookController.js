const User = require('../models/Users')
const Ebook = require('../models/Ebooks')
const path = require('path');

class EbookController {
    async createNewEbook(req, res) {
        try {
            const user = req.session.user || null;
            if (!user) {
                return res.redirect('/login');
            }
    
            let { title, type, language, pub_year, publisher, doi, isbn, description, author } = req.body;
            console.log(req.body);
    
            const state = 'Pending';
            const date = new Date();
            const files = req.files;
    
            // Fetch user's ebooks to ensure formattedEbookData is always populated
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
    
            if (!files || !files.imageFile || !files.ebookFile) {
                return res.render("myEbooks.ejs", { message: 'Both image and ebook file must be uploaded.', user, formattedEbookData });
            }
    
            const existDOI = await Ebook.findOne({ doi: doi });
            const existISBN = await Ebook.findOne({ isbn: isbn });
            if (existDOI || existISBN) {
                return res.render("myEbooks.ejs", { message: "Ebook already existed. Please use another one!", user, formattedEbookData });
            }
    
            const imageFile = files.imageFile[0];
            const ebookFile = files.ebookFile[0];
    
            const newEbook = new Ebook({
                title: title,
                type: type,
                pub_year: pub_year,
                publisher: publisher,
                doi: doi,
                isbn: isbn,
                language: language,
                description: description,
                ebookFile: ebookFile.path,
                ebookFileOriginalName: ebookFile.originalname,
                imageFile: imageFile.path,
                imageFileOriginalName: imageFile.originalname,
                state: state,
                author: author,
                date: date,
                note: '',
                action_by: ''
            });
    
            await newEbook.save();
    
            // Fetch the updated ebooks data after saving the new ebook
            const updatedEbooksData = await Ebook.find({ author: author });
            const updatedFormattedEbookData = updatedEbooksData.map((ebook) => {
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
    
            res.render("myEbooks", { message: 'success', formattedEbookData: updatedFormattedEbookData, user });
        } catch (error) {
            console.error(error);
            res.status(500).render("myEbooks", { error: 'Fail to upload new Ebook, please try again later!', user, formattedEbookData });
        }
    }
    

    async getMyEbooks(req, res) {
        const user = req.session.user || null;
        if (user) {
            try {
                const ebooksData = await Ebook.find({ author: user.username });
                console.log(ebooksData)

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

                res.render("myEbooks", { formattedEbookData, user });
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
                    formattedDate,
                    imageFileName: ebookData.imageFileOriginalName, 
                    ebookFileName: ebookData.ebookFileOriginalName 
                };
    
                res.render('myEbookDetail', { user, formattedEbookData });
            } else {
                res.status(404).send('Ebook not found');
            }
        } else {
            res.status(401).send('Unauthorized');
        }
    }

    async getEbookDetail(req, res){
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
    
                res.render('ebookDetail', { user, formattedEbookData });
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
            if (!user) {
                return res.status(401).send("Unauthorized");
            }
    
            const { id, title, type, language, pub_year, publisher, doi, isbn, description } = req.body;
    
            // Check if files are uploaded
            const files = req.files;
            const updateData = {
                title,
                type,
                language,
                pub_year,
                publisher,
                doi,
                isbn,
                description
            };
    
            // Handle image file upload
            if (files && files.imageFile && files.imageFile.length > 0) {
                updateData.imageFile = files.imageFile[0].path;
                updateData.imageFileOriginalName = files.imageFile[0].originalname;
            }
    
            // Handle ebook file upload
            if (files && files.ebookFile && files.ebookFile.length > 0) {
                updateData.ebookFile = files.ebookFile[0].path;
                updateData.ebookFileOriginalName = files.ebookFile[0].originalname;
            }
    
            const ebook = await Ebook.findByIdAndUpdate(id, updateData, { new: true });
            if (ebook) {
                res.redirect(`myEbookDetail?id=${id}`);
            } else {
                res.status(404).send('Ebook not found');
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

    async getEbookReading(req, res) {
        try {
            const user = req.session.user || null;
            const ebookId = req.params.ebookId;
            if (user && ebookId) {
                const ebook = await Ebook.findById(ebookId);
                if (ebook) {
                    // Get only the filename from the path
                    const pdfFilePath  = path.basename(ebook.ebookFile);
                    console.log(pdfFilePath );
                    res.render("ebookReading", { user, pdfFilePath  });
                } else {
                    res.status(404).render("ebookReading", {
                        message: "Ebook not found.",
                    });
                }
            } else {
                res.status(400).render("ebookReading", {
                    message: "Ebook ID is missing.",
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).render("ebookReading", {
                message: "Failed to render ebook Reading.",
            });
        }
    }
    
}

module.exports = new EbookController()
