import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto"
        }
        )
        // file has been upload successfull
        // console.log("file is upload on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporay file as the upload operation got failed
    }
    // console.log("Response got: ",response);
}

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error('Failed to delete the file from Cloudinary');
    }
};

export { uploadOnCloudinary, deleteFromCloudinary }