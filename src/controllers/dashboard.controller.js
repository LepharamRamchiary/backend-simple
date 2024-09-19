import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        }
    ])

    const totalSubscribers = await Subscription.countDocuments({
        channel: userId
    })

    const totalLikes = await Like.countDocuments({
        video: {
            $in: await Video.find({
                owner: userId
            }).select("_id")
        }
    })

    const stats = {
        totalViews: videoStats.length ? videoStats[0].totalViews : 0,
        totalVideos: videoStats.length ? videoStats[0].totalVideos : 0,
        totalSubscribers,
        totalLikes
    }

    if (!stats) {
        throw new ApiError(404, "Stats not found")
    }

    res
        .status(200)
        .json(new ApiResponse(200, stats, "Stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const { page = 1, limit = 10 } = req.query

    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            }
        ]),
        { page, limit }
    )

    if (!videos) {
        throw new ApiError(404, "Videos not found")
    }

    res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))

})

export {
    getChannelStats,
    getChannelVideos
}