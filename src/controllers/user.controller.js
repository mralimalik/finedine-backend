import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { Venue } from "../models/venue.model.js";
import { uploadOnCloudinary } from "../cloudinaryconfig.js";
export const generateJwtToken = (email, id) => {
  return jwt.sign(
    { email: email, _id: id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" } // Token valid for 1 hour
  );
};

const signInUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input data
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email, and password are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // if email or user exist then check password
      const isPasswordCorrect = await existingUser.isPasswordCorrect(password);

      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid password" });
      }
      // if password matches then send response
      const token = generateJwtToken(email, existingUser._id);

      // Fetch venue data where userId matches user's ID
      const venues = await Venue.find({ userId: existingUser._id });

      return res
        .status(200)
        .json({ data: { user: existingUser, venues }, token });
    }

    //if user doesn't exist then create new user and save
    const newUser = new User({ email, password });
    await newUser.save();
    // Fetch venue data where userId matches user's ID
    // const venues = await Venue.find({ userId: existingUser._id });
    const token = generateJwtToken(email, newUser._id);
    return res.status(200).json({ data: { user: newUser, venues: [] }, token });
  } catch (error) {
    // Check for Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.log("Error signing in user", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const getUserData = async (req, res) => {
  try {
    //get user email from auth request after verifying token
    const email = req.user?.email;

    if (!email) {
      return res.status(400).json({ message: "Email is missing" });
    }

    // Fetch the user data from the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch venue data where userId matches user's ID
    const venues = await Venue.find({ userId: user._id });

    res.status(200).json({ data: { user, venues } });
  } catch (error) {
    console.error("Error fetching user data", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Update user information (first name, last name, or business logo)
const updateUser = async (req, res) => {
  try {
    // Extract user ID from the JWT token
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const { firstName, lastName } = req.body;
    const businessLogo = req.file;

    // Validate input data
    if (!firstName && !lastName && !businessLogo) {
      return res.status(400).json({
        message:
          "At least one field (firstName, lastName, or businessLogo) is required.",
      });
    }

    // Update user fields
    const updatedFields = {};
    if (firstName) updatedFields.firstName = firstName;
    if (lastName) updatedFields.lastName = lastName;

    // Handle image upload if a new image is provided and it is a file
    if (businessLogo && businessLogo.mimetype.startsWith("image/")) {
      const imageUrl = await uploadOnCloudinary(businessLogo.path);
      updatedFields.businessLogo = imageUrl.url;
    }

    // Find the user by ID and update the specified fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User information updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user information", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export { signInUser, getUserData, updateUser };
