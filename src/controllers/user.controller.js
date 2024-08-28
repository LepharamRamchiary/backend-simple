import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jet from "jsonwebtoken"


//generate access and referesh token
const generateAccessTokenAndRefereshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

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
    const existedUser = await User.findOne({
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
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    // console.log("body",req.body);
    // console.log("files",req.files);

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

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // check user
    // password check
    // access and referesh token
    // send cookie
    //response return

    // req body -> data
    const { username, email, password } = req.body

    // username or email
    if (!username && !email) {
        throw new ApiError(400, "username and email is required!")
    }
    // if we need single like login with email and login with username then we do this way 
    // if(!email){
    //     throw new ApiError(400,"email is required!")
    // }
    // if(!username){
    //     throw new ApiError(400,"username is required!")
    // }

    // find the user
    // we find user with email or username 
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    // finding with single 
    // const user = await User.findOne({username})
    // const user = await User.findOne({email})

    // check user
    if (!user) {
        throw new ApiError(404, "User not found or exists")
    }

    // password check-> true or false
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // access and referesh token
    const { accessToken, refreshToken } = await generateAccessTokenAndRefereshToken(user._id)

    // send cookie
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }

    //response return
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, refreshToken, accessToken
                },
                "User logged In Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    // removing refreshToken from DB 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    // clearing a cookies 
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefereshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    // finding a oldUser
    const user = await User.findById(req.user?.id)
    // pasword curret or not 
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // set new password
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password is change sucessfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetch successfully"))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser }