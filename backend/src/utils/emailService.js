import nodemailer from "nodemailer";

// Create transporter based on environment
const createTransporter = () => {
  // For development/testing with ethereal
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_EMAIL || "test_user",
        pass: process.env.ETHEREAL_PASS || "test_pass",
      },
    });
  }

  // Production email configuration
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendLowStockEmail = async (productName, remainingStock) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Iniya Sri Crackers" <${process.env.EMAIL_FROM || 'admin@iniyasricrackers.com'}>`,
      to: process.env.ADMIN_EMAIL || "admin@crackerstore.local",
      subject: `⚠️ Low Stock Alert: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Low Stock Alert</h2>
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px;">
            <p style="font-size: 16px;"><strong>${productName}</strong> is running low on stock!</p>
            <p style="font-size: 24px; color: #dc2626; font-weight: bold;">Only ${remainingStock} units remaining</p>
            <p>Please restock soon to avoid stockouts.</p>
          </div>
          <hr style="margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated alert from Iniya Sri Crackers inventory system.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Low stock email sent: %s", info.messageId);
    
    // Log ethereal URL for testing
    if (process.env.NODE_ENV === 'development') {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error("Error sending low stock email:", error);
    // Don't throw error to prevent order processing failure
  }
};

export const sendOutOfStockEmail = async (productName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Iniya Sri Crackers" <${process.env.EMAIL_FROM || "admin@iniyasricrackers.com"}>`,
      to: process.env.ADMIN_EMAIL || "admin@crackerstore.local",
      subject: `🚨 Out Of Stock Alert: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #991b1b;">Out Of Stock Alert</h2>
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px;">
            <p style="font-size: 16px;"><strong>${productName}</strong> is now out of stock.</p>
            <p style="font-size: 18px; color: #991b1b; font-weight: bold;">Remaining: 0 units</p>
            <p>Please replenish inventory as soon as possible.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Out-of-stock email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending out-of-stock email:", error);
  }
};

export const sendOrderConfirmationEmail = async (userEmail, order) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Iniya Sri Crackers" <${process.env.EMAIL_FROM || 'orders@iniyasricrackers.com'}>`,
      to: userEmail,
      subject: `🎆 Order Confirmed - #${order._id.toString().slice(-6)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316;">Iniya Sri Crackers</h1>
            <h2 style="color: #4b5563;">Thank You for Your Order!</h2>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 18px; margin: 0 0 10px 0;">
              <strong>Order #${order._id.toString().slice(-6)}</strong>
            </p>
            <p style="color: #6b7280; margin: 0;">
              Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
              Order Summary
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.products.map(item => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.qty}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">₹${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                  <td style="padding: 10px; text-align: right;">₹${order.itemsPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                  <td style="padding: 10px; text-align: right;">${order.shippingPrice === 0 ? 'Free' : '₹' + order.shippingPrice.toFixed(2)}</td>
                </tr>
                <tr style="font-size: 18px;">
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #f97316;">₹${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="color: #374151; margin: 0 0 10px 0;">Shipping Address</h4>
              <p style="margin: 0; color: #4b5563;">
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.phone}<br>
                ${order.shippingAddress.address1}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                ${order.shippingAddress.pincode}
              </p>
            </div>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="color: #374151; margin: 0 0 10px 0;">Payment Details</h4>
              <p style="margin: 0; color: #4b5563;">
                Method: ${order.paymentMethod}<br>
                Status: Paid<br>
                Order Status: <span style="color: #f97316; font-weight: bold;">${order.status}</span>
              </p>
            </div>
          </div>

          <div style="background-color: #f97316; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
            <p style="margin: 0 0 10px 0; font-size: 18px;">Thank you for shopping with us!</p>
            <p style="margin: 0; font-size: 14px;">Your order will be processed and shipped soon.</p>
          </div>

          <hr style="margin: 30px 0 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
          
          <div style="text-align: center; color: #9ca3af; font-size: 12px;">
            <p>Iniya Sri Crackers<br>
            553-1-2 Mettamalai, Sivakasi to Sattur Main Road<br>
            Sivakasi - 626203 | Phone: 9025456695</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent: %s", info.messageId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    // Don't throw error to prevent order processing failure
  }
};

export const sendOrderStatusUpdateEmail = async (userEmail, order) => {
  try {
    const transporter = createTransporter();
    
    const statusColors = {
      'Placed': '#f97316',
      'Packed': '#3b82f6',
      'Shipped': '#8b5cf6',
      'Delivered': '#10b981',
      'Cancelled': '#ef4444'
    };
    
    const mailOptions = {
      from: `"Iniya Sri Crackers" <${process.env.EMAIL_FROM || 'orders@iniyasricrackers.com'}>`,
      to: userEmail,
      subject: `📦 Order Status Update - #${order._id.toString().slice(-6)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #374151;">Order Status Update</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;">Your order <strong>#${order._id.toString().slice(-6)}</strong> status has been updated to:</p>
            <p style="font-size: 24px; color: ${statusColors[order.status] || '#374151'}; font-weight: bold; margin: 10px 0;">
              ${order.status}
            </p>
          </div>
          
          <p style="color: #6b7280;">
            <a href="${process.env.CLIENT_ORIGIN}/orders" style="color: #f97316; text-decoration: none;">
              Click here to view your order details
            </a>
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Status update email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending status update email:", error);
  }
};