const Ebook = require('../models/Ebooks')
const User = require('../models/Users')

class AdminController{
    async getIndexManagement(req, res) {
        if (req.session.admin) {
            try {
                res.render("indexManagement");
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
    
                res.render("ebookManagement", { ebookData });
            } catch (error) {
                console.error("Error rendering ebookManagement:", error);
                res.status(500).send("An error occurred while rendering the page.");
            }
        } else {
            res.status(401).send("Unauthorized");
        }
    }    
    
    async getEbookDetailManagement(req, res){
        if (req.session.admin) {
            try {
                const id = req.query.id
                const ebookData = await Ebook.findById(id)

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
        
                    res.render('ebookDetailManagement', {formattedEbookData });
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
                const {id} = req.body
                const updateState = {
                    state: 'Accepted',
                    note: ''
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

                const deniedEbook = {
                    state: 'Denied',
                    note: reason
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
                res.render("userManagement", {formattedUserData});
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
}

module.exports = new AdminController()