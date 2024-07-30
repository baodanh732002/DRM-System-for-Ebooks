const express = require('express')
const route = express.Router()
const multer  = require('multer')
const path = require('path');

const loginController = require('../controllers/loginController') 
const registerController = require('../controllers/registerController')
const indexController = require('../controllers/indexController')
const logoutController = require('../controllers/logoutController')
const ebookController = require('../controllers/ebookController')
const adminController = require('../controllers/adminController')
const accessController = require('../controllers/accessController')
const userController = require('../controllers/userController')



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public', 'contents'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const uploadFields = [
    { name: 'imageFile', maxCount: 1 },
    { name: 'ebookFile', maxCount: 1 }
];


route.get('/', indexController.getIndex)

route.get('/login', loginController.getLoginForm)
route.post('/login', loginController.checkAccount)

route.get('/register', registerController.getRegisterForm)
route.post('/register', registerController.createAccount)

route.get('/logout', logoutController.logout)

route.get('/popular', ebookController.getPopular)

route.get('/myEbooks', ebookController.getMyEbooks)
route.post('/myEbooks', upload.fields(uploadFields), ebookController.createNewEbook)

route.get('/myEbookDetail', ebookController.getMyEbooksDetail)
route.post('/myEbookDetail_update', upload.fields(uploadFields), ebookController.updateMyEbookDetail)
route.post('/myEbookDetail_delete', ebookController.deleteMyEbookDetail)

route.get('/ebookDetail', ebookController.getEbookDetail)

route.get('/indexManagement', adminController.getIndexManagement)

route.get('/ebookManagement', adminController.getEbookManagement)
route.post('/ebookManagement_accept', adminController.handleEbookAccepted)
route.post('/ebookManagement_deny', adminController.handleEbookDenied)
route.post('/ebookManagement_add', upload.fields(uploadFields), adminController.handleAddNewEbook)
route.post('/ebookManagement_delete', adminController.handleDeleteEbook)
route.post('/ebookManagement_update', upload.fields(uploadFields), adminController.handleUpdateEbook)

route.get('/ebookDetailManagement', adminController.getEbookDetailManagement) 

route.get('/userManagement', adminController.getUserManagement)
route.post('/userManagement_delete', adminController.handleUserDelete)

route.get('/adminManagement', adminController.getAdminManagement)
route.post('/adminManagement_add', adminController.handleAddNewAdmin)
route.post('/adminManagement_delete', adminController.handleAdminDelete)

route.get('/requestManagement', adminController.getRequestManagement)
route.post('/approveRequestAdmin', adminController.approveRequestAdmin)
route.post('/rejectRequestAdmin', adminController.rejectRequestAdmin)

route.get('/ebookReading/:ebookId', ebookController.getEbookReading);
route.get('/reviewEbook/:ebookId', adminController.reviewEbook);

route.get('/notification', accessController.getRequests);

route.get('/searchEbook', ebookController.getSearchEbook)

route.post('/requestAccess', accessController.requestAccess)
route.post('/approveRequest', accessController.approveRequest)

route.post('/clearSuccessMessageInNotification', (req, res) => {
    req.session.successMessage = null;
    res.sendStatus(200);
});

route.post('/clearSuccessMessage', (req, res) => {
    delete req.session.successMessage;
    res.sendStatus(200);
});

route.post('/accessEbook', ebookController.accessEbookReading)

route.post('/deleteRequest', accessController.deleteRequest)
route.post('/rejectRequest', accessController.rejectRequest)

route.get('/verify-email', registerController.getAuthenticationEmail);
route.post('/verify-email', registerController.verifyEmail);
route.post('/resend-auth-code', registerController.resendAuthCode);

route.get('/otp-login', loginController.getOtpLogin);
route.post('/verify-otp', loginController.verifyOtp);
route.post('/resend-otp', loginController.resendOtp);

route.get('/forgot-password', loginController.getForgotPasswordForm);
route.post('/send-reset-code', loginController.sendResetCode);
route.get('/verify-reset-code', loginController.getVerifyResetCodeForm);
route.post('/verify-reset-code', loginController.verifyResetCode);
route.post('/resend-reset-code', loginController.resendResetCode);
route.get('/reset-password', loginController.getResetPasswordForm);
route.post('/reset-password', loginController.resetPassword);

route.get('/userProfile/:username', userController.getUserProfile)
route.post('/update-user', userController.updateUser);
route.post('/change-password', userController.changePassword);
route.get('/verify-change', userController.getVerifyChange);
route.post('/verify-change', userController.verifyChange);
route.post('/resend-auth-code', userController.resendAuthCode);

module.exports = route