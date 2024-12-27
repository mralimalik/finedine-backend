import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";
import { Venue } from "../models/venue.model.js";
import { generateJwtToken } from "../controllers/user.controller.js";
import { uploadOnCloudinary } from "../cloudinaryconfig.js";
import { Settings } from "../models/admin.settings.js";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input data
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email, and password are required." });
    }

    // Check if user already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      // if email or user exist then check password
      const isPasswordCorrect = await existingAdmin.isPasswordCorrect(password);

      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid password" });
      }
      // if password matches then send response
      const token = generateJwtToken(email, existingAdmin._id);

      return res.status(200).json({ data: { user: existingAdmin }, token });
    }

    //if user doesn't exist then create new user and save
    const newAdmin = new Admin({ email, password });
    await newAdmin.save();

    const token = generateJwtToken(email, newAdmin._id);
    return res.status(200).json({ data: { user: newAdmin }, token });
  } catch (error) {
    // Check for Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.log("Error signing in user", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, changeLogo, companyName } = req.body;
    const businessLogo = req.file;

    // Validate input data
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email, and password are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select("-password");

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    // Upload image to Cloudinary if present
    let imageUrl = null;
    if (businessLogo) {
      const uploadedImage = await uploadOnCloudinary(businessLogo.path);
      imageUrl = uploadedImage.url;
    }

    //if user doesn't exist then create new user and save
    const newUser = new User({
      email,
      password,
      changeLogo,
      businessLogo: imageUrl,
      companyName,
    });
    await newUser.save();

    return res.status(200).json({ message: "New User Created", data: newUser });
  } catch (error) {
    // Check for Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.log("Error signing in user", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const getAllUsersWithVenues = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const usersWithVenues = await Promise.all(
      users.map(async (user) => {
        const venues = (await Venue.find({ userId: user._id })) || [];
        return { ...user.toObject(), venues };
      })
    );
    return res.status(200).json({ data: usersWithVenues });
  } catch (error) {
    console.log("Error fetching users with venues", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const getAdminData = async (req, res) => {
  try {
    //get user email from auth request after verifying token
    const email = req.user?.email;

    if (!email) {
      return res.status(400).json({ message: "Email is missing" });
    }

    // Fetch the user data from the database
    const user = await Admin.findOne({ email }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ data: user });
  } catch (error) {
    console.error("Error fetching user data", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const updateUserBusinessImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyName } = req.body;
    const businessLogo = req.file;

    // Validate input data
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Upload image to Cloudinary if present
    let imageUrl = null;
    if (businessLogo && businessLogo.mimetype.startsWith("image/")) {
      const uploadedImage = await uploadOnCloudinary(businessLogo.path);
      imageUrl = uploadedImage.url;
    }

    // Update user with new business logo
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { businessLogo: imageUrl, companyName: companyName },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res
      .status(200)
      .json({
        message: "Business image updated successfully",
        data: updatedUser,
      });
  } catch (error) {
    // Check for Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.log("Error updating business image", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { countries } = req.body;

    // Validate input data
    if (!countries || !Array.isArray(countries)) {
      return res.status(400).json({ message: "Countries must be an array." });
    }

    // Use a fixed ID to ensure only one settings document exists
    const settingsId = "uniqueSettingsId";

    // Update settings in the database
    const updatedSettings = await Settings.findOneAndUpdate(
      { settingsId: settingsId },
      { countries },
      { new: true, upsert: true }
    );

    return res
      .status(200)
      .json({
        message: "Settings updated successfully",
        data: updatedSettings,
      });
  } catch (error) {
    console.log("Error updating settings", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const getSettings = async (req, res) => {
  try {
    // Use a fixed ID to ensure only one settings document exists
    const settingsId = "uniqueSettingsId";

    // Fetch settings from the database
    const settings = await Settings.findOne({ settingsId });

    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    return res.status(200).json({ data: settings });
  } catch (error) {
    console.log("Error fetching settings", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};
