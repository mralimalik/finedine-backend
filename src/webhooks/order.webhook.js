import { Order } from "../models/order.model.js";
import axios from "axios";
// WhatsApp API configuration
const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0/526609553867688/messages";
const ACCESS_TOKEN = "EAAP6Y7PdWxsBOZCtRpheoLQySrUYXS554cZArF9GWp6HP6uHF3v0Ylh6jIteqrgmIX0K1MbRi7tAsGfbjII7gFsW9vN8C7MXhJ1ZAGkOFiZB31LVAD3ZBmO8wtGqDsvfq3e0TRCbddw48d6YoZAypqcEuUVWGgIb0LyrWzBppRSd3ZBdYZBWEgQcluX8FaXH9EpTZB5GcpiMyuSev4SLBjT681Stz31RsAaDP6XkzCMhZBsh8ZD";

// Serverless function
export default async function handler(req, res) {


    const VERIFY_TOKEN = "secrettoken";

    if (req.method === "GET") {
      // Handle webhook verification
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];
  
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified successfully.");
        return res.status(200).send(challenge); // Respond with the challenge token
      } else {
        console.log("Verification failed.");
        return res.status(403).send("Verification failed.");
      }
    }
  

  if (req.method === "POST") {
    console.log(req.body);
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
    console.error("Error sending message:", error);
  }
}
