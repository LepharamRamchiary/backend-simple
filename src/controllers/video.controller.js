import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = '', sortBy = '_id', sortType = 'asc', userId } = req.query;

    // Build match stage for query filtering
    const matchStage = {};
    if (query) {
        matchStage.title = {
            $regex: query,
            $options: "i" // Case-insensitive search
        };
    }

    if (userId && isValidObjectId(userId)) {
        matchStage.userId = mongoose.Types.ObjectId(userId);
    }

    // Build sort options
    const sortOptions = {
        [sortBy]: sortType === "asc" ? 1 : -1
    };

    // Aggregation pipeline
    const pipeline = [
        { $match: matchStage },
        { $sort: sortOptions },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                title: 1,
                description: 1,
                videofile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                "owner.username": 1
            }
        }
    ];

    // Execute aggregation
    const videos = await Video.aggregate(pipeline);

    // Count total videos for pagination
    const totalVideos = await Video.countDocuments(matchStage);

    // Send response
    return res.status(200).json(new ApiResponse(200, { videos, totalVideos, page, limit }, "Get All videos Successfully"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    const { videoFile, thumbnail } = req.files;

    if (!videoFile || !thumbnail) {
        throw new ApiError(400, 'Video file and thumbnail are required.');
    }

    // Upload video and thumbnail to Cloudinary
    const videoUploadResult = await uploadOnCloudinary(videoFile[0].path, 'video');
    const thumbnailUploadResult = await uploadOnCloudinary(thumbnail[0].path, 'image');

    // Create a new video entry in the database
    const newVideo = new Video({
        title,
        description,
        videofile: videoUploadResult.secure_url,
        thumbnail: thumbnailUploadResult.secure_url,
        duration: videoUploadResult.duration || 0, // Adjust based on actual response
        views: 0,
        isPublished: true,
        createdAt: new Date(),
        owner: req.user._id // Assuming user ID is available in req.user
    });

    await newVideo.save();

    return res.status(201).json(new ApiResponse(201, newVideo, 'Video published successfully'));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}