import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: "dxkh6jykj",
  api_key: "885671947563655",
  api_secret: "Kc8utA8V2FyGadNoBvSoyjXUqeI",
});


const uploadOnCloudinary = async (localFilePath) => {
  try {
      if (!localFilePath) return null

      //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
          resource_type: "auto",
          folder:"items"
      })

      console.log('File uploaded to Cloudinary:', response.url);
    
      fs.unlinkSync(localFilePath)
      
      return response;

  } catch (error) {
     // remove the locally saved temporary file as the upload operation got failed
      fs.unlinkSync(localFilePath)
      return null;
  }
}
export  {uploadOnCloudinary};
