class IndexController{
    getIndex(req, res){
        if(req.session.user){
            res.render("index.ejs")
        }else{
            res.redirect("/login")
        }
        
    }
}
module.exports = new IndexController()