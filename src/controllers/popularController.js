class popularController{
    getPopular(req, res){
        if(req.session.user){
            res.render("popular.ejs")
        }else{
            res.redirect("/popular")
        }
        
    }
}
module.exports = new popularController()