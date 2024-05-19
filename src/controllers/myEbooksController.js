class myEbooksController{
    getMyEbooks(req, res){
        if(req.session.user){
            res.render("myEbooks.ejs")
        }else{
            res.redirect("/myEbooks")
        }
        
    }
}
module.exports = new myEbooksController()