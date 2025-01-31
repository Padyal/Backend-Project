import { Router } from "express";
import {registerUser,loginUser,logoutUser,refreshAccessToken} from '../controllers/user.controller.js'
import {verifyJWT} from '../middlewares/auth.middleware.js'


// we use multer to handle our files in a particular routes
import {upload} from '../middlewares/multer.middleware.js'

//function in express that helps bring modularity
const router =  Router()

//url will be like //https://localhost:8000/users/register
// router.route("/register").post(registerUser) without middleware

//addition of multer middleware for file handling
router.route("/register").post(
    upload.fields([
        {
            //name for this field will be same as it is in front end so remembering this is imp
            name:'avatar',
            maxCount : 1
        },{
            name:'coverimage',
            maxCount:1,
        }
    ])   
    ,registerUser)

router.route('/login').post(loginUser)

//secured routes
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/refresh-token').post(refreshAccessToken)

export default router
