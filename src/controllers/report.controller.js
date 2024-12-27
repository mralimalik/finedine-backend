import mongoose from "mongoose";
import { Order } from "../models/order.model.js";

const parseDate = (dateString) =>
  new Date(dateString.split("-").reverse().join("-"));

const calculateItemRevenue = (item, tax, serviceCharge, discount) => {
  const itemModifiersTotal = item.modifiers.reduce(
    (modSum, mod) => modSum + mod.modifierPrice * mod.quantity,
    0
  );

  // Calculate the item total before applying tax, service charge, and discount
  const itemTotalBeforeTaxAndDiscount =
    (item.itemPrice + itemModifiersTotal) * item.quantity;

  // Calculate the total revenue, ensuring it doesn't go negative
  const totalRevenue =
    itemTotalBeforeTaxAndDiscount - discount + serviceCharge + tax;

  // Ensure that the revenue is not negative
  return totalRevenue < 0 ? 0 : totalRevenue;
};

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

const getItemShares = (itemRevenue, totalRevenue) => {
  return Object.keys(itemRevenue).map((itemId) => {
    const item = itemRevenue[itemId];
    const revenueShare = (item.revenue / totalRevenue) * 100;
    return {
      itemName: item.itemName,
      revenue: item.revenue.toFixed(2),
      revenueShare: revenueShare.toFixed(2),
    };
  });
};

const getSectionShares = (sectionRevenue, totalRevenue) => {
  return Object.keys(sectionRevenue).map((sectionId) => {
    const section = sectionRevenue[sectionId];
    const revenueShare = (section.revenue / totalRevenue) * 100;
    return {
      sectionName: section.sectionName,
      revenue: section.revenue.toFixed(2),
      revenueShare: revenueShare.toFixed(2),
    };
  });
};

export const getVenueReport = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { startDate, endDate } = req.query;

    if (!venueId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Venue ID, Start Date, and End Date are required." });
    }

    // Parse dates
    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Fetch orders and populate sectionName, excluding CANCELLED orders
    const orders = await Order.find({
      venueId: new mongoose.Types.ObjectId(venueId),
      createdAt: { $gte: parsedStartDate, $lte: parsedEndDate },
      status: { $ne: "CANCELLED" },
    }).populate({
      path: "orderSummary.sectionId",
      select: "sectionName",
    });

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
      const { tax, serviceCharge, discount } = order.appliedCharges;
      if (order.orderSummary && order.orderSummary.length > 0) {
        order.orderSummary.forEach((item) => {
          // calculate the total revenue
          const itemTotal = calculateItemRevenue(item,tax,serviceCharge,discount);

          totalRevenue += itemTotal;

          // Group by itemId for share revenue
          const itemKey = item.itemId || "others";
          if (!itemRevenue[itemKey]) {
            itemRevenue[itemKey] = {
              itemName: item.itemName || "Others",
              revenue: 0,
            };
          }
          itemRevenue[itemKey].revenue += itemTotal;

          // Group by sectionId for share revenue
          const sectionKey = item.sectionId?._id || "others";
          if (!sectionRevenue[sectionKey]) {
            sectionRevenue[sectionKey] = {
              sectionName: item.sectionId?.sectionName || "Others",
              revenue: 0,
            };
          }
          sectionRevenue[sectionKey].revenue += itemTotal;
        });
      }
    });

    // Get item shares
    const itemShares = getItemShares(itemRevenue, totalRevenue);

    // Get section shares
    const sectionShares = getSectionShares(sectionRevenue, totalRevenue);

    // Calculate average order size
    const averageOrderSize = totalRevenue / orders.length;

    // Find the best day
    const bestDay = getBestDay(orders);

    res.json({
      totalOrders: orders.length,
      revenue: totalRevenue.toFixed(2),
      bestDay,
      avgOrderSize: averageOrderSize.toFixed(2),
      itemShares,
      sectionShares,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
