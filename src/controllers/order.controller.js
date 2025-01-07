import { OrderSetting } from "../models/order.setting.model.js";
import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import axios from "axios";
import { getPaymentStatus, refundPayment } from "../helper/moyasarpayment.js";
import { calculateOrderRevenue } from "../helper/order_helper.js";

// Fetch order settings by venue ID
const getVenueOrderSettings = async (req, res) => {
  try {
    // Get venueId from request parameters
    const { venueId } = req.params;

    // Validate venueId
    if (!venueId) {
      return res.status(400).json({ message: "Venue _iD is required." });
    }

    // Convert venueId to ObjectId
    const objectId = new mongoose.Types.ObjectId(venueId);

    // Query the database for order settings related to the venueId
    const settings = await OrderSetting.findOne({ venueId: objectId });

    // Return the settings
    return res.status(200).json({ data: settings });
  } catch (error) {
    // Handle any errors
    console.error("Error fetching venue order settings:", error);
    return res.status(500).json({
      message: "An error occurred while fetching order settings.",
      error,
    });
  }
};

// update the order settings
const updateVenueOrderSettings = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { type, updateData } = req.body;

    // Validate venueId
    if (!venueId) {
      return res.status(400).json({ message: "VenueId is required." });
    }

    // Validate type
    const validTypes = ["delivery", "pickup", "dineIn"];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        message: `Invalid or missing type. Valid types are: ${validTypes.join(
          ", "
        )}`,
      });
    }

    // Validate updateData
    if (!updateData || typeof updateData !== "object") {
      return res
        .status(400)
        .json({ message: "Update data is required and must be an object." });
    }

    // Convert venueId to ObjectId
    const objectId = new mongoose.Types.ObjectId(venueId);

    // Find the order settings for the venue
    const settings = await OrderSetting.findOne({ venueId: objectId });

    if (!settings) {
      return res
        .status(404)
        .json({ message: "Order settings not found for the given venueId." });
    }

    // Update the specific type settings dynamically
    settings.settings[type] = { ...settings.settings[type], ...updateData };

    // Save the updates back to the database
    const updatedOrderSetting = await settings.save();

    // Respond with the updated document
    return res.status(200).json({
      message: `${type} settings updated successfully.`,
      data: updatedOrderSetting,
    });
  } catch (error) {
    console.error("Error updating order settings:", error);
    return res.status(500).json({
      message: "An error occurred while updating order settings.",
      error,
    });
  }
};

// // Validate card details
// const validateCardDetails = async (cardDetails) => {
//   try {
//     const response = await axios.post("https://api.moyassar.com/v1/tokens", {
//       card: {
//         number: cardDetails.number,
//         exp_month: cardDetails.exp_month,
//         exp_year: cardDetails.exp_year,
//         cvc: cardDetails.cvc,
//       },
//     }, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.MOYASSAR_SECRET}`,
//       },
//     });

//     if (response.data.id) {
//       return { success: true, token: response.data.id };
//     } else {
//       return { success: false, error: response.data.error };
//     }
//   } catch (error) {
//     console.error("Error validating card details:", error);
//     return { success: false, error: error.message };
//   }
// };

// Handle card payment
// const processCardPaymentOrder = async (totalCartValue, cardDetails) => {
//   try {
//     // // Validate card details and get a token
//     // const validationResponse = await validateCardDetails(cardDetails);
//     // if (!validationResponse.success) {
//     //   return { success: false, error: validationResponse.error };
//     // }
//     const convertedAmount = Math.round(totalCartValue * 100);

//     const apiKey = `${process.env.MOYASSAR_SECRET}:`; // Append a colon for proper encoding

//     const username = apiKey;
//     const password = "";

//     const credentials = `${username}:${password}`;
//     const encodedCredentials = btoa(credentials);

//     // const encodedKey = Buffer.from(apiKey).toString("base64");
//     // Process the payment using the token
//     const response = await axios.post(
//       "https://api.moyasar.com/v1/payments",
//       {
//         amount: convertedAmount,
//         currency: "USD",
//         callback_url: "https://sevun.ai",
//         description: "Payment for order #",

//         source: {
//           type: "card",
//           name: cardDetails.name,
//           number: cardDetails.number.replace(/\s+/g, ""),
//           month: cardDetails.exp_month,
//           year: cardDetails.exp_year,
//           cvc: cardDetails.cvc,
//         },
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Basic ${encodedCredentials}`,
//         },
//       }
//     );

//     // Check if the payment was successful
//     if (response.status === 201) {
//       console.log("Payment Success");

//       return { success: true, paymentId: response.data.id };
//     } else {
//       console.log("Payment", response);

//       return { success: false, error: response.data.error };
//     }
//   } catch (error) {
//     if (error.response) {
//       console.error("API Response Error:", error.response.data);
//     } else {
//       console.error("Request Error:", error.message);
//     }
//     return { success: false, error: error.message };
//   }
// };

// const moyasarApiKey = () => {
//   const apiKey = `${process.env.MOYASSAR_SECRET}`;

//   const username = apiKey;
//   const password = "";

//   const credentials = `${username}:${password}`;
//   return btoa(credentials);
// };
// create order on customer side
const createOrder = async (req, res) => {
  const { venueId } = req.params; // Get venueId from URL parameter
  const {
    menuId,
    orderType,
    orderSummary,
    paymentMethod,
    customerInfo, // customer info for delivery orders
    tableName, // table info for dine-in orders
    appliedCharges,
    // cardDetails,
    // totalCartValue,
    paymentId,
  } = req.body;

  try {
    // Validate payment method
    if (paymentMethod !== "CARD" && paymentMethod !== "CASH") {
      return res
        .status(400)
        .json({ message: "CASH or CARD Payment method is required." });
    }

    // Validate that the orderType is either "DELIVERY" or "DINEIN"
    if (!["DELIVERY", "DINEIN"].includes(orderType)) {
      return res.status(400).json({ message: "Invalid order type" });
    }

    // Validate orderSummary structure
    if (!Array.isArray(orderSummary) || orderSummary.length === 0) {
      return res
        .status(400)
        .json({ message: "Order summary must be a non-empty array" });
    }

    // Validate each item in the order summary
    for (let item of orderSummary) {
      if (!item.itemName || !item.itemPrice || !item.quantity) {
        return res.status(400).json({
          message:
            "Each order summary item must contain itemName, itemPrice, and quantity",
        });
      }

      //   // Validate each modifier
      //   item.modifiers?.forEach((modifier) => {
      //     if (!modifier.modifierName || !modifier.modifierPrice) {
      //       return res.status(400).json({
      //         message:
      //           "Each modifier must contain modifierName and modifierPrice",
      //       });
      //     }
      //   });
    }

    // let paymentId;
    if (paymentMethod === "CARD") {
      // // Process card payment if payment method is CARD
      // const paymentResponse = await processCardPaymentOrder(
      //   totalCartValue,
      //   cardDetails
      // );
      // if (!paymentResponse.success) {
      //   return res
      //     .status(400)
      //     .json({ message: "Payment failed", error: paymentResponse.error });
      // }
      // paymentId = paymentResponse.paymentId;
      if (!paymentId) {
        return res.status(400).json({ message: "Payment Id is required" });
      }
    }

    // Find the last order and increment its orderId
    const lastOrder = await Order.findOne().sort({ orderId: -1 }).limit(1);

    // Set orderId to 1001 if no orders exist, otherwise increment the last orderId by 1
    const orderId = lastOrder ? lastOrder.orderId + 1 : 1001;

    // Create the order document based on the order type
    const newOrder = new Order({
      menuId: menuId,
      venueId: venueId,
      orderType: orderType,
      orderId: orderId,
      orderSummary: orderSummary,
      paymentMethod: paymentMethod,
      paymentId: paymentMethod === "CARD" ? paymentId : "",
      appliedCharges: appliedCharges,
      customerInfo: orderType === "DELIVERY" ? customerInfo : undefined, // Include delivery info only if orderType is DELIVERY
      tableName: orderType === "DINEIN" ? tableName : undefined, // Include dinein info only if orderType is DINEIN
    });

    // Save the new order to the database
    await newOrder.save();

    // Respond with the created order
    return res.status(200).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
//  endpoint to update payment status
const updatePaymentStatus = async (req, res) => {
  const { status } = req.body;
  const { paymentId } = req.params;
  // Validate incoming data
  if (!paymentId || !status) {
    return res.status(400).send("paymentId  and status are required");
  }

  try {
    // Use findOneAndUpdate to update the payment status and return the updated document
    const result = await Order.findOneAndUpdate(
      { paymentId: paymentId },
      { $set: { paymentStatus: status } },
      { new: true } // This will return the updated document
    );

    // If no order was matched, return a 404 error
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Order not found" });
    }

    res
      .status(200)
      .send({ message: "Order status updated successfully", data: result });
  } catch (error) {
    res.status(500).send("Error updating order status: " + error.message);
  }
};

// get order details using orderId or object _id
const getOrderDetails = async (req, res) => {
  const { orderId } = req.params; // Extract orderId from request parameters

  try {
    // Validate the orderId
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }
    // Build the query dynamically based on whether `orderId` is numeric or an ObjectId
    let query = {};
    console.log(orderId);

    if (!isNaN(orderId)) {
      // If orderId is numeric
      query = { orderId: parseInt(orderId) };
    } else if (mongoose.isValidObjectId(orderId)) {
      // If orderId is a valid ObjectId
      query = { _id: orderId };
    } else {
      return res.status(400).json({ message: "Invalid Order ID format." });
    }

    // Query the database for the order
    const order = await Order.findOne(query);

    // Check if the order exists
    if (!order) {
      return res.status(200).json({ message: "Order not found.", data: {} });
    }

    // Return the order details
    return res
      .status(200)
      .json({ message: "Order details fetched successfully.", data: order });
  } catch (error) {
    // Handle any errors
    console.error("Error fetching order details:", error);
    return res.status(500).json({
      message: "An error occurred while fetching order details.",
      error,
    });
  }
};

// get all venue orders for dashboard which are live
// const getLiveOrders = async (req, res) => {
//   try {

//     console.log("Oo334k");

//     const { venueId } = req.params;

//     if (!venueId) {
//       return res.status(400).json({ message: "venueId is required." });
//     }
//     console.log("Ook33");

//     // Fetch live orders
//     const liveOrders = await Order.find({
//       venueId,
//       status: { $nin: ["COMPLETED", "CANCELLED"] },
//     }).sort({ createdAt: -1 }); // Sort by createdAt in descending order

//     console.log("Ook");

//     return res.status(200).json({
//       data:liveOrders || []
//     });
//   } catch (error) {
//     console.error("Error fetching live orders:", error);
//     return res.status(500).json({
//       message: "An error occurred while fetching live orders.",
//       error,
//     });
//   }
// };

// // get orders which are completed
// const getClosedOrders = async (req, res) => {
//   try {
//     console.log("Oo334k");

//     const { venueId } = req.params;

//     if (!venueId) {
//       return res.status(400).json({ message: "venueId is required." });
//     }
//     console.log("Ook33");

//     // Fetch live orders
//     const liveOrders = await Order.find({
//       venueId,
//       status: { $in: ["COMPLETED", "CANCELLED"] },
//     }).sort({ createdAt: -1 }); // Sort by createdAt in descending order

//     console.log("Ook");

//     return res.status(200).json({
//       data: liveOrders || [],
//     });
//   } catch (error) {
//     console.error("Error fetching live orders:", error);
//     return res.status(500).json({
//       message: "An error occurred while fetching live orders.",
//       error,
//     });
//   }
// };

// delete specific order
const deleteOrder = async (req, res) => {
  const { orderId, venueId } = req.params;

  try {
    // Find the order by venueId and orderId
    const order = await Order.findOneAndDelete({
      _id: orderId,
      venueId: venueId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// API endpoint to handle refund request
const refundOrderPayment = async (req, res) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    return res.status(400).json({ message: "Payment ID is required" });
  }

  try {
    const order = await Order.findOne({ paymentId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Step 2: Process the refund via Moyasar
    const refundResponse = await refundPayment(paymentId);
    // Step 3: If refund is successful, update the order status to 'REFUNDED'
    if (refundResponse.status === "refunded") {
      order.status = "REFUNDED";
      await order.save(); // Save the updated order

      // Step 4: Return a successful response with refund details
      res.status(200).json({
        message: "Refund successful and order status updated",
        refundDetails: refundResponse,
      });
    } else {
      res.status(400).json({
        message:
          "Refund failed. The payment provider did not return a refunded status.",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Refund failed",
      error: error.message,
    });
  }
};

// // Function to fetch payment status from Moyasar API
// const getPaymentStatus = async (paymentId) => {
//   try {
//     const response = await axios.get(
//       `https://api.moyasar.com/v1/payments/${paymentId}`,
//       {
//         headers: {
//           Authorization: `Basic ${moyasarApiKey()}`,
//         },
//       }
//     );
//     return response.data.status;
//   } catch (error) {
//     console.error("Error fetching payment status:", error);
//     return "Failed";
//   }
// };

// get all venue orders for dashboard which are live
const getLiveOrders = async (req, res) => {
  try {
    console.log("Oo334k");

    const { venueId } = req.params;

    if (!venueId) {
      return res.status(400).json({ message: "venueId is required." });
    }

    // Get query parameters for pagination and sorting
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 2;
    let skip = (page - 1) * limit;

    // Get sort parameters (default to 'createdAt' and descending order if not provided)
    const sortBy = req.query.sortBy || "createdAt"; // Default sort field
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // Default to descending order

    // Validating sortBy parameter
    const validSortFields = ["orderId", "createdAt", "updatedAt"];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        message:
          "Invalid sort field. Valid options are: orderId, createdAt, updatedAt,",
      });
    }

    // Get the status filter (if provided)
    const statusFilter = req.query.status ? req.query.status.split(",") : null;

    // Build the filter object for status
    const filter = {
      venueId,
      status: { $nin: ["COMPLETED", "CANCELLED", "REFUNDED"] }, // Always exclude "COMPLETED" and "CANCELLED"
    };

    // If statusFilter is provided, add it to the filter
    if (statusFilter && statusFilter.length > 0) {
      filter.status = { $in: statusFilter }; // Find orders where the status is in the provided list
    }

    // Fetch live orders with pagination, sorting, and status filtering
    const liveOrders = await Order.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }); // Dynamic sorting by the selected field and order

    // Fetch total count of live orders (without pagination)
    const totalCount = await Order.countDocuments({
      venueId,
      status: { $nin: ["COMPLETED", "CANCELLED", "REFUNDED"] },
    });
    // Map through the live orders and fetch payment status for each order
    const liveOrdersWithPaymentStatus = await Promise.all(
      liveOrders.map(async (order) => {
        if (order.paymentId && order.paymentMethod === "CARD") {
          const paymentStatus = await getPaymentStatus(order.paymentId);
          return {
            ...order.toObject(),
            paymentStatus, // Add paymentStatus to the order
          };
        }
        return order; // If no paymentId, return the order as is
      })
    );

    console.log("Ook");

    return res.status(200).json({
      data: liveOrdersWithPaymentStatus || [],
      totalData: totalCount, // Total count of live orders
      totalPages: Math.ceil(totalCount / limit), // Calculate total pages
      currentPage: page, // Current page
    });
  } catch (error) {
    console.error("Error fetching live orders:", error);
    return res.status(500).json({
      message: "An error occurred while fetching live orders.",
      error,
    });
  }
};

const getClosedOrders = async (req, res) => {
  try {
    console.log("Oo334k");

    const { venueId } = req.params;

    if (!venueId) {
      return res.status(400).json({ message: "venueId is required." });
    }

    // Get query parameters for pagination and sorting
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    // Get sort parameters (default to 'createdAt' and descending order if not provided)
    const sortBy = req.query.sortBy || "createdAt"; // Default sort field
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // Default to descending order

    // Validating sortBy parameter
    const validSortFields = ["orderId", "createdAt", "updatedAt"];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        message:
          "Invalid sort field. Valid options are: orderId, createdAt, updatedAt,",
      });
    }

    // Get the status filter (if provided)
    const statusFilter = req.query.status ? req.query.status.split(",") : null;

    // Build the filter object for status
    const filter = {
      venueId,
      status: { $in: ["COMPLETED", "CANCELLED", "REFUNDED"] },
    };

    // If statusFilter is provided, add it to the filter,
    if (statusFilter && statusFilter.length > 0) {
      filter.status = { $in: statusFilter }; // Find orders where the status is in the provided list
    }

    // Fetch live orders with pagination, sorting, and status filtering
    const liveOrders = await Order.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }); // Dynamic sorting by the selected field and order

    // Fetch total count of live orders (without pagination)
    const totalCount = await Order.countDocuments({
      venueId,
      status: { $nin: ["COMPLETED", "CANCELLED", "REFUNDED"] },
    });
    // Map through the live orders and fetch payment status for each order
    const ClosedOrdersWithPaymentStatus = await Promise.all(
      liveOrders.map(async (order) => {
        if (order.paymentId && order.paymentMethod === "CARD") {
          const paymentStatus = await getPaymentStatus(order.paymentId);
          return {
            ...order.toObject(),
            paymentStatus, // Add paymentStatus to the order
          };
        }
        return order; // If no paymentId, return the order as is
      })
    );

    console.log("Ook");

    return res.status(200).json({
      data: ClosedOrdersWithPaymentStatus || [],
      totalData: totalCount, // Total count of live orders
      totalPages: Math.ceil(totalCount / limit), // Calculate total pages
      currentPage: page, // Current page
    });
  } catch (error) {
    console.error("Error fetching live orders:", error);
    return res.status(500).json({
      message: "An error occurred while fetching live orders.",
      error,
    });
  }
};

//  endpoint to update order status
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const { orderId } = req.params;
  // Validate incoming data
  if (!orderId || !status) {
    return res.status(400).send("Order ID and status are required");
  }

  // Validate that status is one of the allowed values
  const validStatuses = [
    "WAITING",
    "INKITCHEN",
    "DELIVERY",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).send({ message: "Invalid status value" });
  }

  try {
    // Use updateOne to update only the status field of the order
    const result = await Order.updateOne(
      { _id: orderId },
      { $set: { status } },
      { new: true }
    );

    // If no order was matched, return a 404 error
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Order not found" });
    }

    res
      .status(200)
      .send({ message: "Order status updated successfully", data: result });
  } catch (error) {
    res.status(500).send("Error updating order status: " + error.message);
  }
};

// API to update order summary by deleting an item by _id
const updateOrderSummaryItem = async (req, res) => {
  const { orderId } = req.params;
  const { itemId } = req.body; // Expecting the _id of the item to be deleted in the request body

  try {
    // Find the order by its ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // if (order.paymentMethod === "CARD" && order.paymentStatus === "paid") {
    //   const totalPrice = calculateOrderRevenue(order);
    //   const totalItems = order.orderSummary.length;
    //   const refundAmount = totalPrice / totalItems;
    // }

    // Find the index of the item in the order summary by matching the _id
    const itemIndex = order.orderSummary.findIndex(
      (item) => item._id.toString() === itemId
    );

    // // Extract the item to be refunded
    // const itemToRefund = order.orderSummary[itemIndex];
    // const itemBasePrice = parseFloat(itemToRefund.itemPrice);
    // const itemQuantity = parseInt(itemToRefund.quantity);

    // // Calculate total price of the item, including modifiers
    // const modifiersPrice = itemToRefund.modifiers.reduce(
    //   (total, modifier) =>
    //     total +
    //     parseFloat(modifier.modifierPrice) * parseInt(modifier.quantity),
    //   0
    // );
    // const itemTotalPrice = (itemBasePrice + modifiersPrice) * itemQuantity;

    // // Calculate the refund amount proportionally with applied charges
    // const orderTotal = order.orderSummary.reduce((total, item) => {
    //   const itemModifiersPrice = item.modifiers.reduce(
    //     (modTotal, mod) =>
    //       modTotal + parseFloat(mod.modifierPrice) * parseInt(mod.quantity),
    //     0
    //   );
    //   return (
    //     total +
    //     (parseFloat(item.itemPrice) + itemModifiersPrice) *
    //       parseInt(item.quantity)
    //   );
    // }, 0);

    // const appliedCharges = order.appliedCharges;
    // const proportionalTax =
    //   (itemTotalPrice / orderTotal) * (appliedCharges.tax || 0);
    // const proportionalServiceCharge =
    //   (itemTotalPrice / orderTotal) * (appliedCharges.serviceCharge || 0);
    // const proportionalDiscount =
    //   (itemTotalPrice / orderTotal) * (appliedCharges.discount || 0);

    // const refundAmount =
    //   itemTotalPrice +
    //   proportionalTax +
    //   proportionalServiceCharge -
    //   proportionalDiscount;

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ message: "Item not found in order summary" });
    }

    // Remove the item from the orderSummary
    order.orderSummary.splice(itemIndex, 1);

    // Save the updated order
    await order.save();

    // Send the updated order back as a response
    return res
      .status(200)
      .json({ message: "Item removed from order summary", order });
  } catch (error) {
    console.error("Error updating order summary:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export {
  getVenueOrderSettings,
  updateVenueOrderSettings,
  createOrder,
  getOrderDetails,
  getLiveOrders,
  getClosedOrders,
  deleteOrder,
  updateOrderStatus,
  updateOrderSummaryItem,
  // processCardPaymentOrder,
  updatePaymentStatus,
  refundOrderPayment,
};
