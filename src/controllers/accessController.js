const User = require("../models/Users");
const Admin = require("../models/Admins");
const Ebook = require("../models/Ebooks");
const AccessRequest = require("../models/AccessRequest");
const EncryptionService = require("../services/EncryptionService");
const crypto = require('crypto');

class AccessController {
    async requestAccess(req, res) {
        try {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/login');
            }
    
            const { ebookId } = req.body;
            const requestBy = user.username;
    
            const ebook = await Ebook.findById(ebookId);
            if (!ebook) {
                return res.status(404).send("Ebook not found");
            }
    
            const formattedEbookData = {
                ...ebook.toObject(),
                formattedDate: new Date(ebook.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }),
                formattedImageFile: `contents/${ebook.imageFile.split('\\').pop()}`
            };
    
            const authorUser = await User.findOne({ username: ebook.author });
            const authorAdmin = await Admin.findOne({ adname: ebook.author });
    
            let handleBy = "";
            if (authorUser) {
                handleBy = authorUser.username;
            } else if (authorAdmin) {
                handleBy = authorAdmin.adname;
            } else {
                return res.status(404).send("Author not found");
            }
    
            if (handleBy === requestBy) {
                return res.status(400).send("You cannot request access to your own ebook");
            }
    
            const existingRequest = await AccessRequest.findOne({ requestBy, handleBy, ebookId });
    
            if (existingRequest) {
                let updateFields = {
                    requestAt: new Date(),
                    key: "",
                    handleAt: ""
                };
    
                if (existingRequest.state !== "Pending") {
                    updateFields.state = "Pending";
                }

                
    
                await AccessRequest.findOneAndUpdate(
                    { _id: existingRequest._id },
                    { $set: updateFields },
                    { new: true }
                );
    
                return res.render('ebookDetail', {
                    ebook: ebook,
                    message: "Access request updated successfully",
                    messageType: "success",
                    user,
                    formattedEbookData
                });
            }
    
            const newAccessRequest = new AccessRequest({
                requestBy,
                handleBy,
                ebookId,
                requestAt: new Date(),
                state: "Pending"
            });
    
            await newAccessRequest.save();
    
            res.render('ebookDetail', {
                ebook: ebook,
                message: "Access request submitted successfully",
                messageType: "success",
                user,
                formattedEbookData
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to submit access request");
        }
    }
    
    

    async getRequests(req, res) {
        try {
            const user = req.session.user;
            if (!user) {
                return res.redirect('/login');
            }

            const keyRequests = await AccessRequest.find({ handleBy: user.username, state: "Pending" });
            const yourRequests = await AccessRequest.find({ requestBy: user.username });

            const formatDateTime = (date) => {
                const d = new Date(date);
                return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            };

            const fetchEbookTitle = async (ebookId) => {
                const ebook = await Ebook.findById(ebookId);
                return ebook ? ebook.title : 'Unknown';
            };

            const formattedKeyRequests = await Promise.all(keyRequests.map(async (request, index) => ({
                _id: request._id,
                serialNumber: index + 1,
                requestBy: request.requestBy,
                handleBy: request.handleBy,
                ebookName: await fetchEbookTitle(request.ebookId),
                formattedRequestDate: formatDateTime(request.requestAt),
                state: request.state,
                key: request.key 
            })));

            const formattedYourRequests = await Promise.all(yourRequests.map(async (request, index) => ({
                _id: request._id,
                serialNumber: index + 1,
                requestBy: request.requestBy,
                handleBy: request.handleBy,
                ebookName: await fetchEbookTitle(request.ebookId),
                formattedRequestDate: formatDateTime(request.requestAt),
                formattedHandleDate: request.handleAt ? formatDateTime(request.handleAt) : '',
                state: request.state,
                key: request.key 
            })));

            console.log("Formatted Key Requests: ", formattedKeyRequests);
            console.log("Formatted Your Requests: ", formattedYourRequests);

            const successMessage = req.session.successMessage;

            res.render('notification', {
                keyRequests: formattedKeyRequests,
                yourRequests: formattedYourRequests,
                user,
                successMessage
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to retrieve access requests");
        }
    }
    
    async approveRequest(req, res) {
        try {
            const user = req.session.user;
            if (!user) {
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
    
            res.redirect('/notification');
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to approve request");
        }
    }
    
    async rejectRequest(req, res){
        try{
            const user = req.session.user;
            if(!user){
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
    
            res.redirect("/notification");
        } catch (error){
            console.error(error);
            res.status(500).send("Failed to reject request");
        }
    }
    
    async deleteRequest(req, res){
        try{
            const user = req.session.user;
            if(!user){
                return res.redirect('/login');
            }
    
            const { requestId } = req.body;
    
            const request = await AccessRequest.findByIdAndDelete(requestId);
    
            if (!request) {
                return res.status(404).send("Request not found");
            }
    
            const fetchEbookTitle = async (ebookId) => {
                const ebook = await Ebook.findById(ebookId);
                return ebook ? ebook.title : 'Unknown';
            };
    
            req.session.successMessage = `Successfully deleted the request for ebook ${await fetchEbookTitle(request.ebookId)}.`;
    
            res.redirect("/notification");
        } catch (error){
            console.error(error);
            res.status(500).send("Failed to delete request");
        }
    }
    
    
 
}

module.exports = new AccessController();
