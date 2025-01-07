import axios from "axios";

const moyasarApiKey = () => {
  const apiKey = `${process.env.MOYASSAR_SECRET}`;

  const username = apiKey;
  const password = "";

  const credentials = `${username}:${password}`;
  return btoa(credentials);
};

// Function to fetch payment status from Moyasar API
export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await axios.get(
      `https://api.moyasar.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${moyasarApiKey()}`,
        },
      }
    );
    return response.data.status;
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return "Failed";
  }
};

// Function to refund the payment
export const refundPayment = async (paymentId, amount) => {
  try {
    const data = amount ? { amount } : {};

    // Sending a POST request to the Moyasar refund endpoint
    const response = await axios.post(
      `https://api.moyasar.com/v1/payments/${paymentId}/refund`,
      data,
      {
        headers: {
          Authorization: `Basic ${moyasarApiKey()}`,
        },
      }
    );

    return response.data; // Return the response from Moyasar API
  } catch (error) {
    console.error("Refund API Error:", error);
    throw new Error("Refund failed. Please try again.");
  }
};
