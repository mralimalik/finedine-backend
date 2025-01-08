import { Order } from "../models/order.model.js";

// WhatsApp API configuration
const WHATSAPP_API_URL = "https://graph.facebook.com/v17.0/526609553867688/messages";
const ACCESS_TOKEN = "EAAP6Y7PdWxsBO1SteLtQBWfA7SdBMBg9B7LYql0pSnISCO7WuwHQVGWIjzBJu16cXZCDv5pcegjaGjgWVsMSlL5TzjdINiLv3qBthv8s42ewTuaaFMgxzF6eCOgP1pV4XpsMqlZCHIIi4UbyJJa2Y9ZB2AUXWWpJvo9Qr8TGLjEiWijHxsrbfdoE05lDCets3w4913L9lTuxsT8ZCEnEPRt36Ll7vqoUZAdVMB1Ocbw6ZA";

// Serverless function
export default async function handler(req, res) {
  if (req.method === "POST") {
    await connectDB();
    const message = req.body.entry[0].changes[0].value.messages[0];
    const from = message.from; // Customer's phone number
    const text = message.text.body.toLowerCase(); // Incoming message

    if (text === "order") {
      await sendMessage(from, "Please provide your order number.");
    } else if (!isNaN(text)) {
      const order = await Order.findOne({ orderId: text });
      if (order) {
        const orderDetails = `
          Order Number: ${order.orderId}
          Status: ${order.status}
          Items: ${order.items.join(", ")}
        `;
        await sendMessage(from, `Here are your order details:\n${orderDetails}`);
      } else {
        await sendMessage(from, "Sorry, we couldn't find your order. Please check your order number.");
      }
    } else {
      await sendMessage(from, "Sorry, I didn't understand that. Please send 'Order' to check your order status.");
    }
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

async function sendMessage(to, message) {
  try {
    await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        }
      }
    );
  } catch (error) {
    console.error("Error sending message:", error.response.data);
  }
}
