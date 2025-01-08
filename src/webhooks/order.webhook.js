import { Order } from "../models/order.model.js";
import axios from "axios";
// WhatsApp API configuration
const WHATSAPP_API_URL =
  "https://graph.facebook.com/v21.0/526609553867688/messages";
const ACCESS_TOKEN =
  "EAAP6Y7PdWxsBOZCtRpheoLQySrUYXS554cZArF9GWp6HP6uHF3v0Ylh6jIteqrgmIX0K1MbRi7tAsGfbjII7gFsW9vN8C7MXhJ1ZAGkOFiZB31LVAD3ZBmO8wtGqDsvfq3e0TRCbddw48d6YoZAypqcEuUVWGgIb0LyrWzBppRSd3ZBdYZBWEgQcluX8FaXH9EpTZB5GcpiMyuSev4SLBjT681Stz31RsAaDP6XkzCMhZBsh8ZD";

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
    try {
      // Log the entire request body for debugging
      console.log("Received Webhook Event:", JSON.stringify(req.body, null, 2));

      // Extract the necessary fields from the incoming payload
      const messageEvent = req.body.entry[0]?.changes[0]?.value;

      if (messageEvent?.messages?.length) {
        const message = messageEvent.messages[0]; // First message in the array
        const from = message.from; // Sender's WhatsApp ID
        const text = message.text?.body?.toLowerCase(); // Text message content

        if (text === "order") {
          // Respond to "Order" command
          await sendMessage(from, "Please provide your order number.");
        } else if (!isNaN(text)) {
          // If the message is a number, treat it as an order number
          const order = await Order.findOne({ orderId: text });
          if (order) {
            const orderDetails = `
                  Order Number: ${order.orderId}
                  Status: ${order.status}
                  Order Type: ${order.orderType}
                `;
            await sendMessage(
              from,
              `Here are your order details:\n${orderDetails}`
            );
          } else {
            await sendMessage(
              from,
              "Sorry, we couldn't find your order. Please check your order number."
            );
          }
        } else {
          // Default response for unrecognized messages
          await sendMessage(
            from,
            "Sorry, I didn't understand that. Please send 'Order' to check your order status."
          );
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error handling webhook event:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
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
        },
      }
    );
  } catch (error) {
    console.error("Error sending message:", error);
  }
}
