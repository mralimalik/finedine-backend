import mongoose from "mongoose";
import { Order } from "../models/order.model.js";

const parseDate = (dateString) =>
  new Date(dateString.split("-").reverse().join("-"));

// calculate revenue of individaul order
const calculateOrderRevenue = (order) => {
  const { tax, serviceCharge, discount } = order.appliedCharges;

  // Calculate the total of all items in the order
  const itemsTotal = order.orderSummary.reduce((total, item) => {
    // calculate the total of all modifiers for the item
    const itemModifiersTotal = item.modifiers.reduce(
      (modSum, mod) => modSum + mod.modifierPrice * mod.quantity,
      0
    );

    const itemTotal = (item.itemPrice + itemModifiersTotal) * item.quantity;
    return total + itemTotal;
  }, 0);

  // Subtract the discount from the items total
  const totalAfterDiscount = itemsTotal - discount;

  // Calculate the total revenue by adding service charge and tax
  const totalRevenue = totalAfterDiscount + serviceCharge + tax;

  // Ensure that the revenue is not negative
  return totalRevenue < 0 ? 0 : totalRevenue;
};

// get the best day in which we got most orders
const getBestDay = (orders) => {
  const ordersByDay = orders.reduce((acc, order) => {
    const day = new Date(order.createdAt).toISOString().split("T")[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(ordersByDay).reduce((best, current) =>
    ordersByDay[current] > ordersByDay[best] ? current : best
  );
};

const calculateItemRevenue = (item, itemRevenue) => {
  const itemKey = item.itemId || "others";
  if (!itemRevenue[itemKey]) {
    itemRevenue[itemKey] = {
      itemName: item.itemName || "Others",
      revenue: 0,
    };
  }
  // calculate the revenue of the item and add in the itemRevenue object
  itemRevenue[itemKey].revenue +=
    (item.itemPrice +
      item.modifiers.reduce(
        (modSum, mod) => modSum + mod.modifierPrice * mod.quantity,
        0
      )) *
    item.quantity;
};

const calculateSectionRevenue = (item, sectionRevenue) => {
  const sectionKey = item.sectionId?._id || "others";
  if (!sectionRevenue[sectionKey]) {
    sectionRevenue[sectionKey] = {
      sectionName: item.sectionId?.sectionName || "Others",
      revenue: 0,
    };
  }
  // calculate the revenue of the section and add in the sectionRevenue object
  sectionRevenue[sectionKey].revenue +=
    (item.itemPrice +
      item.modifiers.reduce(
        (modSum, mod) => modSum + mod.modifierPrice * mod.quantity,
        0
      )) *
    item.quantity;
};

// calculate the total revenue of all items
const getItemShares = (itemRevenue) => {
  // first we calculate the total revenue of all items
  const totalItemRevenue = Object.values(itemRevenue).reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  // then return the revenue of each item and its share of the total revenue
  return Object.keys(itemRevenue).map((itemId) => {
    const item = itemRevenue[itemId];
    const normalizedRevenueShare = (item.revenue / totalItemRevenue) * 100;
    return {
      itemName: item.itemName,
      revenue: item.revenue.toFixed(2),
      revenueShare: normalizedRevenueShare.toFixed(2),
    };
  });
};

// calculate the total revenue of all sections
const getSectionShares = (sectionRevenue) => {
  // first we calculate the total revenue of all sections
  const totalSectionRevenue = Object.values(sectionRevenue).reduce(
    (sum, section) => sum + section.revenue,
    0
  );
  // then return the revenue of each section and its share of the total section revenue
  return Object.keys(sectionRevenue).map((sectionId) => {
    const section = sectionRevenue[sectionId];
    const normalizedRevenueShare =
      (section.revenue / totalSectionRevenue) * 100;
    return {
      sectionName: section.sectionName,
      revenue: section.revenue.toFixed(2),
      revenueShare: normalizedRevenueShare.toFixed(2),
    };
  });
};

export const getVenueReport = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!venueId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Venue ID, Start Date, and End Date are required." });
    }

    // Parse dates
    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    // Validate date formats
    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Fetch orders and populate sectionName, excluding CANCELLED orders
    const orders = await Order.find({
      venueId: new mongoose.Types.ObjectId(venueId),
      createdAt: { $gte: parsedStartDate, $lte: parsedEndDate },
      status: { $nin: ["CANCELLED", "REFUNDED"] }, // Exclude CANCELLED and REFUNDED orders
    }).populate({
      path: "orderSummary.sectionId",
      select: "sectionName",
    });

    // Check if orders exist
    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for the specified date range." });
    }

    // Initialize variables
    let totalRevenue = 0;
    const itemRevenue = {};
    const sectionRevenue = {};

    // Process orders revenue
    orders.forEach((order) => {
      const orderTotal = calculateOrderRevenue(order);
      totalRevenue += orderTotal;

      if (order.orderSummary && order.orderSummary.length > 0) {
        order.orderSummary.forEach((item) => {
          // Calculate item revenue
          calculateItemRevenue(item, itemRevenue);
          // Calculate section revenue
          calculateSectionRevenue(item, sectionRevenue);
        });
      }
    });

    // Get item shares
    const itemShares = getItemShares(itemRevenue);

    // Get section shares
    const sectionShares = getSectionShares(sectionRevenue);

    // Calculate average order size
    const averageOrderSize = totalRevenue / orders.length;

    // Find the best day
    const bestDay = getBestDay(orders);

    // Send response
    res.json({
      totalOrders: orders.length,
      revenue: totalRevenue.toFixed(2),
      bestDay,
      avgOrderSize: averageOrderSize.toFixed(2),
      itemShares,
      sectionShares,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: error.message });
  }
};
