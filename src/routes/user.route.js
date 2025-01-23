import { Router } from "express";
import {registerUser} from '../controllers/user.controller.js'

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
            name:'coverImage',
            maxCount:1,
        }
    ])   
    ,registerUser)

export default router
