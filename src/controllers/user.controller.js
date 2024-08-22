import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if uesr already exists: username, email
    // check for image, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove passwoerd and refresh token field from response
    // check for user creation
    // return respones


    // get user details from frontend
    const { fullname, email, password, username } = req.body
    // console.log("email", email);

    // validation - not empty
    if (
        [fullname, email, password, username].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are requered")
    }

    // check if uesr already exists: username, email
    const existedUser = User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email and username alreday exists")
    }
    // checking one by one 
    // if(existedUser){
    //     if(existedUser.email === email){
    //         throw new ApiError(409,"email already exists")
    //     }

    //     if(existedUser.username === username){
    //         throw new ApiError(409,"username alreday exists")
    //     }
    // }
    // or one another method is:-
    // const existedEmail = await User.findOne({ email })
    // if (existedEmail) {
    //     throw new ApiError(409, "email already exists")
    // }
    // const existedUsername = await User.findOne({ username })
    // if (existedUsername) {
    //     throw new ApiError(409, "username alreday exists")
    // }

    // check for image, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object - create entry in db
    const user = await User.create({
        fullname,
        password,
        email,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    // remove passwoerd and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        // write what are the fields you need to remove || write what fields are not need
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return respones
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

export { registerUser }