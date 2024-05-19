class newestDetailController{
    getNewestDetail(req, res){
        if(req.session.user){
            res.render("newestDetail.ejs")
        }else{
            res.redirect("/newest/ebookDetail")
        }
    }
}
module.exports = new newestDetailController()