const express = require('express')
const route = express.Router()
const loginController = require('../controllers/loginController') 
const registerController = require('../controllers/registerController')
const indexController = require('../controllers/indexController')
const logoutController = require('../controllers/logoutController')
const newestController = require('../controllers/newestController')
const popularController = require('../controllers/popularController')
const myEbooksController = require('../controllers/myEbooksController')
const ebookDetailController = require('../controllers/ebookDetailController')
const newestDetailController = require('../controllers/newestDetailController')
const popularDetailController = require('../controllers/popularDetailController')


route.get('/', indexController.getIndex)

route.get('/login', loginController.getLoginForm)
route.post('/login', loginController.checkAccount)

route.get('/register', registerController.getRegisterForm)
route.post('/register', registerController.createAccount)

route.get('/logout', logoutController.logout)

route.get('/newest', newestController.getNewest)
route.get('/newest/newestDetail', newestDetailController.getNewestDetail)

route.get('/popular', popularController.getPopular)
route.get('/popular/popularDetail', popularDetailController.getPopularDetail)

route.get('/myEbooks', myEbooksController.getMyEbooks)
route.get('/myEbooks/ebookDetail', ebookDetailController.getEbookDetail)


module.exports = route