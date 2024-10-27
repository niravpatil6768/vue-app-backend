const jwt = require("jsonwebtoken");
const SECRET = "27676ghgtysj";

// const auth = (req, res, next) => {
//     try {
//         let token = req.headers.authorization;
//         console.log(token);
//         if(token){
//             token = token.split(" ")[1];

//             let user = jwt.verify(token, SECRET);
            
//             req.userId = user._id;
//             req.userType = user.type;

//             next();
//         }
//         else{
//             res.status(401).json({
//                 messsage: "UnAuthoeized user",
//             }) 
//         }
//     } 
//     catch(error){
//         res.status(401).json({
//             messsage: "UnAuthoeized user",
//             error
//         })
//     }
// }


const auth = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    res.status(401).json({
        message: "Unauthorized"
    })
}  


module.exports = auth;