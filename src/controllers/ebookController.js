const User = require('../models/Users')
const Ebook = require('../models/Ebooks')

class EbookController {
    async createNewEbook(req, res) {
        try {
            let { title, type, language, description, author } = req.body

            const state = 'Pending'
            const date = new Date()

            const files = req.files

            if (!files || !files.imageFile || !files.ebookFile) {
                return res.render("index.ejs", {message: 'Both image and ebook file must be uploaded.'})
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
            res.status(200).render("index.ejs",{ message: 'New eBook has been added successfully.' });
        } catch (error) {
            console.error(error);
            if(error.code === 11000){
                res.status(400).render("index.ejs", { error: 'Description must be unique. This description already exists.' });
            }
            res.status(500).render("index.ejs", { error: 'Fail to upload new Ebook, please try again later!' });
        }
    }
}

module.exports = new EbookController()
