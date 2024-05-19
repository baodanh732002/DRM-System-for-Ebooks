class newestController{
    getNewest(req, res){
        if(req.session.user){
            res.render("newest.ejs")
        }else{
            res.redirect("/newest")
        }
        
    }
}
module.exports = new newestController()