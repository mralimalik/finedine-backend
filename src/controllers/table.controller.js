import { Area } from "../models/area.model.js";
import { AreaTable } from "../models/area.table.js";
import { Venue } from "../models/venue.model.js";
const createArea = async (req, res) => {
  try {
    const { areaName, venueId, tableIds } = req.body;
    const userId = req.user?._id;

    // Validate required fields
    if (!areaName) {
      return res.status(400).json({ error: "areaName is required" });
    }
    if (!venueId) {
      return res.status(400).json({ error: "venueId _id is required" });
    }

    // Create a new area
    const newArea = new Area({ areaName, venueId, userId });
    await newArea.save();

    // Update tables area id with new area id if tableIds are provided
    if (Array.isArray(tableIds) && tableIds.length > 0) {
      await Promise.all(
        tableIds.map(async (id) => {
          const tableData = await AreaTable.findById(id);
          if (tableData) {
            tableData.areaId = newArea._id;
            await tableData.save();
          }
        })
      );
    }

    // Fetch all tables associated with the new area
    const tables = await AreaTable.find({ areaId: newArea._id });

    // Add the tables to the area object
    const areaWithTables = { ...newArea.toObject(), tables };

    // Send response with area including its tables
    res.status(200).json({ data: areaWithTables });
  } catch (e) {
    console.error("Error creating area", e);
    res.status(500).json({ message: "Something went wrong", error: e.message });
  }
};

// const createCustomTables = async (req, res) => {
//   try {
//     const { tableName, venueId, areaId, onlineTableReservation, minSeats, maxSeats } = req.body;
//     const userId = req.user?._id;

//     if (!tableName) {
//       return res.status(400).json({ error: "tableName is required" });
//     }
//     if (!venueId) {
//       return res.status(400).json({ error: "venueId _id is required" });
//     }
//     if (!areaId) {
//       return res.status(400).json({ error: "areaId is required" });
//     }

//     // Create a new area table
//     const newAreaTable = new AreaTable({
//       tableName,
//       venueId,
//       areaId,
//       userId,
//       minSeats,
//       maxSeats,
//       onlineTableReservation,
//     });
//     await newAreaTable.save();

//     res.status(200).json({ data: newAreaTable});
//   } catch (e) {
//     console.error("Error creating area", e);
//     res.status(500).json({ message: "Something went wrong", error: e.message });
//   }
// };
const createCustomTables = async (req, res) => {
  try {
    const { tables } = req.body; // Expecting an array of table data
    const userId = req.user?._id;

    if (!Array.isArray(tables) || tables.length === 0) {
      return res.status(400).json({ error: "Tables data is required and should be an array" });
    }

    const errors = [];
    const createdTables = [];

    for (const table of tables) {
      const { tableName, venueId, areaId, onlineTableReservation, minSeats, maxSeats } = table;

      if (!tableName || !venueId || !areaId) {
        errors.push({ tableName, error: "Missing required fields: tableName, venueId, or areaId" });
        continue;
      }

      // Create and save the table
      const newAreaTable = new AreaTable({
        tableName,
        venueId,
        areaId,
        userId,
        minSeats,
        maxSeats,
        onlineTableReservation,
      });

      try {
        await newAreaTable.save();
        createdTables.push(newAreaTable);
      } catch (e) {
        errors.push({ tableName, error: e.message });
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({ createdTables, errors }); // Partial success response
    }

    res.status(200).json({ data: createdTables });
  } catch (e) {
    console.error("Error creating area tables:", e);
    res.status(500).json({ message: "Something went wrong", error: e.message });
  }
};

const createAutomaticTables = async (req, res) => {
  try {
    const { tableName, venueId, areaId, onlineTableReservation, minSeats, maxSeats } = req.body;

    const userId = req.user?._id;

    // Defaults to 1 if not provided
    const startingFrom = req.body.startingFrom || 1;
    const numberOfTables = req.body.numberOfTables || 1;

    // Validate required fields
    if (!tableName) {
      return res.status(400).json({ error: "tableName is required" });
    }
    if (!venueId) {
      return res.status(400).json({ error: "venueId _id is required" });
    }
    if (!areaId) {
      return res.status(400).json({ error: "areaId is required" });
    }

    const tablesToInsert = [];

    for (let i = 0; i < numberOfTables; i++) {
      const tableNumber = startingFrom + i;
      const newTableName = `${tableName} ${tableNumber}`;
      tablesToInsert.push({
        tableName: newTableName,
        venueId,
        areaId,
        userId,
        minSeats,
        maxSeats,
        onlineTableReservation,
      });
    }
    const createdTables = await AreaTable.insertMany(tablesToInsert);
    res.status(200).json({ data: createdTables });
  } catch (e) {
    console.error("Error creating automated tables", e);
    res.status(500).json({ message: "Something went wrong", error: e.message });
  }
};

const getAllAreaWithTables = async (req, res) => {
  try {
    const { venueId } = req.params;

    if (!venueId) {
      return res.status(400).json({ error: "venueId is required" });
    }
    const venue = await Venue.findOne({ venueId });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const areas = await Area.find({ venueId: venue._id });

    // If there are no areas, return an empty array
    if (!areas.length) {
      return res.status(200).json({ data: [] });
    }
    // Get tables for each area
    const areasWithTables = await Promise.all(
      areas.map(async (area) => {
        const tables = await AreaTable.find({ areaId: area._id });
        return {
          ...area.toObject(),
          tables, // Attach tables to the area
        };
      })
    );

    console.log(areasWithTables);

    res.status(200).json({ data: areasWithTables });
  } catch (e) {
    console.error("Error getting tables and areas", e);
    res.status(500).json({ message: "Something went wrong", error: e.message });
  }
};

const updateTable = async (req, res) => {
  try {
    const { tableName, areaId, minSeats, maxSeats, onlineTableReservation } = req.body;

    const { tableId } = req.params;
    // Validate the required `tableId`
    if (!tableId) {
      return res.status(400).json({ error: "tableId is required" });
    }

    console.log("UPdating table id ", tableId);

    // Find the table by ID
    const table = await AreaTable.findById(tableId);
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Update only the fields provided in the request
    if (tableName) table.tableName = tableName;
    if (areaId) table.areaId = areaId;
    if (minSeats !== undefined) table.minSeats = minSeats;
    if (maxSeats !== undefined) table.maxSeats = maxSeats;
    if (onlineTableReservation !== undefined) table.onlineTableReservation = onlineTableReservation;

    // Save the updated table
    await table.save();

    res.status(200).json({ data: table });
  } catch (e) {
    console.error("Error updating table", e);
    res.status(500).json({ message: "Something went wrong", error: e.message });
  }
};

const deleteTables = async (req, res) => {
 try{
  const { tableIds } = req.body;
  if (!Array.isArray(tableIds) || tableIds.length === 0) {
    return res.status(400).json({ error: "tableIds is required and should be an array" });
  }
  // Step 2: Convert string tableIds to ObjectId
  const objectIdArray = tableIds.map((id) => mongoose.Types.ObjectId(id));

  // Step 3: Delete the tables using the ObjectId array
  const result = await AreaTable.deleteMany({
    _id: { $in: objectIdArray }, // Match documents where _id is in the objectIdArray
  });

  // Step 4: Check if any tables were deleted
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "No tables found with the provided IDs" });
  }

  // Step 5: Return a success response
  return res.status(200).json({ message: `${result.deletedCount} tables deleted successfully` });
 }catch(e){
    console.error("Error deleting tables", e);
    return res.status(500).json({ message: "Something went wrong", error: e.message });
 }
};


//fetch specific table
const getTable = async (req, res) => {
  try {
    const { venueId, tableId} = req.params;

    if (!venueId) {
      return res.status(400).json({ error: "venueId is required" });
    }
    if (!tableId) {
      return res.status(400).json({ error: "tableId is required" });
    }  
    const table = await AreaTable.findById(tableId);


    res.status(200).json({ data: table });
  } catch (e) {
    console.error("Error getting table ", e);
    res.status(500).json({ message: "Something went wrong", error: e.message });
  }
};



export { createArea, createAutomaticTables, createCustomTables, getAllAreaWithTables, updateTable,deleteTables,getTable };
