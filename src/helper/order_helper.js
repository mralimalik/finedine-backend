// calculate revenue of individaul order
export const calculateOrderRevenue = (order) => {
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
