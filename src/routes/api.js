const express = require('express')
const multer  = require('multer')
const router = express.Router();
const ebookController = require('../controllers/ebookController')

const upload = multer({ dest: 'contents/' })

const uploadFields = [
    { name: 'imageFile', maxCount: 1},
    { name: 'ebookFile', maxCount: 1}
]

router.post('/ebook', upload.fields(uploadFields), ebookController.createNewEbook)

module.exports = router