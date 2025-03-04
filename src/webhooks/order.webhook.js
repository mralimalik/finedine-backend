import { Order } from "../models/order.model.js";
import axios from "axios";
// WhatsApp API configuration
const WHATSAPP_API_URL =
  "https://graph.facebook.com/v21.0/526609553867688/messages";
const ACCESS_TOKEN =
  "EAAP6Y7PdWxsBO4HVFb2HXRwLhbvaE965rPCYEN46bYi3iKToCgkopO1Cz3BCH5QxaWicoi1vjgrhMLZB5VBm8ZAKZBtO87yS2ZCGVhrm654n55GQiD0mXCvCI8BG8ZBKuUsHVa21MNyEgXNikJNQ6lnB7IA5MMWo4hZAkuX4ZAw1UcxsO5IAjYkeryibiSlE6yedOzKts6dE8aVapE79xt6M6neIlnSZAmSUr4SCDgoRIjEZD";

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
  await handleOrderMessage(req,res);
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

const handleOrderMessage = async (req,res) => {
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
            const orderDetails = `Order Number: ${order.orderId}\nStatus: ${
              order.status
            }\nOrder Type: ${order.orderType}\nItems:\n${order.orderSummary
              .map((item) => `${item.itemName}`)
              .join("\n")}`;
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
};

const handleBotMessage = async (req,res) => {
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
        // Handle the message and send to bot API
        const botResponse = await handleBotApi(text);
        if (!botResponse) {
          await sendMessage(
            from,
            "Something went wrong. Please try again later."
          );
        } else {
          // Send the bot response back to the user
          await sendMessage(from, botResponse);
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error handling webhook event:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

const handleBotApi = async () => {
  try {
    const response = await axios.post(
      `http://91.134.11.232:8000/chat?query=${encodeURIComponent(message)}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data) {
        return response.data;
      } else {
        return null; 
      }
  } catch (e) {
    console.log("error sending bot message api", e);
    return null;
  }
};
