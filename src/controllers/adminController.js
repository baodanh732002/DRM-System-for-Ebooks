class AdminController{
    async getEbookManagement(req, res){
        res.render("indexManagement")
    }
}

module.exports = new AdminController()