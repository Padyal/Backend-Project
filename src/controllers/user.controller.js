//get user detail from front end
//validation to check if all inputs are correct - not empty
//check if user already exist - via username or email
//check for images and avatar
//upload them on cloudiary
//create user object in db and get response
//check if response 
//remove password and refresh token field from response
//return response



import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/APIerror.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary as cloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler(async  (req,res)=>{

    //we get data from html or form 
    const {fullname,username,email,password}=req.body
    console.log({fullname,username,email,password})

    //check if all field are given as ip from frontend
    if(fullname==='') {throw new ApiError(400,'fullname is required')}
    if(username==='') {throw new ApiError(400,'username is required')}
    if(email==='') {throw new ApiError(400,'email is required')}
    if(password==='') {throw new ApiError(400,'password is required')}

    // const exist = User.findOne({
    //     //we can use or operation in email or username
    //     $or:[{email},{username}]
    // })
    const exist = await User.findOne({email})
    if(exist) {throw new ApiError(409,'User already exist with this username or email')}
    
    //multer give access of files to us
    console.log(req.files)

    const avatarLocPath = req.files?.avatar[0]?.path
    const coverImageLocPath = req.files?.coverImage[0]?.path

    if(!avatarLocPath){throw new ApiError(400,'avatar is required')}

    const avatar = await cloudinary(avatarLocPath)
    const coverImage = await cloudinary(coverImageLocPath)

    if(!avatar){ throw new ApiError(400,'avatar is required')}

    const createdUser = await User.create({
        username:username.toLowerCase(),
        email:email,
        password:password,
        fullname:fullname,
        avatar:avatar.url,
        coverimage:coverImage?.url || ''
    })

    if(!createdUser){throw new ApiError(500,'Error in creation of error')}

    createdUser.select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,createdUser,'User created successfully')
    )
} )

export {registerUser}