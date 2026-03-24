import express from "express";
import asyncHandler from "express-async-handler";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Order } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { protect } from "../middleware/authMiddleware.js";
import { sendOrderConfirmationEmail } from "../utils/emailService.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import { notifyAdminOnStockChange, reserveStockForItems } from "../utils/stockService.js";

const router = express.Router();

// POST /api/payment/create-order
router.post(
  "/create-order",
  protect,
  asyncHandler(async (req, res) => {
    const { amount } = req.body;
    
    if (!amount) {
      res.status(400);
      throw new Error("Amount is required");
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // Check if Razorpay is configured
    if (!key_id || !key_secret || key_id === "rzp_test_xxxxxx") {
      // Return mock order for testing
      return res.json({
        id: `order_mock_${Date.now()}`,
        amount: amount * 100,
        currency: "INR",
        isMock: true
      });
    }

    try {
      const instance = new Razorpay({ 
        key_id: key_id, 
        key_secret: key_secret 
      });

      const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: req.user._id.toString()
        }
      };

      const order = await instance.orders.create(options);
      
      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        isMock: false
      });
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      res.status(500);
      throw new Error("Failed to create payment order");
    }
  })
);

// POST /api/payment/verify
router.post(
  "/verify",
  protect,
  asyncHandler(async (req, res) => {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      shippingAddress,
      items,
      itemsPrice,
      shippingPrice,
      totalAmount
    } = req.body;

    // Verify signature for real payments
    if (!razorpaySignature || razorpaySignature !== "mock_signature") {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!secret) {
        res.status(400);
        throw new Error("Payment verification failed: Missing secret");
      }

      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const digest = shasum.digest("hex");

      if (digest !== razorpaySignature) {
        res.status(400);
        throw new Error("Payment verification failed: Invalid signature");
      }
    }

    // Check if order already exists (prevent duplicates)
    const existingOrder = await Order.findOne({ paymentId: razorpayPaymentId });
    if (existingOrder) {
      return res.json({
        success: true,
        orderId: existingOrder._id,
        message: "Order already processed"
      });
    }

    let updatedProducts;
    try {
      updatedProducts = await reserveStockForItems(items);
    } catch (err) {
      res.status(err.statusCode || 400);
      throw err;
    }

    // Create Order in DB
    const order = await Order.create({
      userId: req.user._id,
      products: items,
      shippingAddress,
      paymentMethod: "Razorpay",
      paymentId: razorpayPaymentId || `manual_${Date.now()}`,
      itemsPrice,
      shippingPrice,
      totalAmount,
      status: "Placed",
      orderDate: new Date()
    });

    notifyAdminOnStockChange(updatedProducts).catch((err) =>
      console.error("Failed to notify admin for stock change:", err)
    );

    // Clear user cart
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    } catch (cartError) {
      console.error("Failed to clear cart:", cartError);
      // Don't fail the order if cart clearing fails
    }

    // Send order confirmation email (don't await)
    sendOrderConfirmationEmail(req.user.email, order).catch(err => 
      console.error("Failed to send confirmation email:", err)
    );

    // Generate invoice PDF
    let invoiceBase64 = null;
    try {
      const user = req.user;
      const pdfBuffer = await generateInvoicePDF(order, user);
      invoiceBase64 = pdfBuffer.toString('base64');
    } catch (invoiceError) {
      console.error("Failed to generate invoice:", invoiceError);
      // Continue without invoice in response
    }

    res.status(201).json({
      success: true,
      orderId: order._id,
      paymentId: razorpayPaymentId,
      invoice: invoiceBase64,
      message: "Order placed successfully"
    });
  })
);

// GET /api/payment/invoice/:orderId - Download invoice
router.get(
  "/invoice/:orderId",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate('userId', 'name email');
    
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Check if user owns this order or is admin
    if (order.userId._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(403);
      throw new Error("Not authorized to view this invoice");
    }

    try {
      const pdfBuffer = await generateInvoicePDF(order, order.userId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Invoice generation failed:", error);
      res.status(500);
      throw new Error("Failed to generate invoice");
    }
  })
);

// POST /api/payment/webhook - Razorpay webhook (optional)
router.post(
  "/webhook",
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (webhookSecret) {
      const shasum = crypto.createHmac("sha256", webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== req.headers['x-razorpay-signature']) {
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    const event = req.body;
    
    // Handle payment events
    if (event.event === 'payment.captured') {
      console.log('Payment captured:', event.payload.payment.entity.id);
      // You can update order status or send notifications here
    }

    res.json({ received: true });
  })
);

export default router;