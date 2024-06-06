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



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save files in the 'public/contents' directory
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

route.get('/ebookReading/:ebookId', ebookController.getEbookReading);

route.get('/downloadEbook', ebookController.getDownloadEbook);
route.post('/downloadEbook', ebookController.handleDownloadEbook);



module.exports = route