import { ModifierGroup } from "../models/modifier.model.js";
import { MenuItem } from "../models/menu.item.js";
import mongoose from "mongoose";

const createModifier = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { groupName, modifierPrices } = req.body;

    const { venueId } = req.params;
    if (!groupName) {
      return res.status(400).json({ message: "groupName is required" });
    }

    if (!venueId) {
      return res.status(400).json({ message: "veneu _id is required" });
    }

    const newModifier = new ModifierGroup({
      venueId: venueId,
      groupName: groupName,
      userId: userId,
      modifierPrices: modifierPrices,
    });
    await newModifier.save();
    return res.status(200).json({ data: newModifier });
  } catch (error) {
    console.error("Error adding menu item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getModifiersByVenue = async (req, res) => {
  try {
    const { venueId } = req.params;

    if (!venueId) {
      return res.status(400).json({ message: "venue _id is required" });
    }

    // Fetch modifiers using the venueId
    const modifiers = await ModifierGroup.find({ venueId: venueId });

    // For each modifier, count how many menu items use it
    const modifiersWithItemCount = await Promise.all(
      modifiers.map(async (modifier) => {
        // Count how many menu items have this modifier in the 'modifiers' array
        const itemsUsingModifier = await MenuItem.countDocuments({
          "modifiers.modifierId": modifier._id, // Match `modifierId` in the nested `modifiers` array
        });

        // Add the count of items using this modifier
        return {
          ...modifier.toObject(), // Convert the mongoose document to a plain object
          itemsUsed: itemsUsingModifier, // Add the new field `itemsUsed`
        };
      })
    );

    return res.status(200).json({ data: modifiersWithItemCount });
  } catch (error) {
    console.error("Error fetching modifiers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteModifier = async (req, res) => {
  try {
    const { modifierIds } = req.body;

    console.log(modifierIds);
    

    // Check if modifierIds is provided and it's an array
    if (
      !modifierIds ||
      !Array.isArray(modifierIds) ||
      modifierIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Modifier IDs are required in an array" });
    }

    // Delete multiple modifiers by their _ids
    const deletedModifiers = await ModifierGroup.deleteMany({
      _id: { $in: modifierIds },
    });

    if (deletedModifiers.deletedCount === 0) {
      return res.status(404).json({ message: "No modifiers found to delete" });
    }
    return res.status(200).json({
      message: `${deletedModifiers.deletedCount} modifiers deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting modifiers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




// // // specific item modifiers
// const getItemModifiers = async (req, res) => {
//   const { itemId } = req.params;

//   if (!itemId) {
//     return res.status(400).json({ message: "itemId is required" });
//   }

//   try {
//     // Validate and get the item
//     const item = await MenuItem.findById(itemId);
//     if (!item) {
//       return res.status(404).json({ message: "Item not found" });
//     }

//     // Use aggregation to fetch modifiers with active prices
//     const modifiers = await ModifierGroup.aggregate([
//       {
//         $match: {
//           _id: { $in: item.modifiers.map((mod) => mod.modifierId) },
//         },
//       },
//       {
//         $project: {
//           groupName: 1,
//           venueId: 1,
//           userId: 1,
//           isActive: 1,
//           modifierPrices: {
//             $filter: {
//               input: "$modifierPrices",
//               as: "price",
//               cond: { $eq: ["$$price.isActive", true] }, // Filter active prices
//             },
//           },
//         },
//       },
//     ]);

//     return res.status(200).json({ item,modifiers });
//   } catch (error) {
//     console.error("Error fetching modifiers:", error);
//     return res.status(500).json({ message: "Server error", error });
//   }
// };


const getItemModifiers = async (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    return res.status(400).json({ message: "itemId is required" });
  }

  try {
    // Validate and get the item
    const item = await MenuItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Use aggregation to fetch modifiers with active prices
    const modifiers = await ModifierGroup.aggregate([
      {
        $match: {
          _id: { $in: item.modifiers.map((mod) => mod.modifierId) },
        },
      },
      {
        $project: {
          groupName: 1,
          isActive: 1,
          modifierPrices: {
            $filter: {
              input: "$modifierPrices",
              as: "price",
              cond: { $eq: ["$$price.isActive", true] }, // Filter active prices
            },
          },
        },
      },
    ]);

    // Map modifiers back into the item's modifiers field
    const enrichedModifiers = item.modifiers.map((mod) => {
      const modifierDetails = modifiers.find(
        (modifier) => String(modifier._id) === String(mod.modifierId)
      );
      return {
        ...mod._doc, // Include original modifier fields (min, max, required, etc.)
        ...modifierDetails, // Add modifier group details (groupName, isActive, prices, etc.)
      };
    });

    // Return the enriched item with modifiers
    return res.status(200).json({
      item: {
        ...item._doc,
        modifiers: enrichedModifiers,
      },
    });
  } catch (error) {
    console.error("Error fetching modifiers:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};



export { createModifier, getModifiersByVenue, deleteModifier,getItemModifiers };


// [
//   {
//     "modifierId or modifierGroupId":lkdf,
//     "modifierPriceId or modifierItemId":asdfasdf,
//     "quantity":

//   },

//   {
//     "modifierId or modifierGroupId":lkdf,
//     "modifierPriceId or modifierItemId":asdfasdf,
//     "quantity":
    
//   },
// ]