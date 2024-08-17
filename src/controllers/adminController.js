const Ebook = require('../models/Ebooks')
const User = require('../models/Users')
const Admin = require('../models/Admins')
const AccessRequest = require('../models/AccessRequest')
const EncryptionService = require('../services/EncryptionService')
const path = require('path');
const bcrypt = require('bcrypt')
const fs = require('fs');
const crypto = require('crypto');


class AdminController{
    async getIndexManagement(req, res) {
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null
                res.render("indexManagement", {admin});
            } catch (error) {
                console.error("Error rendering indexManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            return res.redirect('/login');
        }
    }

    async getEbookManagement(req, res) {
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null
                const sortOrder = { 'Pending': 1, 'Denied': 2, 'Accepted': 3 };
    
                const ebookData = await Ebook.aggregate([
                    {
                        $addFields: {
                            sortOrder: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$state", "Pending"] }, then: sortOrder['Pending'] },
                                        { case: { $eq: ["$state", "Denied"] }, then: sortOrder['Denied'] },
                                        { case: { $eq: ["$state", "Accepted"] }, then: sortOrder['Accepted'] }
                                    ],
                                    default: 4
                                }
                            }
                        },
                    },
                    { $sort: { sortOrder: 1 } },
                    { $project: { sortOrder: 0 } } 
                ]);

                const successMessage = req.session.successMessage;
                const message = req.session.message;
                const messageType = req.session.messageType;

                req.session.message = null;
                req.session.messageType = null;

                res.render("ebookManagement", { ebookData, admin, message, messageType, successMessage});
            } catch (error) {
                console.error("Error rendering ebookManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            return res.redirect('/login');
        }
    }    
    
    async getEbookDetailManagement(req, res) {
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null;
                const id = req.query.id;
                const ebookData = await Ebook.findById(id);
    
                if (ebookData) {
                    const date = new Date(ebookData.date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
    
                    const isAuthorAdmin = ebookData.author === admin.adname

                    const originalFileName = ebookData.imageFile.split('\\').pop();
                    const formattedImageFile = `contents/${originalFileName}`;
    
                    const formattedEbookData = {
                        ...ebookData.toObject(),
                        formattedDate,
                        isAuthorAdmin,
                        formattedImageFile
                    };
    
                    const message = req.session.message;
                    const messageType = req.session.messageType;

                    req.session.message = null;
                    req.session.messageType = null;

                    res.render('ebookDetailManagement', { formattedEbookData, admin, message, messageType});
                } else {
                    res.status(404).send('Ebook not found');
                }
            } catch (error) {
                console.error("Error rendering ebookDetailManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            return res.redirect('/login');
        }
    }
    

    async handleEbookAccepted(req, res) {
        if (req.session.admin) {
            try {
                const admin = req.session.admin;
                const { id } = req.body;
    
                const updateState = {
                    state: 'Accepted',
                    note: '',
                    action_by: admin.adname
                };
    
                let ebook = await Ebook.findByIdAndUpdate(id, updateState, { new: true });
                if (!ebook) {
                    return res.status(404).send("Ebook not found");
                }
    
                if (!ebook.encrypted) {
                    const inputPath = path.resolve(ebook.ebookFile);
                    const outputPath = inputPath.replace('.pdf', '_encrypted.pdf');
    
                    const { encryptedKey, iv } = await EncryptionService.encryptFile(inputPath, outputPath);
    
                    fs.renameSync(outputPath, inputPath);
    
    
                    ebook.encryptedKey = encryptedKey;
                    ebook.iv = iv;
                    ebook.encrypted = true;
                    await ebook.save();
                }
    
                req.session.successMessage = `Ebook ${ebook.title} has been accepted successfully.`;

                res.redirect("/ebookManagement");

            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        } else {
            return res.redirect('/login');
        }
    }
    


    async handleEbookDenied(req, res){
        if (req.session.admin) {
            try {
                const {id, reason} = req.body
                const admin = req.session.admin

                const deniedEbook = {
                    state: 'Denied',
                    note: reason,
                    action_by: admin.adname
                }

                const ebook = await Ebook.findByIdAndUpdate(id, deniedEbook, {new: true})
                if (!ebook) {
                    return res.status(404).send("Ebook not found");
                }

                req.session.successMessage = `Ebook ${ebook.title} has been denied successfully.`;

                res.redirect("/ebookManagement");

            } catch (error) {
                console.error(error);
            }
        } else {
            return res.redirect('/login');
        }
    }

    

    async getUserManagement(req, res){
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null
                const userData = await User.find()

                const formattedUserData = userData.map((user) => {
                    const date = new Date(user.createAt);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    return {
                        ...user.toObject(),
                        formattedDate
                    };
                });

                const successMessage = req.session.successMessage;


                res.render("userManagement", {formattedUserData, admin, successMessage});
            } catch (error) {
                console.error("Error rendering userManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            return res.redirect('/login');
        }
    }

    async handleUserDelete(req, res) {
        if (req.session.admin) {
            try {
                const { id } = req.body;
                const currentUser = await User.findById({ _id: id });
    
                if (currentUser) {
                    await Ebook.deleteMany({ author: currentUser.username });
    
                    await User.deleteOne({ _id: id });
    
                    req.session.successMessage = `User ${currentUser.username} and all their ebooks have been deleted successfully.`;
    
                    res.redirect("/userManagement");
                } else {
                    req.session.successMessage = `User not found.`;
                    res.redirect("/userManagement");
                }
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to delete user and their ebooks.");
            }
        } else {
            return res.redirect('/login');
        }
    }
    

    async handleAddNewEbook(req, res) {
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null;
                let { title, type, language, pub_year, publisher, doi, isbn, description, author } = req.body;
    
                const state = 'Accepted';
                const date = new Date();
    
                const sortOrder = { 'Pending': 1, 'Denied': 2, 'Accepted': 3 };
                const ebookData = await Ebook.aggregate([
                    {
                        $addFields: {
                            sortOrder: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$state", "Pending"] }, then: sortOrder['Pending'] },
                                        { case: { $eq: ["$state", "Denied"] }, then: sortOrder['Denied'] },
                                        { case: { $eq: ["$state", "Accepted"] }, then: sortOrder['Accepted'] }
                                    ],
                                    default: 4
                                }
                            }
                        },
                    },
                    { $sort: { sortOrder: 1 } },
                    { $project: { sortOrder: 0 } }
                ]);

                pub_year = parseInt(pub_year, 10);
                if (isNaN(pub_year) || pub_year <= 0) {
                    return res.render("ebookManagement", { message: 'Publication year must be a valid positive number.', messageType: 'error', admin, ebookData });
                }
    
                const files = req.files;
                if (!files || !files.imageFile || !files.ebookFile) {
                    return res.render("ebookManagement", { message: 'Both image and ebook file must be uploaded.', messageType: 'error', admin, ebookData });
                }
    
                const existDOI = await Ebook.findOne({ doi: doi });
                const existISBN = await Ebook.findOne({ isbn: isbn });
                if (existDOI || existISBN) {
                    return res.render("ebookManagement", { message: "Ebook already existed. Please use another one!", messageType: 'error', admin, ebookData });
                }
    
                const imageFile = files.imageFile[0];
                const ebookFile = files.ebookFile[0];
    
                const imageFilePath = path.join(__dirname, '..', 'public', 'contents', imageFile.originalname);
                const ebookFilePath = path.join(__dirname, '..', 'public', 'contents', ebookFile.originalname);
    
                if (fs.existsSync(imageFilePath)) {
                    return res.render("ebookManagement", { message: "Image file already exists.", messageType: 'error', admin, ebookData });
                }

                if (fs.existsSync(imageFilePath) || fs.existsSync(ebookFilePath)) {
                    return res.render("ebookManagement", { message: "Ebook file already exists.", messageType: 'error', admin, ebookData });
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
                    action_by: admin.adname,
                    encrypted: false
                });
    
                await newEbook.save();
    
                const inputPath = path.join(newEbook.ebookFile);
                const outputPath = inputPath.replace('.pdf', '_encrypted.pdf');
    
                const { encryptedKey, iv } = await EncryptionService.encryptFile(inputPath, outputPath);
                fs.renameSync(outputPath, inputPath);
    
                newEbook.encryptedKey = encryptedKey;
                newEbook.iv = iv.toString('base64');
                newEbook.encrypted = true;
                await newEbook.save();
    
                req.session.successMessage = `Ebook ${newEbook.title} has been added successfully.`;
    
                res.redirect("/ebookManagement");
            } catch (error) {
                console.error(error);
                res.status(500).send("An error occurred while processing the request.");
            }
        } else {
            return res.redirect('/login');
        }
    }
    

    async handleUpdateEbook(req, res) {
        if (req.session.admin) {
            try {
                let { id, title, type, language, pub_year, publisher, doi, isbn, description } = req.body;
                const admin = req.session.admin;
                const files = req.files;
    
                pub_year = parseInt(pub_year, 10);
                if (isNaN(pub_year) || pub_year <= 0) {
                    req.session.message = 'Publication year must be a valid positive number.';
                    req.session.messageType = 'error';
                    return res.redirect(`ebookDetailManagement?id=${id}`);
                }
    
                const existDOI = await Ebook.findOne({ doi: doi, _id: { $ne: id } });
                const existISBN = await Ebook.findOne({ isbn: isbn, _id: { $ne: id } });
                if (existDOI || existISBN) {
                    req.session.message = "Ebook with the same DOI or ISBN already exists. Please use another one!";
                    req.session.messageType = 'error';
                    return res.redirect(`ebookDetailManagement?id=${id}`);
                }
    
                let ebook = await Ebook.findById(id);
                if (!ebook) {
                    return res.status(404).send('Ebook not found');
                }
    
                const basePath = path.join(__dirname, '../../src/public/contents/');
    
                const updateData = {
                    title,
                    type,
                    language,
                    pub_year,
                    publisher,
                    doi,
                    isbn,
                    description,
                    state: 'Accepted',
                    action_by: admin.adname
                };
    
                if (files && files.imageFile && files.imageFile.length > 0) {
                    const imageFile = files.imageFile[0];
                    const newImagePath = path.join(basePath, imageFile.originalname);
    
                    if (fs.existsSync(newImagePath)) {
                        req.session.message = 'Image file with the same name already exists.';
                        req.session.messageType = 'error';
                        return res.redirect(`ebookDetailManagement?id=${id}`);
                    }
    
                    fs.writeFileSync(newImagePath, imageFile.buffer);
    
                    if (ebook.imageFile) {
                        const oldImagePath = path.join(basePath, path.basename(ebook.imageFile));
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    }
    
                    updateData.imageFile = newImagePath;
                    updateData.imageFileOriginalName = imageFile.originalname;
                }
    
                if (files && files.ebookFile && files.ebookFile.length > 0) {
                    const ebookFile = files.ebookFile[0];
                    const newEbookPath = path.join(basePath, ebookFile.originalname);
    
                    if (fs.existsSync(newEbookPath)) {
                        req.session.message = 'Ebook file with the same name already exists.';
                        req.session.messageType = 'error';
                        return res.redirect(`ebookDetailManagement?id=${id}`);
                    }
    
                    fs.writeFileSync(newEbookPath, ebookFile.buffer);
    
                    if (ebook.ebookFile) {
                        const oldEbookPath = path.join(basePath, path.basename(ebook.ebookFile));
                        if (fs.existsSync(oldEbookPath)) {
                            fs.unlinkSync(oldEbookPath);
                        }
                    }
    
                    updateData.ebookFile = newEbookPath;
                    updateData.ebookFileOriginalName = ebookFile.originalname;
                    updateData.encrypted = false; 
                } else {
                    updateData.encrypted = ebook.encrypted;
                }
    
                ebook = await Ebook.findByIdAndUpdate(id, updateData, { new: true });
                if (!ebook) {
                    return res.status(404).send('Ebook not found');
                }
    
                if (!ebook.encrypted && ebook.ebookFile) {
                    const inputPath = ebook.ebookFile;
                    const outputPath = inputPath.replace('.pdf', '_encrypted.pdf');
    
                    const { encryptedKey, iv } = await EncryptionService.encryptFile(inputPath, outputPath);
                    fs.renameSync(outputPath, inputPath);
    
                    ebook.encryptedKey = encryptedKey;
                    ebook.iv = iv.toString('base64');
                    ebook.encrypted = true;
                    await ebook.save();
                }
    
                req.session.message = `Ebook ${title} has been updated successfully.`;
                req.session.messageType = 'success';
                res.redirect(`ebookDetailManagement?id=${id}`);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        } else {
            return res.redirect('/login');
        }
    }
    
    
    

    async handleDeleteEbook(req, res) {
        if (req.session.admin) {
            try {
                const { id } = req.body;
    
                const currentEbook = await Ebook.findById(id);
                if (!currentEbook) {
                    return res.status(404).send('Ebook not found');
                }
    
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
    
                req.session.successMessage = `Ebook ${currentEbook.title} has been deleted successfully.`;
    
                res.redirect("/ebookManagement");
            } catch (error) {
                console.error(error);
                res.status(500).render("ebookManagement", {
                    message: "Failed to delete ebook.",
                });
            }
        } else {
            return res.redirect('/login');
        }
    }
    
    
    

    async getAdminManagement(req, res){
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null
                const adminData = await Admin.find()

                const formattedAdminData = adminData.map((admin) => {
                    const date = new Date(admin.date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    return {
                        ...admin.toObject(),
                        formattedDate
                    };
                });

                const successMessage = req.session.successMessage;
 
                res.render("adminManagement", {formattedAdminData, admin, successMessage});
            } catch (error) {
                console.error("Error rendering userManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            return res.redirect('/login');
        }
    }


    async handleAddNewAdmin(req, res) {
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null;
                const { adname, email, phone, password, confirm } = req.body;

                const adminData = await Admin.find()

                const formattedAdminData = adminData.map((admin) => {
                    const date = new Date(admin.date);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    return {
                        ...admin.toObject(),
                        formattedDate
                    };
                });
    
                let regEmail = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                let regPhone = /^0\d{9,10}$/;
                let regPassword = /^[a-zA-Z0-9!?@]{6,}$/;
    
                if (!adname || !email || !phone || !password || !confirm) {
                    return res.render("adminManagement", {
                        message: "Please fill in all required fields.",
                        admin,
                        formattedAdminData
                    });
                }
                if (regEmail.test(email) == false) {
                    return res.render("adminManagement", {
                        message: "Please fill the correct email.",
                        admin,
                        formattedAdminData
                    });
                }
                if (regPhone.test(phone) == false) {
                    return res.render("adminManagement", {
                        message: "Invalid Phone.",
                        admin,
                        formattedAdminData
                    });
                }
                if (!regPassword.test(password)) {
                    return res.render("adminManagement", {
                        message: "Password must be at least 6 characters long and contain only letters, numbers, and the special characters !?@.",
                        admin,
                        formattedAdminData
                    });
                }
                if (password !== confirm) {
                    return res.render("adminManagement", {
                        message: "Password and Confirm Password do not match.",
                        admin,
                        formattedAdminData
                    });
                }
    
                const existAdmin = await Admin.findOne({ email: email });
                if (existAdmin) {
                    return res.render("adminManagement", {
                        message: "Email already registered.",
                        admin,
                        formattedAdminData
                    });
                }
    
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
    
                const newAdmin = new Admin({
                    adname: adname,
                    email: email,
                    phone: phone,
                    password: hashedPassword,
                    date: new Date()
                });
    
                await newAdmin.save();

                req.session.successMessage = `Admin ${newAdmin.adname} has been added successfully.`;

                res.redirect("/adminManagement");
            } catch (error) {
                console.log(error);
                res.status(500).render("adminManagement", {
                    message: "Failed to create account.",
                    admin
                });
            }
        } else {
            return res.redirect('/login');
        }
    }
    

    async handleAdminDelete(req, res) {
        if (req.session.admin) {
            try {
                const { id } = req.body;
    
                const currentAdmin = await Admin.findById(id);
    
                if (!currentAdmin) {
                    return res.status(404).send("Admin not found");
                }

                await Ebook.deleteMany({ author: currentAdmin.adname });
    
                await Admin.deleteOne({ _id: id });
    
                req.session.successMessage = `Admin ${currentAdmin.adname} has been deleted successfully.`;
    
                res.redirect("/adminManagement");
            } catch (error) {
                console.error(error);
                res.status(500).send("Failed to delete admin");
            }
        } else {
            return res.redirect('/login');
        }
    }
    

    async getRequestManagement(req, res){
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null;
    
                const accessRequestData = await AccessRequest.find({ handleBy: admin.adname });
    

                const formatDateTime = (date) => {
                    const d = new Date(date);
                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                };

                const ebookTitles = await Promise.all(
                    accessRequestData.map(async request => {
                        const ebook = await Ebook.findById(request.ebookId);
                        return ebook ? ebook.title : 'Unknown';
                    })
                );
    
                const requests = accessRequestData.map((request, index) => ({
                    requestBy: request.requestBy,
                    handleBy: request.handleBy,
                    ebookName: ebookTitles[index],
                    requestAt: request.requestAt ? formatDateTime(request.requestAt) : '',
                    handleAt: request.handleAt ? formatDateTime(request.handleAt) : '',
                    state: request.state,
                    _id: request._id
                }));

                const successMessage = req.session.successMessage;
                delete req.session.successMessage;
    
                res.render("requestManagement", { admin, accessRequestData: requests, message: null, successMessage});
            } catch (error) {
                console.error("Error rendering requestManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            return res.redirect('/login');
        }
    }

    async approveRequestAdmin(req, res) {
        try {
            const admin = req.session.admin;
            if (!admin) {
                return res.redirect('/login');
            }
    
            const { requestId } = req.body;
            const request = await AccessRequest.findById(requestId);
    
            if (!request) {
                return res.status(404).send("Request not found");
            }
    
            const ebook = await Ebook.findById(request.ebookId);
            if (!ebook) {
                return res.status(404).send("Ebook not found");
            }

            const userSpecificKey = EncryptionService.generateUserSpecificKey(ebook.encryptedKey, request.requestBy);

            const encryptedUserSpecificKey = EncryptionService.encryptKeyRSA(Buffer.from(userSpecificKey, 'base64'));
    
            request.state = "Approved";
            request.key = encryptedUserSpecificKey;
            request.iv = ebook.iv;
            request.handleAt = new Date();
    
            await request.save();
    
            const fetchEbookTitle = async (ebookId) => {
                const ebook = await Ebook.findById(ebookId);
                return ebook ? ebook.title : 'Unknown';
            };
    
            req.session.successMessage = `Successfully approved the request by ${request.requestBy} for ebook ${await fetchEbookTitle(request.ebookId)}.`;
    
            res.redirect('/requestManagement');
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to approve request");
        }
    }
    
    
    async rejectRequestAdmin(req, res){
        try {
            const admin = req.session.admin;
            if (!admin) {
                return res.redirect('/login');
            }
    
            const { requestId } = req.body;
    
            const request = await AccessRequest.findByIdAndUpdate(requestId, {
                state: "Rejected",
                handleAt: new Date()
            }, { new: true });
    
            if (!request) {
                return res.status(404).send("Request not found");
            }
    
            const fetchEbookTitle = async (ebookId) => {
                const ebook = await Ebook.findById(ebookId);
                return ebook ? ebook.title : 'Unknown';
            };
    
            req.session.successMessage = `Successfully rejected the request by ${request.requestBy} for ebook ${await fetchEbookTitle(request.ebookId)}.`;
            
            res.redirect("/requestManagement");
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to reject request");
        }
    }    

    async reviewEbook(req, res) {
        try {
            const admin = req.session.admin || null;
            if (!admin) {
                return res.redirect('/login');
            }
    
            const ebookId = req.params.ebookId;
            if (!ebookId) {
                return res.status(400).render('reviewEbook', {
                    message: 'Ebook ID is missing.',
                    pdfFilePath: null,
                    isEncrypted: false,
                    expiresAt: null,
                    ebookId: null,
                    ebookName: null,
                    isOwner: null
                });
            }
    
            const ebook = await Ebook.findById(ebookId);
            if (!ebook) {
                return res.status(404).render('reviewEbook', {
                    message: 'Ebook not found.',
                    pdfFilePath: null,
                    isEncrypted: false,
                    expiresAt: null,
                    ebookId: null,
                    ebookName: null,
                    isOwner: null
                });
            }
    
            const filename = path.basename(ebook.ebookFile);
            const tempOutputFilename = `${ebook._id}_decrypted.pdf`;
            const isOwner = ebook.author === admin.adname;
    
            if (isOwner) {
                if (ebook.encrypted) {
                    const now = new Date().getTime();
                    const expiresAt = req.session.expiresAt || 0;
    
                    if (fs.existsSync(path.join(__dirname, '..', 'public', 'temp', tempOutputFilename)) && now < expiresAt) {
                        res.render('reviewEbook', {
                            pdfFilePath: tempOutputFilename,
                            isEncrypted: true,
                            message: null,
                            expiresAt,
                            ebookId: ebook._id,
                            ebookName: ebook.title,
                            isOwner: isOwner
                        });
                    } else {
                        await EncryptionService.decryptFile(ebook.ebookFile, path.join(__dirname, '..', 'public', 'temp', tempOutputFilename), { encryptedKey: ebook.encryptedKey, iv: ebook.iv });
    
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
    
                        res.render('reviewEbook', {
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
                    res.render('reviewEbook', {
                        pdfFilePath: filename,
                        isEncrypted: false,
                        message: null,
                        expiresAt: null,
                        ebookId: ebook._id,
                        ebookName: ebook.title,
                        isOwner: isOwner
                    });
                }
            } else if (ebook.state === 'Pending') {
                if (ebook.encrypted) {
                    const outputFilePath = path.join(__dirname, '..', 'public', 'temp', tempOutputFilename);
                    if (!fs.existsSync(outputFilePath)) {
                        await EncryptionService.decryptFile(ebook.ebookFile, outputFilePath, { encryptedKey: ebook.encryptedKey, iv: ebook.iv });
                    }
    
                    res.render('reviewEbook', {
                        pdfFilePath: tempOutputFilename,
                        isEncrypted: true,
                        message: null,
                        expiresAt: null,
                        ebookId: ebook._id,
                        ebookName: ebook.title,
                        isOwner: isOwner
                    });
                } else {
                    res.render('reviewEbook', {
                        pdfFilePath: filename,
                        isEncrypted: false,
                        message: null,
                        expiresAt: null,
                        ebookId: ebook._id,
                        ebookName: ebook.title,
                        isOwner: isOwner
                    });
                }
            } else {
                res.status(403).render('reviewEbook', {
                    message: 'You do not have permission to view this ebook.',
                    pdfFilePath: null,
                    isEncrypted: false,
                    expiresAt: null,
                    ebookId: ebook._id,
                    ebookName: ebook.title,
                    isOwner: isOwner
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).render('reviewEbook', {
                message: 'Failed to render ebook for review.',
                pdfFilePath: null,
                isEncrypted: false,
                expiresAt: null,
                ebookId: null,
                ebookName: null,
                isOwner: null
            });
        }
    }
    
    
}

module.exports = new AdminController()