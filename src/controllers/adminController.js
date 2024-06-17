const Ebook = require('../models/Ebooks')
const User = require('../models/Users')
const Admin = require('../models/Admins')
const bcrypt = require('bcrypt')


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
            res.status(401).send("Unauthorized");
        }
    }

    async getEbookManagement(req, res) {
        if (req.session.admin) {
            try {
                // Custom sorting order: Pending first, then Denied, and Accepted last
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
                                    default: 4 // In case there's an unexpected state
                                }
                            }
                        },
                    },
                    { $sort: { sortOrder: 1 } },
                    { $project: { sortOrder: 0 } } // Remove the sortOrder field from the final output
                ]);
    
                res.render("ebookManagement", { ebookData, admin});
            } catch (error) {
                console.error("Error rendering ebookManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            res.status(401).send("Unauthorized");
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
    
                    res.render('ebookDetailManagement', { formattedEbookData, admin });
                } else {
                    res.status(404).send('Ebook not found');
                }
            } catch (error) {
                console.error("Error rendering ebookDetailManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }
    

    async handleEbookAccepted(req, res){
        if (req.session.admin) {
            try {
                const admin = req.session.admin
                const {id} = req.body
                const updateState = {
                    state: 'Accepted',
                    note: '',
                    action_by: admin.adname
                }

                const ebook = await Ebook.findByIdAndUpdate(id, updateState, { new: true });
                if (!ebook) {
                    return res.status(404).send("Ebook not found");
                }

                res.redirect("/ebookManagement")
            } catch (error) {
                console.error(error);
            }
        } else {
            res.status(401).send("Unauthorized");
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

                res.redirect("/ebookManagement")
            } catch (error) {
                console.error(error);
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }

    

    async getUserManagement(req, res){
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null
                const userData = await User.find()

                const formattedUserData = userData.map((user) => {
                    const date = new Date(user.date);
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
                res.render("userManagement", {formattedUserData, admin});
            } catch (error) {
                console.error("Error rendering userManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }

    async handleUserDelete(req, res){
        if (req.session.admin) {
            try {
                const {id} = req.body
                await User.deleteOne({_id: id})
                res.redirect("/userManagement")
            } catch (error) {
                console.error(error);
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }

    async handleAddNewEbook(req, res){
        if(req.session.admin){
            try{
                const admin = req.session.admin || null
                let { title, type, language, pub_year, publisher, doi, isbn, description, author } = req.body
    
                const state = 'Accepted'
                const date = new Date()
    
                const files = req.files

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
                                    default: 4 // In case there's an unexpected state
                                }
                            }
                        },
                    },
                    { $sort: { sortOrder: 1 } },
                    { $project: { sortOrder: 0 } } // Remove the sortOrder field from the final output
                ]);
    
                if (!files || !files.imageFile || !files.ebookFile) {
                    return res.render("ebookManagement", {message: 'Both image and ebook file must be uploaded.', admin, ebookData})
                }

    
                const existDOI = await Ebook.findOne({doi: doi})
                const existISBN = await Ebook.findOne({isbn: isbn})
                if(existDOI || existISBN){
                    return res.render("ebookManagement", {message: "Ebook already existed. Please use another one!", admin, ebookData});
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
                    action_by: admin.adname
                })
    
                await newEbook.save();
    
                res.redirect("/ebookManagement")
            }catch(error){
                console.error(error);
                res.status(500).send("An error occurred while processing the request.");
            }
        }else{
            res.status(401).send("Unauthorized");
        }
    }

    async handleUpdateEbook(req, res){
        if(req.session.admin){
            try {
                const { id, title, type, language, pub_year, publisher, doi, isbn, description } = req.body;
                const admin = req.session.admin
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
                    description,
                    action_by: admin.adname
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
                    res.redirect(`ebookDetailManagement?id=${id}`);
                } else {
                    res.status(404).send('Ebook not found');
                }
            } catch (error) {
                console.error(error);
                res.status(500).render("myEbookDetail", {
                    message: "Failed to update ebook.",
                });
            }
        }else{
            res.status(401).send("Unauthorized");
        }
    }

    async handleDeleteEbook(req, res){
        if(req.session.admin){
            try{
                const admin = req.session.admin || null;
                const {id} = req.body
                await Ebook.deleteOne({_id: id})
                res.redirect("/ebookManagement")
            }catch(error){
                console.error(error);
                res.status(500).render("ebookManagement", {
                  message: "Failed to delete ebook.",
                });
            }
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
                res.render("adminManagement", {formattedAdminData, admin});
            } catch (error) {
                console.error("Error rendering userManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }

    async handleUserDelete(req, res){
        if (req.session.admin) {
            try {
                const {id} = req.body
                await User.deleteOne({_id: id})
                res.redirect("/userManagement")
            } catch (error) {
                console.error(error);
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }

    async handleAddNewAdmin(req, res){
        if (req.session.admin) {
            try {
                const admin = req.session.admin || null
                const {adname, email, phone, password, confirm} = req.body;
                console.log(req.body);
                let regEmail = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                let regPhone = /^[0-9]*$/;

                if(
                    !adname ||
                    !email ||
                    !phone ||
                    !password ||
                    !confirm
                ){
                    return res.render("adminManagement", {
                        message: "Please fill in all required fields.", admin
                    });
                }
                if(regEmail.test(email) == false){
                    return res.render("adminManagement", {
                        message: "Please fill the correct email.", admin
                    }); 
                }

                if (regPhone.test(phone) == false) {
                    return res.render("adminManagement", {
                        message: "Invalid Phone.", admin
                    });
                }

                if (password !== confirm) {
                    return res.render("adminManagement", {
                        message: "Password and Confirm Password do not match.", admin
                    });
                }

                const existAdmin = await Admin.findOne({email: email})
                if(existAdmin){
                    return res.render("adminManagement", { message: "Email already registered.", admin});
                }

                const salt = await bcrypt.genSalt(10)
                const hashedPassword = await bcrypt.hash(password, salt)

                const newAdmin = new Admin({
                    adname: adname,
                    email: email,
                    phone: phone,
                    password: hashedPassword,
                    date: new Date()
                })

                await newAdmin.save()
                res.redirect("/adminManagement")

            } catch (error) {
                console.log(error)
                res
                .status(500)
                .render("adminManagement", { message: "Failed to create account." });
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }

    async handleAdminDelete(req, res){
        if (req.session.admin) {
            try {
                const {id} = req.body
                await Admin.deleteOne({_id: id})
                res.redirect("/adminManagement")
            } catch (error) {
                console.error(error);
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }

}

module.exports = new AdminController()