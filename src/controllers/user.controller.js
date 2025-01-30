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


const generateAccessAndRefreshToken = async (userId)=>{
    try{
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        //save refreshToken in db
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return{accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,'something went wrong while generating refresh and access token ')
    }
}

const registerUser = asyncHandler(async  (req,res)=>{

    //we get data from html or form 
    const {fullname,username,email,password}=req.body
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

    const avatarLocPath = req.files?.avatar[0]?.path
    //const coverImageLocPath = req.files?.coverimage[0]?.path

    let coverImageLocPath;
    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
        coverImageLocPath = req.files.coverimage[0].path
    }

    if(!avatarLocPath){throw new ApiError(400,'avatar is required')}
 
    const avatar = await cloudinary(avatarLocPath)
    const coverImage = await cloudinary(coverImageLocPath)

    if(!avatar){ throw new ApiError(400,'avatar is required')}
    
    const user = await User.create({
        username:username.toLowerCase(),
        email:email,
        password:password,
        fullname:fullname,
        avatar:avatar.url,
        coverimage:coverImage?.url || ''
    })

    if(!user){throw new ApiError(500,'Error in creation of error')}
    
    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    if(!createdUser){throw new ApiError(500,'Something went wrong')}

    return res.status(201).json(
        new ApiResponse( 200,createdUser,'User created successfully')
    )
} )


const loginUser = asyncHandler(async (req,res)=>{
    // req.body ->data
    // check is email and username exist
    // find the user in db
    //check passwrord
    //access and refresh token
    // send this token in cookies 
    // send response

    const {email,username,password} = req.body
    if(!username && !email) {throw new ApiError(400,"username or email is required")}

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user) {throw new ApiError(404,"User does not exist!!")}

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect) {throw new ApiError(401,"Invalid user credentials")}

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedUser = await User.findById(user._id).select('-password -refreshToken')

    //by default cookies are modifiable by anyone but when we user httpOnly:true and secure:true cookie are now only modifiable via server only
    const option = {
        httpOnly : true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedUser,accessToken,refreshToken
            },
            "User logged In successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const option = {
        httpOnly : true,
        secure:true
    }

    return res.status(200).clearCookie("accessToken",option).clearCookie("refreshToken",option)
    .json(new ApiResponse(200,{},"User logged out successfully"))

})

export {registerUser, loginUser , logoutUser}