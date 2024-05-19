const express = require('express')
const route = express.Router()
const loginController = require('../controllers/loginController') 
const registerController = require('../controllers/registerController')
const indexController = require('../controllers/indexController')
const logoutController = require('../controllers/logoutController')
const newestController = require('../controllers/newestController')

const myEbooksController = require('../controllers/myEbooksController')
const popularController = require('../controllers/popularController')


route.get('/', indexController.getIndex)

route.get('/login', loginController.getLoginForm)
route.post('/login', loginController.checkAccount)

route.get('/register', registerController.getRegisterForm)
route.post('/register', registerController.createAccount)

route.get('/logout', logoutController.logout)

route.get('/newest', newestController.getNewest)
route.get('/popular', popularController.getPopular)
route.get('/myEbooks', myEbooksController.getMyEbooks)


module.exports = route