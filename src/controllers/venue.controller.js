import { Venue } from "../models/venue.model.js";
import { Menu } from "../models/menu.model.js";
import { OrderSetting } from "../models/order.setting.model.js";
import { ExtraCharge } from "../models/extra.charges.model.js";
import mongoose from "mongoose";
const createRandomVenueId = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i <= 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const createVenue = async (req, res) => {
  try {
    //get user id from auth jwt and required name and country
    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User id is missing" });
    }
    const { venueName, country } = req.body;
    if (!venueName || !country) {
      return res
        .status(400)
        .json({ message: "venueName and country is required" });
    }

    //create random short venueId
    const venueId = createRandomVenueId();
    const newVenue = new Venue({ venueName, country, venueId, userId });

    // Create default order settings with venueId
    const orderSetting = new OrderSetting({ venueId: newVenue._id });
    await orderSetting.save();

    await newVenue.save().then((response) => {
      res.status(200).json({ data: response });
    });
  } catch (e) {
    console.log("Error creating venue", e);
    res.status(500).json({ message: "Something went wrong", e });
  }
};

// Function to fetch all venues for a specific user
const getAllVenuesByUser = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    // Find all venues where userId matches
    const venues = await Venue.find({ userId });

    res.status(200).json({ data: venues });
  } catch (e) {
    console.error("Error fetching venues", e);
    res.status(500).json({ message: "Something went wrong", e });
  }
};

const updateVenueById = async (req, res) => {
  try {
    const userId = req.user?._id; // Extract the user ID
    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    const { venueId } = req.params;
    const { venueName, country } = req.body;

    if (!venueId) {
      return res.status(400).json({ message: "venueId is required" });
    }
    if (!venueName && !country) {
      return res
        .status(400)
        .json({ message: "Provide venueName or country to update" });
    }

    const updateData = {};
    if (venueName) updateData.venueName = venueName;
    if (country) updateData.country = country;

    const updatedVenue = await Venue.findOneAndUpdate(
      { venueId, userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedVenue) {
      return res
        .status(404)
        .json({ message: "Venue not found or unauthorized" });
    }

    res
      .status(200)
      .json({ message: "Venue updated successfully", data: updatedVenue });
  } catch (e) {
    console.error("Error updating venue", e);
    res.status(500).json({ message: "Something went wrong", e });
  }
};

// Function to fetch a venue by venueId for the logged-in user for dashbaord
const getVenueById = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    const { venueId } = req.params; // Get the venueId from the URL parameters
    if (!venueId) {
      return res.status(400).json({ message: "Venue ID is required" });
    }

    // Find the venue by venueId and userId (to ensure the venue belongs to the user)
    const venue = await Venue.findOne({ venueId, userId });

    if (!venue) {
      return res
        .status(404)
        .json({ message: "Venue not found or unauthorized" });
    }

    // Return the venue data
    res.status(200).json({ data: venue });
  } catch (e) {
    console.error("Error fetching venue by ID", e);
    res.status(500).json({ message: "Something went wrong", e });
  }
};

const addExtraCharges = async (req, res) => {
  try {
    const { venueId } = req.params; // Extract venueId from the route parameters
    const { charges } = req.body; // Array of charges (could be new, existing, or to be deleted)
    console.log(charges);

    // Validate venueId
    if (!venueId) {
      return res
        .status(400)
        .json({ message: "Venue _id (venueId) is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ message: "Invalid Venue ID format." });
    }

    // Validate that the request body is an array
    if (!Array.isArray(charges) || charges.length === 0) {
      return res.status(400).json({
        message: "Request body must be a non-empty array of charges.",
      });
    }

    // Validate each entry in the array
    const allowedChargesTypes = ["DISCOUNT", "SERVICE", "TAXES"];
    for (const charge of charges) {
      const { name, amount, chargesType, amountType } = charge;

      // Validation checks
      if (!name || !chargesType || amount === undefined) {
        return res.status(400).json({
          message:
            "Each extra charge must include name, chargesType, and amount.",
        });
      }

      if (!allowedChargesTypes.includes(chargesType)) {
        return res.status(400).json({
          message: `Invalid chargesType in one of the entries. Allowed values are: ${allowedChargesTypes.join(
            ", "
          )}.`,
        });
      }

      if (!["PERCENT", "NUMBER"].includes(amountType)) {
        return res.status(400).json({
          message: `Invalid amountType. Allowed values are: PERCENT, NUMBER.`,
        });
      }
    }

    // Process each charge (either add, update, or handle deletions)
    const processedCharges = await Promise.all(
      charges.map(async (charge) => {
        const { _id, chargesType, name, amount, amountType, isActive } = charge;

        const chargeData = {
          venueId,
          chargesType,
          name,
          amount,
          amountType: amountType || "PERCENT", // Defaulting to 'PERCENT' if not provided
          isActive: isActive !== undefined ? isActive : false, // Default to active if not provided
        };

        if (_id) {
          // Update existing charge if an id is provided
          const updatedCharge = await ExtraCharge.findByIdAndUpdate(
            _id,
            chargeData,
            { new: true } // Return the updated document
          );
          return updatedCharge;
        } else {
          // Add new charge if no id is provided
          const newCharge = new ExtraCharge(chargeData);
          return await newCharge.save();
        }
      })
    );

    // Filter out any null entries (charges marked for deletion)
    const validCharges = processedCharges.filter((charge) => charge !== null);

    // Respond with success
    res.status(200).json({
      message: "Extra charges successfully added/updated/deleted.",
      data: validCharges,
    });
  } catch (error) {
    console.error("Error adding/updating/deleting extra charges:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const deleteExtraCharges = async (req, res) => {
  try {
    const { ids } = req.body; // Extract the array of _id's from the request body

    // Validate that ids is an array
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Request body must contain an array of _id's." });
    }

    // Validate that each id is in a valid ObjectId format
    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: `Invalid _id format: ${id}` });
      }
    }

    // Delete the extra charges from the database
    const result = await ExtraCharge.deleteMany({ _id: { $in: ids } });

    // Check if any charges were deleted
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No charges found with the provided _id(s)." });
    }

    // Respond with success
    res.status(200).json({
      message: `${result.deletedCount} extra charge(s) successfully deleted.`,
    });
  } catch (error) {
    console.error("Error deleting extra charges:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const getExtraChargesByVenueId = async (req, res) => {
  try {
    const { venueId } = req.params; // Extract venueId from the route parameters

    // Validate venueId
    if (!venueId) {
      return res
        .status(400)
        .json({ message: "Venue _id (venueId) is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({ message: "Invalid Venue ID format." });
    }

    // Fetch extra charges for the given venueId
    const extraCharges = await ExtraCharge.find({ venueId });

    // Respond with the found extra charges
    res.status(200).json({
      message: "Extra charges retrieved successfully.",
      data: extraCharges,
    });
  } catch (error) {
    console.error("Error fetching extra charges:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// const getGroupedExtraCharges = async (req, res) => {
//   try {
//     const { venueId } = req.params; // Extract venueId from the route parameters

//     // Validate venueId
//     if (!venueId) {
//       return res.status(400).json({ message: "Venue _id (venueId) is required." });
//     }

//     if (!mongoose.Types.ObjectId.isValid(venueId)) {
//       return res.status(400).json({ message: "Invalid Venue ID format." });
//     }

//     // Retrieve extra charges grouped by chargesType but keep all fields
//     const groupedCharges = await ExtraCharge.aggregate([
//       {
//         $match: { venueId: new mongoose.Types.ObjectId(venueId) }, // Match only charges for the specific venue
//       },
//       {
//         $group: {
//           _id: "$chargesType", // Group by the chargesType field
//           charges: {
//             $push: "$$ROOT", // Push the entire document into the charges array (including all fields)
//           },
//         },
//       },
//       {
//         // $project: {
//         //   _id: 0, // Exclude the _id field from the output
//         //   chargesType: "$_id", // Rename _id to chargesType
//         //   charges: 1, // Include the full charges array
//         // },
//       },
//     ]);

//     // Format the response into an object with chargesType as keys
//     const chargesByType = {
//       DISCOUNT: [],
//       SERVICE: [],
//       TAXES: [],
//     };

//     // Populate the grouped charges into the appropriate categories
//     groupedCharges.forEach((group) => {
//       if (chargesByType[group.chargesType]) {
//         chargesByType[group.chargesType] = group.charges;
//       }
//     });

//     // Respond with the full charges grouped by chargesType
//     res.status(200).json({
//       message: "Extra charges fetched successfully.",
//       data: chargesByType,
//     });
//   } catch (error) {
//     console.error("Error fetching extra charges:", error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };

// get venue data for qr frontend

const getVenueDataForQr = async (req, res) => {
  try {
    const { venueId } = req.params; // Get the venueId from the URL parameters
    if (!venueId) {
      return res.status(400).json({ message: "Venue ID is required" });
    }

    // Find the venue by venueId
    const venue = await Venue.findOne({ venueId });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Find all menus for the given venueId
    const menus = await Menu.find({ venueId: venue._id, isActive: true });
    if (!menus) {
      return res.status(404).json({ message: "No menus found for this venue" });
    }
    const venueCharges = await ExtraCharge.find({
      venueId: venue._id,
      isActive: true,
    });

    // Return the venue data
    res.status(200).json({ venue, menus: menus || [], venueCharges });
  } catch (e) {
    console.error("Error fetching venue by ID", e);
    res.status(500).json({ message: "Something went wrong", e });
  }
};

export {
  createVenue,
  getAllVenuesByUser,
  updateVenueById,
  getVenueById,
  getVenueDataForQr,
  addExtraCharges,
  getExtraChargesByVenueId,
  deleteExtraCharges,
};
