import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/APIerror.js'
//user can directly access mongo db
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler( async (req,res)=>{
    //step 1 : get user credentials from users
    //step 2 : validation of all input (!empty and correct format)
    //step 3 : check if user already exist(username and email)
    //step 4 : check for avatar as its required
    //step 5 : upload them to cloudinary
    //step 6 : Check if uplaoded correctly
    //step 7 : Make user object - create entry in db
    //step 8 : Remove password and refresh token field
    //step 9 : Check if user created successfully
    //step 10 : return res

    const {fullName,email,userName,password} = req.body;
    // normal syntax
    // if(fullName===""){
    //     throw new ApiError(400,'Enter valid username')
    // }

    //good syntax
    if([fullName,userName,email,password].some((field)=>{
        if(field){
            if(field.trim()==="") return true;
        }return false
    })){
        throw new ApiError(400,"All fields are required")
    }

    const exist = User.findOne({
        $or:[{userName},{email}]
    })
    if(exist){
        throw new ApiError(409,"This User already exist")
    }
    

    const localAvatarPath=req.files?.avatar[0]?.path
    const localCoverPath=req.files?.coverImage[0]?.path

    if(localAvatarPath){
        throw new ApiError(400,'Avatar file is required')
    }
    const avatar = await uploadOnCloudinary(localAvatarPath)
    const coverImage = await uploadOnCloudinary(localCoverPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url||"",
        userName: userName.toLowerCase(),
        email,
        password,
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,'Some went wrong while registration of new user')
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created sucessfully")
    )
})

export {registerUser}