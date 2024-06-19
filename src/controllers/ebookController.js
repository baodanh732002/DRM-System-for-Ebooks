const User = require('../models/Users')
const Ebook = require('../models/Ebooks')
const path = require('path');
const Download = require('../models/Download')

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
    
            const ebooksData = await Ebook.find({ author: author });
            const formattedEbookData = ebooksData.map((ebook) => {
                const date = new Date(ebook.date);
                const formattedDate = date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
    
                const originalFileName = ebook.imageFile.split('\\').pop();
                const formattedImageFile = `contents/${originalFileName}`;
    
                return {
                    ...ebook.toObject(),
                    formattedDate,
                    formattedImageFile
                };
            });
    
            if (!files || !files.imageFile || !files.ebookFile) {
                return res.render("myEbooks", { message: 'Both image and ebook file must be uploaded.', user, formattedEbookData });
            }
    
            const existDOI = await Ebook.findOne({ doi: doi });
            const existISBN = await Ebook.findOne({ isbn: isbn });
            if (existDOI || existISBN) {
                return res.render("myEbooks", { message: "Ebook already existed. Please use another one!", user, formattedEbookData });
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
    
            const updatedEbooksData = await Ebook.find({ author: author });
            const updatedFormattedEbookData = updatedEbooksData.map((ebook) => {
                const date = new Date(ebook.date);
                const formattedDate = date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
    
                const originalFileName = ebook.imageFile.split('\\').pop();
                const formattedImageFile = `contents/${originalFileName}`;
    
                return {
                    ...ebook.toObject(),
                    formattedDate,
                    formattedImageFile
                };
            });
    
            res.render("myEbooks", { message: 'Add new Ebook successfully!', formattedEbookData: updatedFormattedEbookData, user });
        } catch (error) {
            const user = req.session.user || null;
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

                    const originalFileName = ebook.imageFile.split('\\').pop();
                    const formattedImageFile = `contents/${originalFileName}`;

                    return {
                        ...ebook.toObject(),
                        formattedDate,
                        formattedImageFile
                    };
                });

                res.render("myEbooks", { formattedEbookData, user, message: ''});
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

                    const originalFileName = ebook.imageFile.split('\\').pop();
                    const formattedImageFile = `contents/${originalFileName}`;

                    return {
                        ...ebook.toObject(),
                        formattedDate,
                        formattedImageFile
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

                const originalFileName = ebookData.imageFile.split('\\').pop();
                const formattedImageFile = `contents/${originalFileName}`;

                const formattedEbookData = {
                    ...ebookData.toObject(),
                    formattedDate,
                    imageFileName: ebookData.imageFileOriginalName, 
                    ebookFileName: ebookData.ebookFileOriginalName,
                    formattedImageFile
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
            const notify = req.query.message;
            const ebookData = await Ebook.findById(ebookId);
    
            if (ebookData) {
                const date = new Date(ebookData.date);
                const formattedDate = date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                const originalFileName = ebookData.imageFile.split('\\').pop();
                const formattedImageFile = `contents/${originalFileName}`;

                const formattedEbookData = {
                    ...ebookData.toObject(),
                    formattedDate,
                    formattedImageFile
                };

                let message = '';
                if (notify) {
                    message = notify;
                }
    
                res.render('ebookDetail', { user, formattedEbookData, message});
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

    async getDownloadEbook(req, res) {
        try {
            const user = req.session.user || null;
            if (user) {
                // Fetch download data for the user
                const downloads = await Download.find({ username: user.username });
    
                // Fetch ebook details for each download
                const ebookDataPromises = downloads.map(async (download) => {
                    const ebook = await Ebook.findOne({ doi: download.doi, isbn: download.isbn });
                    if (ebook) {
                        const date = new Date(ebook.date);
                        const formattedDate = date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });

                        const originalFileName = ebook.imageFile.split('\\').pop();
                        const formattedImageFile = `contents/${originalFileName}`;

                        
                        return {
                            ...ebook.toObject(),
                            formattedDate,
                            downloadID: download._id,
                            formattedImageFile
                        };
                    }
                    return null;
                });

    
                const formattedEbookData = (await Promise.all(ebookDataPromises)).filter(Boolean);
    
                res.render("downloadEbook", { formattedEbookData, user, downloads});
            } else {
                res.redirect("/login");
            }
        } catch (error) {
            console.error('Error fetching downloaded ebooks:', error);
            res.status(500).render("downloadEbook", {
                message: "Failed to render downloaded ebooks.",
            });
        }
    }

    async handleDownloadEbook(req, res) {
        try {
            const user = req.session.user;
            const { username, doi, isbn } = req.body;
    
            if (!username || !doi || !isbn) {
                throw new Error("Missing ebook details.");
            }
    
            // Check if the ebook has already been downloaded by this user
            const existingDownload = await Download.findOne({ username: user.username, doi: doi, isbn: isbn });
            
            // Retrieve the ebook data for rendering the detail view
            const ebookData = await Ebook.findOne({ doi });
            if (!ebookData) {
                return res.status(404).send('Ebook not found');
            }
    
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
    
            if (existingDownload) {
                // If the download already exists, redirect with a message
                const message = "You already downloaded this ebook!";
                return res.redirect(`/ebookDetail?id=${ebookData._id}&message=${encodeURIComponent(message)}`);
            } else {
                // Proceed with the download process
                const download = new Download({
                    username: user.username,
                    doi,
                    isbn
                });
    
                await download.save();
    
                const message = "Download successful";
                return res.redirect(`/ebookDetail?id=${ebookData._id}&message=${encodeURIComponent(message)}`);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to download ebook." });
        }
    }
        

    async handleDeleteDownloadEbook(req, res){
        try{
            const user = req.session.user || null;
            if(user){
                const {id} = req.body
                console.log(id)
                await Download.deleteOne({_id: id})
                res.redirect("/downloadEbook")
            }
        }catch(error){
            console.error(error);
            res.status(500).render("downloadEbook", {
              message: "Failed to delete ebook.",
            });
        }
    }

    async getSearchEbook(req, res) {
        try {
            const user = req.session.user;
            const { searchQuery } = req.query; // Get the search query from query parameters
    
            // Build the query to search by title, author, DOI, ISBN, or type
            const query = {
                $or: [
                    { title: { $regex: new RegExp(searchQuery, 'i') } },
                    { author: { $regex: new RegExp(searchQuery, 'i') } },
                    { doi: searchQuery },
                    { isbn: searchQuery },
                    { type: { $regex: new RegExp(searchQuery, 'i') } }
                ]
            };
    
            // Perform the search using the Ebook model
            const ebooksData = await Ebook.find(query);
    
            // Format the ebooksData
            const formattedEbookData = ebooksData.map((ebook) => {
                const date = new Date(ebook.date);
                const formattedDate = date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                const originalFileName = ebook.imageFile.split('\\').pop();
                const formattedImageFile = `contents/${originalFileName}`;

                return {
                    ...ebook.toObject(),
                    formattedDate,
                    formattedImageFile
                };
            });
    
            // Render the search results in search.ejs
            res.render('search', { user, formattedEbookData });
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to search ebooks.');
        }
    }    
    
}

module.exports = new EbookController()
