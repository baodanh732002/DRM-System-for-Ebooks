class AdminController{
    async getEbookManagement(req, res){
        res.render("ebookManagement")
    }
}

module.exports = new AdminController()