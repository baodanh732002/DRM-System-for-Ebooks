class IndexController{
    getIndex(req, res){
        res.render("index.ejs")
    }
}
module.exports = new IndexController()