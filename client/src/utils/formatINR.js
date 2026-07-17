/**
 * Format a number as Indian Rupees (INR) with the rupee symbol and Indian number grouping.
 * @param {number|string} amount - The monetary value to format
 * @returns {string} - Formatted string e.g. ₹1,25,000
 */
export const formatINR = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return "₹" + num.toLocaleString("en-IN");
};

export default formatINR;

