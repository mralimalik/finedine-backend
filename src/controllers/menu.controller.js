import { Menu } from "../models/menu.model.js";
import mongoose from "mongoose";
import { MenuSection } from "../models/menu.section.js";
import { MenuItem } from "../models/menu.item.js";
import { Venue } from "../models/venue.model.js";
import { uploadOnCloudinary } from "../cloudinaryconfig.js";
import { log } from "console";
// // to get all menues of particular venue
// const getAllMenues = async (req, res) => {
//   // Access venueId from URL params correctly
//   const { venueId } = req.params;

//   // Check if venueId is provided
//   if (!venueId) {
//     return res.status(400).json({ message: "venueId is required" });
//   }

//   try {
//     //convert string id to mongo obj
//     let objectId = new mongoose.Types.ObjectId(venueId);
//     const menus = await Menu.find({ venueId: objectId });
//     return res.status(200).json({ data: menus });
//   } catch (error) {
//     console.error("Error fetching menus:", error);
//     return res.status(500).json({ message: "Server error", error });
//   }
// };

//get all menues for dashboard
const getAllMenues = async (req, res) => {
  const { venueId } = req.params;

  if (!venueId) {
    return res.status(400).json({ message: "venueId is required" });
  }

  try {
    // Convert string venueId to a MongoDB ObjectId
    const objectId = new mongoose.Types.ObjectId(venueId);

    // Find all menus for the given venueId
    const menus = await Menu.find({ venueId: objectId });

    // Fetch the number of sections and items for each menu
    const menusWithCounts = await Promise.all(
      menus.map(async (menu) => {
        const sectionCount = await MenuSection.countDocuments({
          menuId: menu._id,
        });
        const itemCount = await MenuItem.countDocuments({ menuId: menu._id });

        // Convert menu to a plain object and add section and item counts
        return {
          ...menu.toObject(),
          sections: sectionCount,
          items: itemCount,
        };
      })
    );

    return res.status(200).json({ data: menusWithCounts });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// to update sepecific menue
const updateMenu = async (req, res) => {
  //get required data from body and menuId from params
  const { menuName, isActive, dineInOrder, deliveryOrder } = req.body;
  const { menuId } = req.params;

  if (!menuId) {
    return res.status(400).json({ message: "menuId is required" });
  }

  if (menuName === undefined && isActive === undefined) {
    return res
      .status(400)
      .json({ message: "At least one of menuName or isActive is required" });
  }
  try {
    const updateData = {};
    if (menuName !== undefined) updateData.menuName = menuName;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (dineInOrder !== undefined) {
      updateData["orderSettings.dineIn.orderEnabled"] = dineInOrder;
    }
    if (deliveryOrder !== undefined) {
      updateData["orderSettings.delivery.orderEnabled"] = deliveryOrder;
    }

    

    // find the menu id and replace with new data
    const updatedMenu = await Menu.findOneAndUpdate(
      { _id: menuId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    return res.status(200).json({ data: updatedMenu });
  } catch (error) {
    console.error("Error updating menu:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// get all menu items with sections and children
const getMenuItemsWithSections = async (req, res) => {
  const { menuId } = req.params;

  if (!menuId) {
    return res.status(400).json({ error: "menuId is required" });
  }

  try {
    const objectId = new mongoose.Types.ObjectId(menuId);

    // Fetch MenuSections where parentId is null (Top-level sections)
    const sections = await MenuSection.find({
      menuId: objectId,
      parentId: null,
    });

    // Fetch MenuItems where parentId is null (Top-level items)
    const items = await MenuItem.find({
      menuId: objectId,
      parentId: null,
    });

    // Fetch sub-sections and items for each top-level section
    const sectionsWithChildren = await Promise.all(
      sections.map(async (section) => {
        const sectionItems = await MenuItem.find({
          menuId: objectId,
          parentId: section._id,
        });

        const subSections = await fetchSubSections(section._id, objectId); // Recursively get sub-sections

        return {
          ...section.toObject(),
          items: sectionItems,
          subSections: subSections, // Add nested sub-sections
        };
      })
    );

    // Combine top-level sections, items, and nested sections
    const combined = [
      ...sectionsWithChildren,
      ...items, // Include top-level items
    ];

    res.status(200).json(combined); // Return the combined data
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to fetch sub-sections and sub-items recursively
const fetchSubSections = async (parentSectionId, menuId) => {
  // Fetch sub-sections under a section
  const subSections = await MenuSection.find({
    menuId: menuId,
    parentId: parentSectionId,
  });

  // For each sub-section, fetch the items under that sub-section
  const subSectionsWithItems = await Promise.all(
    subSections.map(async (subSection) => {
      const subItems = await MenuItem.find({
        menuId: menuId,
        parentId: subSection._id,
      });

      // Recursively fetch sub-sections for this sub-section
      const nestedSubSections = await fetchSubSections(subSection._id, menuId);

      return {
        ...subSection.toObject(),
        items: subItems,
        subSections: nestedSubSections, // Nested sub-sections
      };
    })
  );

  return subSectionsWithItems;
};

const createMenuWitoutItems = async (req, res) => {
  try {
    //get user id from auth jwt and required name and country
    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User id is missing" });
    }
    const { venueId } = req.params;

    if (!venueId) {
      return res.status(400).json({ message: "venueId is required" });
    }
    // Check if venue exists in the Venue collection by the venueId field
    const venue = await Venue.findOne({ venueId }); // Query by the short venueId
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const newMenu = new Menu({ menuName: "Menu", venueId: venue._id, userId });
    const savedMenu = await newMenu.save();

    // Convert savedMenu to a plain object and add sections and items
    const response = savedMenu.toObject(); // Converts the Mongoose document to a plain object
    response.sections = 0;
    response.items = 0;
    res.status(200).json({ data: response });
  } catch (e) {
    console.log("Error creating menu", e);
    res.status(500).json({ message: "Something went wrong", e });
  }
};

const createMenuWithItemsSections = async (req, res) => {
  try {
    //get user id from auth jwt and required name and country
    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User id is missing" });
    }
    const { venueId } = req.params;

    if (!venueId) {
      return res.status(400).json({ message: "venueId is required" });
    }

    const venue = await Venue.findOne({ venueId });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const newMenu = new Menu({ menuName: "Menu", venueId: venue._id, userId });
    await newMenu.save();

    const sections = [
      {
        sectionName: "Starters",
        type: "SECTION",
        isActive: true,
        parentId: null,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 1,
        image: "https://www.foodfusion.com/wp-content/uploads/2018/03/2-1.jpg",
      },
      {
        sectionName: "Salads",
        type: "SECTION",
        isActive: true,
        parentId: null,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 2,
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c2FsYWR8ZW58MHx8MHx8fDA%3D",
      },
      {
        sectionName: "Desserts",
        type: "SECTION",
        isActive: true,
        parentId: null,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 3,
        image:
          "https://images.immediate.co.uk/production/volatile/sites/30/2017/11/Vegan-chocolate-tart-with-raspberries-05795f4.jpg?quality=90&resize=556,505",
      },
    ];

    // Save the sections
    const savedSections = await MenuSection.insertMany(sections);

    const section1Items = [
      {
        isActive: true,
        itemName: "Butternut Squash Soup",
        type: "ITEM",
        image: "",

        price: [
          {
            name: "",
            price: 20,
            calories: 100,
          },
        ],
        parentId: savedSections[0]._id,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 1,
      },
      {
        isActive: true,
        itemName: "Gazpacho",
        type: "ITEM",
        image: "",

        price: [
          {
            name: "",
            price: 20,
            calories: 100,
          },
        ],
        parentId: savedSections[0]._id,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 2,
      },
    ];
    const section2Items = [
      {
        isActive: true,
        itemName: "Chef's Special Salad ",
        type: "ITEM",
        image: "",
        price: [
          {
            name: "",
            price: 20,
            calories: 100,
          },
        ],
        parentId: savedSections[1]._id,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 1,
      },
      {
        isActive: true,
        itemName: "Crunchy Spinach Salad",
        type: "ITEM",
        image: "",

        price: [
          {
            name: "",
            price: 20,
            calories: 100,
          },
        ],
        parentId: savedSections[1]._id,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 2,
      },
    ];
    const section3Items = [
      {
        isActive: true,
        itemName: "Lemon Cheesecake",
        type: "ITEM",
        image: "",

        price: [
          {
            name: "",
            price: 20,
            calories: 100,
          },
        ],
        parentId: savedSections[2]._id,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 1,
      },
      {
        isActive: true,
        itemName: "Cinnamon Cheesecake",
        type: "ITEM",
        image: "",

        price: [
          {
            name: "",
            price: 20,
            calories: 100,
          },
        ],
        parentId: savedSections[2]._id,
        menuId: newMenu._id,
        userId: userId,
        venueId: venue._id,
        position: 2,
      },
    ];

    // Save the menu items
    await MenuItem.insertMany([
      ...section1Items,
      ...section2Items,
      ...section3Items,
    ]);

    // Step 4: Respond with the created menu, sections, and items
    const response = newMenu.toObject();
    response.sections = savedSections.length;
    response.items =
      section1Items.length + section2Items.length + section3Items.length;

    res.status(200).json({ data: response });
  } catch (e) {
    console.log("Error creating menu", e);
    res.status(500).json({ message: "Something went wrong", e });
  }
};

// to add new section in menu
const addMenuSection = async (req, res) => {
  try {
    const userId = req.user?._id;
    const itemImage = req.file;

    const { sectionName, venueId, parentId } = req.body;
    const { menuId } = req.params;
    if (!menuId) {
      return res.status(400).json({ message: "menuId is required" });
    }
    if (!sectionName) {
      return res.status(400).json({ message: "sectionName is required" });
    }
    if (!venueId) {
      return res.status(400).json({ message: "veneu _id is required" });
    }
    // Upload image to Cloudinary if present
    const uploadedImage = itemImage
      ? await uploadOnCloudinary(itemImage.path)
      : null;
    const imageUrl = uploadedImage ? uploadedImage.url : null;

    //  // Build the section item query
    //  const sectionQuery = {
    //   menuId: menuId,
    //   $or: [
    //     { parentId: parentId || null },
    //     { parentId: { $eq: parentId } },
    //   ],
    // };

    // // Fetch sections and items from database
    // const sections = await MenuSection.find(sectionQuery).sort({ position: -1 });
    // const items = await MenuItem.find(sectionQuery).sort({ position: -1 });

    //  // Determine the highest position from both sections and items
    //  const highestSectionPosition = sections.length > 0 ? sections[0].position : 0;
    //  const highestItemPosition = items.length > 0 ? items[0].position : 0;

    //  const highestPosition = Math.max(highestSectionPosition, highestItemPosition);

    //  // Assign a new position (highest + 1)
    //  const newPosition = highestPosition + 1;

    const newSection = new MenuSection({
      venueId: venueId,
      sectionName: sectionName,
      parentId: parentId,
      menuId: menuId,
      userId: userId,
      image: imageUrl,
      // position: newPosition,
    });
    // Save the new section
    await newSection.save();

    return res.status(200).json({ data: newSection });
  } catch (error) {
    console.error("Error adding menu section:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// to update sepecific menue section
const updateMenuSection = async (req, res) => {
  const { sectionName, isActive, parentId } = req.body;
  const { sectionId } = req.params;
  const itemImage = req.file;

  if (!sectionId) {
    return res.status(400).json({ message: "sectionId is required" });
  }

  try {
    const updateData = {};

    if (sectionName) updateData.sectionName = sectionName;
    if (isActive) updateData.isActive = isActive;
    if (parentId) updateData.parentId = parentId;

    let imageUrl;
    if (itemImage) {
      // Upload image to Cloudinary if present
      imageUrl = await uploadOnCloudinary(itemImage.path);
    }

    if (imageUrl) updateData.image = imageUrl.url;

    // find the menu id and replace with new data
    const updatedSection = await MenuSection.findOneAndUpdate(
      { _id: sectionId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedSection) {
      return res.status(404).json({ message: "Section not found" });
    }

    return res.status(200).json({ data: updatedSection });
  } catch (error) {
    console.error("Error updating section:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// to add new item in menu
const addMenuItem = async (req, res) => {
  try {
    const userId = req.user?._id;

    const {
      itemName,
      venueId,
      parentId,
      price,
      description,
      modifiers,
      labels,
      isSold,
    } = req.body;
    const { menuId } = req.params;

    const parsedPrice = typeof price === "string" ? JSON.parse(price) : price;
    const parsedModifiers =
      typeof price === "string" ? JSON.parse(modifiers) : modifiers;
    const parsedLabels =
      typeof labels === "string" ? JSON.parse(labels) : labels;

    const itemImage = req.file;

    console.log(itemImage);

    if (!menuId) {
      return res.status(400).json({ message: "menuId is required" });
    }
    if (!itemName) {
      return res.status(400).json({ message: "itemName is required" });
    }
    if (!venueId) {
      return res.status(400).json({ message: "veneu _id is required" });
    }

    if (
      !parsedPrice ||
      !Array.isArray(parsedPrice) ||
      parsedPrice.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Price should be a non-empty array." });
    }

    // Upload image to Cloudinary if present
    const uploadedImage = itemImage
      ? await uploadOnCloudinary(itemImage.path)
      : null;
    const imageUrl = uploadedImage ? uploadedImage.url : null;

    const validatedLabels = Array.isArray(parsedLabels) ? parsedLabels : [];

    const newItem = new MenuItem({
      venueId: venueId,
      itemName: itemName,
      parentId: parentId,
      menuId: menuId,
      userId: userId,
      price: parsedPrice,
      image: imageUrl,
      description,
      modifiers: parsedModifiers,
      labels: validatedLabels,
      isSold,
    });
    // Save the new section
    await newItem.save();

    return res.status(200).json({ data: newItem });
  } catch (error) {
    console.error("Error adding menu item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// update menu item data
const updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    const {
      itemName,
      parentId,
      price,
      description,
      modifiers,
      labels,
      isSold,
      isActive,
    } = req.body;

    const parsedPrice = typeof price === "string" ? JSON.parse(price) : price;
    const parsedModifiers =
      typeof modifiers === "string" ? JSON.parse(modifiers) : modifiers;
    const parsedLabels =
      typeof labels === "string" ? JSON.parse(labels) : labels;

    const itemImage = req.file;

    // Ensure `labels` is an array (default to empty array if undefined)
    const validatedLabels = Array.isArray(parsedLabels) ? parsedLabels : [];

    // Upload image to Cloudinary if present
    let imageUrl = null;
    if (itemImage) {
      const uploadedImage = await uploadOnCloudinary(itemImage.path);
      imageUrl = uploadedImage.url;
    }

    // Fetch the existing menu item
    const existingItem = await MenuItem.findById(itemId);
    if (!existingItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Update fields if they are provided
    if (itemName) existingItem.itemName = itemName;
    if (parentId !== undefined) existingItem.parentId = parentId;
    if (parsedPrice) existingItem.price = parsedPrice;
    if (description) existingItem.description = description;
    if (parsedModifiers) existingItem.modifiers = parsedModifiers;
    if (validatedLabels) existingItem.labels = validatedLabels;
    if (isSold !== undefined) existingItem.isSold = isSold;
    if (imageUrl) existingItem.image = imageUrl;
    if (isActive) existingItem.isActive = isActive;

    // Save updated item
    await existingItem.save();

    return res.status(200).json({ data: existingItem });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//get  menues for qr client menu
const getMenuData = async (req, res) => {
  const { venueId, menuId } = req.params;

  if (!venueId) {
    return res.status(400).json({ message: "venueId is required" });
  }
  if (!menuId) {
    return res.status(400).json({ message: "menuId is required" });
  }
  try {
    // Find the venue by venueId
    const venue = await Venue.findOne({ venueId });

    if (!venue) {
      return res
        .status(400)
        .json({ message: "Menu not found related to this venue" });
    }

    const menuObjectId = new mongoose.Types.ObjectId(menuId);

    // Find all menus for the given venueId
    const menu = await Menu.findOne({
      venueId: venue._id,
      _id: menuObjectId,
      isActive: true,
    });
    if (!menu) {
      return res
        .status(404)
        .json({ message: "No menu found for this venue menu" });
    }

    return res.status(200).json({ data: menu || {} });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// get all menu items with sections and children for qr side
const getMenuItemsWithSectionsForQr = async (req, res) => {
  const { menuId } = req.params;

  if (!menuId) {
    return res.status(400).json({ error: "menuId is required" });
  }

  try {
    const objectId = new mongoose.Types.ObjectId(menuId);

    // Check if the menu is active
    const menu = await Menu.findOne({ _id: objectId, isActive: true });
    if (!menu) {
      return res.status(404).json({ error: "Menu not found or inactive" });
    }

    // Fetch MenuSections where parentId is null (Top-level sections)
    const sections = await MenuSection.find({
      menuId: objectId,
      parentId: null,
      isActive: true,
    });

    // Fetch MenuItems where parentId is null (Top-level items)
    const items = await MenuItem.find({
      menuId: objectId,
      parentId: null,
      isActive: true,
    });

    // Fetch sub-sections and items for each top-level section
    const sectionsWithChildren = await Promise.all(
      sections.map(async (section) => {
        const sectionItems = await MenuItem.find({
          menuId: objectId,
          parentId: section._id,
          isActive: true,
        });

        const subSections = await fetchSubSectionsForQr(section._id, objectId); // Recursively get sub-sections

        return {
          ...section.toObject(),
          items: sectionItems,
          subSections: subSections, // Add nested sub-sections
        };
      })
    );

    // Combine top-level sections, items, and nested sections
    const combined = [
      ...sectionsWithChildren,
      ...items, // Include top-level items
    ];

    res.status(200).json(combined); // Return the combined data
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to fetch sub-sections and sub-items recursively for Qr
const fetchSubSectionsForQr = async (parentSectionId, menuId) => {
  // Fetch sub-sections under a section
  const subSections = await MenuSection.find({
    menuId: menuId,
    parentId: parentSectionId,
    isActive: true,
  });

  // For each sub-section, fetch the items under that sub-section
  const subSectionsWithItems = await Promise.all(
    subSections.map(async (subSection) => {
      const subItems = await MenuItem.find({
        menuId: menuId,
        parentId: subSection._id,
        isActive: true,
      });

      // Recursively fetch sub-sections for this sub-section
      const nestedSubSections = await fetchSubSectionsForQr(
        subSection._id,
        menuId
      );

      return {
        ...subSection.toObject(),
        items: subItems,
        subSections: nestedSubSections, // Nested sub-sections
      };
    })
  );

  return subSectionsWithItems;
};

// to delete menu section
const deleteMenuSection = async (req, res) => {
  const { sectionId, menuId } = req.params;

  try {
    if (!sectionId || !menuId) {
      return res.status(400).json({
        success: false,
        message: "Both sectionId and menuId must be provided",
      });
    }

    // Find the section by `sectionId` and `menuId` and delete it
    const deletedSection = await MenuSection.findOneAndDelete({
      _id: sectionId,
      menuId,
    });

    if (!deletedSection) {
      return res.status(404).json({
        success: false,
        message: "Menu section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu section deleted successfully",
      data: deletedSection, // Optional: return the deleted document
    });
  } catch (error) {
    console.error("Error deleting menu section:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// to delete menu item
const deleteMenuItem = async (req, res) => {
  const { itemId, menuId } = req.params;

  try {
    if (!itemId || !menuId) {
      return res.status(400).json({
        success: false,
        message: "Both itemId and menuId must be provided",
      });
    }

    // Find the section by `itemId` and `menuId` and delete it
    const deletedItem = await MenuItem.findOneAndDelete({
      _id: itemId,
      menuId,
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Menu Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu Item deleted successfully",
      data: deletedItem, // Optional: return the deleted document
    });
  } catch (error) {
    console.error("Error deleting menu Item:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// to delete a menu
const deleteMenu = async (req, res) => {
  const { menuId } = req.params;

  try {
    if (!menuId) {
      return res.status(400).json({
        success: false,
        message: "menuId must be provided",
      });
    }

    // Find the menu by `menuId` and delete it
    const deletedMenu = await Menu.findByIdAndDelete(menuId);

    if (!deletedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu deleted successfully",
      data: deletedMenu,
    });
  } catch (error) {
    console.error("Error deleting menu:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  getAllMenues,
  updateMenu,
  deleteMenu,
  getMenuItemsWithSections,
  createMenuWitoutItems,
  createMenuWithItemsSections,
  getMenuData,
  getMenuItemsWithSectionsForQr,
  addMenuSection,
  addMenuItem,
  updateMenuSection,
  updateMenuItem,
  deleteMenuSection,
  deleteMenuItem,
};
