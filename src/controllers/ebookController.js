const User = require('../models/Users')
const Ebook = require('../models/Ebooks')
const path = require('path');
const fs = require('fs');
const EncryptionService = require('../services/EncryptionService')
const AccessRequest = require('../models/AccessRequest')

class EbookController {
    async createNewEbook(req, res) {
        try {
            const user = req.session.user || null;
            if (!user) {
                return res.redirect('/login');
            }
    
            let { title, type, language, pub_year, publisher, doi, isbn, description, author } = req.body;
    
            const state = 'Pending';
            const date = new Date();
    
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
    
            pub_year = parseInt(pub_year, 10);
            if (isNaN(pub_year) || pub_year <= 0) {
                return res.render("myEbooks", { message: 'Publication year must be a valid positive number.', messageType: 'error', user, formattedEbookData });
            }
    
            const existDOI = await Ebook.findOne({ doi: doi });
            const existISBN = await Ebook.findOne({ isbn: isbn });
            if (existDOI || existISBN) {
                return res.render("myEbooks", { message: "Ebook already existed. Please use another one!", messageType: 'error', user, formattedEbookData });
            }
    
            const files = req.files;
            if (!files || !files.imageFile || !files.ebookFile) {
                return res.render("myEbooks", { message: 'Both image and ebook file must be uploaded.', messageType: 'error', user, formattedEbookData });
            }
    
            const imageFile = files.imageFile[0];
            const ebookFile = files.ebookFile[0];
    
            const imageFilePath = path.join(__dirname, '..', 'public', 'contents', imageFile.originalname);
            const ebookFilePath = path.join(__dirname, '..', 'public', 'contents', ebookFile.originalname);
    
            if (fs.existsSync(imageFilePath)) {
                return res.render("myEbooks", { message: "Image file already exists.", messageType: 'error', user, formattedEbookData });
            }

            if (fs.existsSync(ebookFilePath)) {
                return res.render("myEbooks", { message: "Ebook file already exists.", messageType: 'error', user, formattedEbookData });
            }
    
            fs.writeFileSync(imageFilePath, imageFile.buffer);
            fs.writeFileSync(ebookFilePath, ebookFile.buffer);
            
            const newEbook = new Ebook({
                title: title,
                type: type,
                pub_year: pub_year,
                publisher: publisher,
                doi: doi,
                isbn: isbn,
                language: language,
                description: description,
                ebookFile: ebookFilePath,
                ebookFileOriginalName: ebookFile.originalname,
                imageFile: imageFilePath,
                imageFileOriginalName: imageFile.originalname,
                state: state,
                author: author,
                date: date,
                note: '',
                action_by: '',
                encrypted: false
            });
    
            await newEbook.save();
    
            req.session.message = `New eBook ${title} has been added successfully.`;
            req.session.messageType = 'success';
    
            return res.redirect('/myEbooks');
        } catch (error) {
            const user = req.session.user || null;
            console.error(error);
            res.status(500).send("Internal Server Error");
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

                    const originalFileName = ebook.imageFile.split('\\').pop();
                    const formattedImageFile = `contents/${originalFileName}`;

                    return {
                        ...ebook.toObject(),
                        formattedDate,
                        formattedImageFile
                    };
                });

                const message = req.session.message;
                const messageType = req.session.messageType;

                req.session.message = null;
                req.session.messageType = null;


                res.render("myEbooks", { formattedEbookData, user, message, messageType});
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

                const message = req.session.message;
                const messageType = req.session.messageType;

                req.session.message = null;
                req.session.messageType = null;
    
                res.render('myEbookDetail', { user, formattedEbookData, message, messageType});
            } else {
                res.status(404).send('Ebook not found');
            }
        } else {
            return res.redirect("/login");
        }
    }

    async getEbookDetail(req, res) {
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
    
                res.render('ebookDetail', { user, formattedEbookData, message });
            } else {
                res.status(404).send('Ebook not found');
            }
        } else {
            return res.redirect("/login");
        }
    }
    

    async updateMyEbookDetail(req, res) {
        try {
            const user = req.session.user || null;
            if (!user) {
                return res.redirect("/login");
            }
    
            let { id, title, type, language, pub_year, publisher, doi, isbn, description } = req.body;
            const files = req.files;
    
            pub_year = parseInt(pub_year, 10);
            if (isNaN(pub_year) || pub_year <= 0) {
                req.session.message = 'Publication year must be a valid positive number.';
                req.session.messageType = 'error';
                return res.redirect(`myEbookDetail?id=${id}`);
            }
    
            const existDOI = await Ebook.findOne({ doi: doi, _id: { $ne: id } });
            const existISBN = await Ebook.findOne({ isbn: isbn, _id: { $ne: id } });
            if (existDOI || existISBN) {
                req.session.message = "Ebook with the same DOI or ISBN already exists. Please use another one!";
                req.session.messageType = 'error';
                return res.redirect(`myEbookDetail?id=${id}`);
            }
    
            const currentEbook = await Ebook.findById(id);
            if (!currentEbook) {
                req.session.message = 'Ebook not found';
                req.session.messageType = 'error';
                return res.redirect(`myEbookDetail?id=${id}`);
            }
    
            const updateData = {
                title,
                type,
                language,
                pub_year,
                publisher,
                doi,
                isbn,
                description,
                state: 'Pending',
                action_by: "",
                note: ""
            };
    
            const basePath = path.join(__dirname, '../../src/public/contents/');
            
            if (files && files.imageFile && files.imageFile.length > 0) {
                const imageFile = files.imageFile[0];
                const newImagePath = path.join(basePath, imageFile.originalname);
    
                if (fs.existsSync(newImagePath)) {
                    req.session.message = 'Image file with the same name already exists.';
                    req.session.messageType = 'error';
                    return res.redirect(`myEbookDetail?id=${id}`);
                }
    
                fs.writeFileSync(newImagePath, imageFile.buffer);
    
                if (currentEbook.imageFile) {
                    const oldImagePath = path.join(basePath, path.basename(currentEbook.imageFile));
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
    
                updateData.imageFile = newImagePath;
                updateData.imageFileOriginalName = imageFile.originalname;
            }
    
            const updatedEbook = await Ebook.findByIdAndUpdate(id, updateData, { new: true });
            if (!updatedEbook) {
                req.session.message = 'Ebook not found';
                req.session.messageType = 'error';
                return res.redirect(`myEbookDetail?id=${id}`);
            }
    
            if (files && files.ebookFile && files.ebookFile.length > 0) {
                const ebookFile = files.ebookFile[0];
                const newEbookPath = path.join(basePath, ebookFile.originalname);
    
                if (fs.existsSync(newEbookPath)) {
                    req.session.message = 'Ebook file with the same name already exists.';
                    req.session.messageType = 'error';
                    return res.redirect(`myEbookDetail?id=${id}`);
                }
                
                fs.writeFileSync(newEbookPath, ebookFile.buffer);
    
                if (currentEbook.ebookFile) {
                    const oldEbookPath = path.join(basePath, path.basename(currentEbook.ebookFile));
                    if (fs.existsSync(oldEbookPath)) {
                        fs.unlinkSync(oldEbookPath);
                    }
                }
    
                updateData.ebookFile = newEbookPath;
                updateData.ebookFileOriginalName = ebookFile.originalname;
                updateData.encrypted = false; 
    
                await Ebook.findByIdAndUpdate(id, updateData, { new: true });
            } else {
                updateData.encrypted = currentEbook.encrypted;
            }
    
            req.session.message = `Ebook ${title} has been updated successfully.`;
            req.session.messageType = 'success';
            return res.redirect(`myEbookDetail?id=${id}`);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
      
    async deleteMyEbookDetail(req, res) {
        try {
            const user = req.session.user || null;
            if (!user) {
                return res.redirect("/login");
            }
    
            const { id } = req.body;
    
            const currentEbook = await Ebook.findById(id);
    
            const basePath = path.join(__dirname, '../../src/public/contents/');
    
            if (currentEbook.imageFile) {
                const imageFilename = path.basename(currentEbook.imageFile);
                const imagePath = path.join(basePath, imageFilename);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            if (currentEbook.ebookFile) {
                const ebookFilename = path.basename(currentEbook.ebookFile);
                const ebookPath = path.join(basePath, ebookFilename);
                if (fs.existsSync(ebookPath)) {
                    fs.unlinkSync(ebookPath);
                }
            }
    
            await AccessRequest.deleteMany({ ebookId: id });
    
            await Ebook.deleteOne({ _id: id });
    
            req.session.message = `EBook ${currentEbook.title} has been deleted successfully.`;
            req.session.messageType = 'success';
    
            res.redirect("/myEbooks");
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    }
    

    async getEbookReading(req, res) {
        try {
            const user = req.session.user || null;
            if (!user) {
                return res.redirect('/login');
            }
    
            const ebookId = req.params.ebookId;
            if (ebookId) {
                const ebook = await Ebook.findById(ebookId);
                if (ebook) {
                    const filename = path.basename(ebook.ebookFile);
                    const ebookPath = path.join(__dirname, '..', 'public', 'contents', filename);
                    const tempOutputFilename = `${ebook._id}_decrypted.pdf`;
    
                    const isOwner = ebook.author === user.username;
    
                    if (isOwner) {
                        if (ebook.encrypted) {
                            const now = new Date().getTime();
                            const expiresAt = req.session.expiresAt || 0;
    
                            if (fs.existsSync(path.join(__dirname, '..', 'public', 'temp', tempOutputFilename)) && now < expiresAt) {
                                res.render('ebookReading', {
                                    pdfFilePath: tempOutputFilename,
                                    isEncrypted: true,
                                    message: null,
                                    expiresAt,
                                    ebookId: ebook._id,
                                    ebookName: ebook.title,
                                    isOwner: isOwner
                                });
                            } else {
                                await EncryptionService.decryptFile(ebookPath, path.join(__dirname, '..', 'public', 'temp', tempOutputFilename), { encryptedKey: ebook.encryptedKey, iv: ebook.iv });
    
                                const limitTime = 60000; 
                                const newExpiresAt = now + limitTime;
                                req.session.expiresAt = newExpiresAt;
    
                                setTimeout(() => {
                                    const filePath = path.join(__dirname, '..', 'public', 'temp', tempOutputFilename);
    
                                    if (fs.existsSync(filePath)) {
                                        fs.unlink(filePath, (err) => {
                                            if (err) console.error(err);
                                            req.session.expiresAt = 0;
                                        });
                                    } else {
                                        req.session.expiresAt = 0;
                                    }
                                }, limitTime);
    
                                res.render('ebookReading', {
                                    pdfFilePath: tempOutputFilename,
                                    isEncrypted: true,
                                    message: null,
                                    expiresAt: newExpiresAt,
                                    ebookId: ebook._id,
                                    ebookName: ebook.title,
                                    isOwner: isOwner
                                });
                            }
                        } else {
                            res.render('ebookReading', {
                                pdfFilePath: filename,
                                isEncrypted: false,
                                message: null,
                                expiresAt: 0,
                                ebookId: ebook._id,
                                ebookName: ebook.title,
                                isOwner: isOwner
                            });
                        }
                    } else {
                        res.status(403).send("Bạn không có quyền truy cập vào ebook này.");
                    }
                } else {
                    res.status(404).send("Không tìm thấy ebook.");
                }
            } else {
                res.status(400).send("Cần cung cấp ID của ebook.");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Không thể mở ebook để đọc.");
        }
    }
    
    
    async accessEbookReading(req, res) {
        try {
            const { ebookId, accessKey } = req.body;
            const user = req.session.user || null;
    
            if (!user) {
                return res.redirect("/login");
            }
    
            const accessRequest = await AccessRequest.findOne({ ebookId, key: accessKey, state: 'Approved', requestBy: user.username });
    
            if (!accessRequest) {
                const ebook = await Ebook.findById(ebookId);
                const formattedEbookData = {
                    ...ebook.toObject(),
                    formattedDate: new Date(ebook.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }),
                    formattedImageFile: `contents/${ebook.imageFile.split('\\').pop()}`
                };
    
                return res.status(400).render('ebookDetail', {
                    ebook,
                    message: "Invalid access key.",
                    messageType: "error",
                    user,
                    formattedEbookData
                });
            }
    
            const ebook = await Ebook.findById(ebookId);
            if (!ebook) {
                return res.status(404).render('ebookReading', {
                    message: 'Ebook not found.',
                    messageType: "error",
                    pdfFilePath: null,
                    isEncrypted: false,
                    expiresAt: null,
                    ebookId: null,
                    ebookName: null,
                    isOwner: null
                });
            }
    
            const filename = path.basename(ebook.ebookFile);
            const ebookPath = path.join(__dirname, '..', 'public', 'contents', filename);
            const tempOutputFilename = `${ebook._id}_decrypted.pdf`;
    
            const now = new Date().getTime();
            const expiresAt = req.session.expiresAt || 0;
    
            if (ebook.encrypted) {
                if (fs.existsSync(path.join(__dirname, '..', 'public', 'temp', tempOutputFilename)) && now < expiresAt) {
                    res.render('ebookReading', {
                        pdfFilePath: tempOutputFilename,
                        isEncrypted: true,
                        message: null,
                        expiresAt,
                        ebookId: ebook._id,
                        ebookName: ebook.title,
                        isOwner: false
                    });
                } else {   
                    await EncryptionService.decryptFile(ebookPath, path.join(__dirname, '..', 'public', 'temp', tempOutputFilename), { encryptedKey: ebook.encryptedKey, iv: ebook.iv });
    
                    const limitTime = 60000; 
                    const newExpiresAt = now + limitTime;
                    req.session.expiresAt = newExpiresAt;
    
                    setTimeout(() => {
                        const filePath = path.join(__dirname, '..', 'public', 'temp', tempOutputFilename);
                        
                        if (fs.existsSync(filePath)) {
                            fs.unlink(filePath, (err) => {
                                if (err) console.error(err);
                                req.session.expiresAt = 0;
                            });
                        } else {
                            req.session.expiresAt = 0;
                        }
                    }, limitTime);
    
                    res.render('ebookReading', {
                        pdfFilePath: tempOutputFilename,
                        isEncrypted: true,
                        message: null,
                        expiresAt: newExpiresAt,
                        ebookId: ebook._id,
                        ebookName: ebook.title,
                        isOwner: false
                    });
                }
            } else {
                res.render('ebookReading', {
                    pdfFilePath: filename,
                    isEncrypted: false,
                    message: null,
                    expiresAt: 0,
                    ebookId: ebook._id,
                    ebookName: ebook.title,
                    isOwner: false
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).render('ebookReading', {
                message: 'Failed to access the ebook.',
                messageType: "error",
                pdfFilePath: null,
                isEncrypted: false,
                expiresAt: null,
                ebookId: null,
                ebookName: null,
                isOwner: null
            });
        }
    }
    
    
    async getSearchEbook(req, res) {
        try {
            const user = req.session.user;
            const { searchQuery } = req.query;

            if(!user){
                return res.redirect('/login');
            }
    
            const query = {
                $or: [
                    { title: { $regex: new RegExp(searchQuery, 'i') } },
                    { author: { $regex: new RegExp(searchQuery, 'i') } },
                    { doi: searchQuery },
                    { isbn: searchQuery },
                    { type: { $regex: new RegExp(searchQuery, 'i') } }
                ]
            };
    
            const ebooksData = await Ebook.find(query);
    
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
    
            res.render('search', { user, formattedEbookData });
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to search ebooks.');
        }
    }    
    
}

module.exports = new EbookController()
