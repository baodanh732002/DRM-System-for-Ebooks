class popularDetailController{
    getPopularDetail(req, res){
        if(req.session.user){
            res.render("popularDetail.ejs")
        }else{
            res.redirect("/popular/popularDetail")
        }
    }
}
module.exports = new popularDetailController()