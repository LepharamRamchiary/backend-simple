import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                metadata: [{ $count: "total" }, { $addFields: { page: parseInt(page) } }],
                data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }],
            },
        },
        { $unwind: "$metadata" }
    ]);

    const response = {
        comments: comments.length > 0 ? comments[0].data : [],
        totalPages: comments.length > 0 ? Math.ceil(comments[0].metadata.total / limit) : 0,
        currentPage: parseInt(page)
    };

    res.status(200).json(new ApiResponse(200, response, "Comments retrieved successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: Add a comment
    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const newComment = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId), 
        owner: req.user._id 
    });

    res.status(201).json(new ApiResponse(201, newComment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
