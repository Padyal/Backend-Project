import { Router } from "express";
import {registerUser} from '../controllers/user.controller.js'
import {upload} from '../middlewares/multer.middleware.js'

const router =  Router()

//url will be like //https://localhost:8000/users/register
// router.route("/register").post(registerUser) without middleware

//addition of multer middleware for file handling
router.route("/register").post(
    upload.fields([
        //avatar
        {
            name:'avatar',
            maxCount:1,
        },
        //coverimage
        {
            name:'coverImage',
            maxCount:1,
        }
    ]),
    registerUser
)

export default router
