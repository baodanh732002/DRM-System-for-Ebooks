const express = require('express')
const route = express.Router()
const multer  = require('multer')

const loginController = require('../controllers/loginController') 
const registerController = require('../controllers/registerController')
const indexController = require('../controllers/indexController')
const logoutController = require('../controllers/logoutController')
const ebookController = require('../controllers/ebookController')
const adminController = require('../controllers/adminController')



const upload = multer({ dest: 'contents/' })

const uploadFields = [
    { name: 'imageFile', maxCount: 1},
    { name: 'ebookFile', maxCount: 1}
]



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
route.post('/myEbookDetail_update', ebookController.updateMyEbookDetail)
route.post('/myEbookDetail_delete', ebookController.deleteMyEbookDetail)

route.get('/ebookDetail', ebookController.getEbookDetail)

route.get('/indexManagement', adminController.getIndexManagement)

route.get('/ebookManagement', adminController.getEbookManagement)
route.get('/ebookDetailManagement', adminController.getEbookDetailManagement)
route.post('/ebookManagement_accept', adminController.handleEbookAccepted)
route.post('/ebookManagement_deny', adminController.handleEbookDenied)

route.get('/userManagement', adminController.getUserManagement)
route.post('/userManagement_delete', adminController.handleUserDelete)

module.exports = route