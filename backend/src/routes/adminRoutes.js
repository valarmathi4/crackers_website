import express from "express";
import asyncHandler from "express-async-handler";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/admin/orders - list all orders with proper population
router.get(
  "/orders",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .populate({
        path: "userId",
        select: "name email",
        model: User
      })
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    // Format orders to ensure we have user data
    const formattedOrders = orders.map(order => ({
      ...order,
      userId: order.userId || { name: "Guest User", email: "N/A" },
      customerName: order.userId?.name || "Guest User",
      customerEmail: order.userId?.email || "N/A",
      totalAmount: order.totalAmount || 0,
      itemsPrice: order.itemsPrice || 0,
      shippingPrice: order.shippingPrice || 0
    }));

    res.json(formattedOrders);
  })
);

// PUT /api/admin/orders/:id/status - update order status
router.put(
  "/orders/:id/status",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ["Placed", "Packed", "Shipped", "Delivered", "Cancelled"];
    
    if (!allowed.includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }
    
    order.status = status;
    const updated = await order.save();
    
    // Populate user data before sending response
    await updated.populate({
      path: "userId",
      select: "name email"
    });
    
    res.json(updated);
  })
);

// GET /api/admin/dashboard-stats - comprehensive dashboard statistics
router.get(
  "/dashboard-stats",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Basic stats
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Total revenue calculation with error handling
    const revenueResult = await Order.aggregate([
      { $match: { totalAmount: { $exists: true, $ne: null } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Today's stats
    const todayOrders = await Order.countDocuments({ 
      createdAt: { $gte: startOfDay, $lte: endOfDay } 
    });
    
    const todayRevenueResult = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          totalAmount: { $exists: true, $ne: null }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // This week's stats
    const weekOrders = await Order.countDocuments({ 
      createdAt: { $gte: startOfWeek } 
    });
    
    const weekRevenueResult = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfWeek },
          totalAmount: { $exists: true, $ne: null }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // This month's stats
    const monthOrders = await Order.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    
    const monthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfMonth },
          totalAmount: { $exists: true, $ne: null }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // This year's stats
    const yearOrders = await Order.countDocuments({ 
      createdAt: { $gte: startOfYear } 
    });
    
    const yearRevenueResult = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfYear },
          totalAmount: { $exists: true, $ne: null }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      $expr: { $lt: ["$stock", "$lowStockThreshold"] }
    });

    // Top selling products - with null checks
    const topSellingProducts = await Product.find()
      .sort({ soldCount: -1 })
      .limit(5)
      .lean();

    // Category wise sales
    const categorySales = await Order.aggregate([
      { $unwind: "$products" },
      { 
        $group: {
          _id: "$products.category",
          totalSold: { $sum: "$products.qty" },
          revenue: { 
            $sum: { 
              $multiply: [
                { $ifNull: ["$products.price", 0] }, 
                { $ifNull: ["$products.qty", 0] }
              ] 
            } 
          }
        }
      },
      { $sort: { totalSold: -1 } }
    ]);

    // Daily sales for current month
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$totalAmount", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get recent orders with user data
    const recentOrders = await Order.find({})
      .populate({
        path: "userId",
        select: "name email"
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      summary: {
        totalOrders,
        totalUsers,
        totalRevenue,
        today: {
          orders: todayOrders,
          revenue: todayRevenueResult[0]?.total || 0
        },
        week: {
          orders: weekOrders,
          revenue: weekRevenueResult[0]?.total || 0
        },
        month: {
          orders: monthOrders,
          revenue: monthRevenueResult[0]?.total || 0
        },
        year: {
          orders: yearOrders,
          revenue: yearRevenueResult[0]?.total || 0
        }
      },
      lowStock: {
        count: lowStockProducts.length,
        products: lowStockProducts
      },
      topSelling: topSellingProducts,
      categorySales,
      dailySales,
      recentOrders: recentOrders.map(order => ({
        ...order,
        customerName: order.userId?.name || "Guest User",
        customerEmail: order.userId?.email || "N/A"
      }))
    });
  })
);

// GET /api/admin/reports - Download reports with proper data formatting
router.get(
  "/reports",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { startDate, endDate, format } = req.query;
    
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    // Get orders with populated user data
    const orders = await Order.find(filter)
      .populate({
        path: "userId",
        select: "name email"
      })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary with proper number handling
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => {
      const amount = typeof o.totalAmount === 'number' ? o.totalAmount : 0;
      return sum + amount;
    }, 0);
    
    const productsSold = orders.reduce((sum, o) => {
      return sum + (o.products || []).reduce((acc, p) => {
        const qty = typeof p.qty === 'number' ? p.qty : 0;
        return acc + qty;
      }, 0);
    }, 0);

    const uniqueCustomers = new Set(
      orders.map(o => o.userId?._id?.toString()).filter(id => id)
    ).size;

    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=sales_report_${Date.now()}.pdf`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold')
        .text("INIYA SRI CRACKERS", { align: "center" })
        .moveDown();
      
      doc.fontSize(16).font('Helvetica-Bold')
        .text("Sales Report", { align: "center" })
        .moveDown();
      
      if (startDate && endDate) {
        doc.fontSize(12).font('Helvetica')
          .text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, { align: "center" })
          .moveDown();
      }
      
      // Summary section
      doc.fontSize(14).font('Helvetica-Bold')
        .text("Summary", { underline: true })
        .moveDown(0.5);
      
      doc.fontSize(12).font('Helvetica')
        .text(`Total Orders: ${totalOrders}`)
        .text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`)
        .text(`Products Sold: ${productsSold}`)
        .text(`Unique Customers: ${uniqueCustomers}`)
        .moveDown();
      
      // Order details section
      doc.fontSize(14).font('Helvetica-Bold')
        .text("Order Details", { underline: true })
        .moveDown(0.5);
      
      orders.forEach((o, i) => {
        const orderDate = new Date(o.createdAt).toLocaleDateString();
        const customerName = o.userId?.name || "Guest User";
        const total = typeof o.totalAmount === 'number' ? o.totalAmount : 0;
        
        doc.fontSize(11).font('Helvetica-Bold')
          .text(`Order #${o._id.toString().slice(-6)} - ${orderDate}`, { continued: true })
          .font('Helvetica')
          .text(`  Customer: ${customerName}`, { align: 'right' })
          .moveDown(0.2);
        
        doc.fontSize(10).font('Helvetica')
          .text(`Items: ${(o.products || []).map(p => `${p.name || 'Product'} x${p.qty || 0}`).join(', ') || 'No items'}`)
          .text(`Total: ₹${total.toFixed(2)} | Status: ${o.status || 'Unknown'}`)
          .moveDown(0.5);
        
        // Add separator between orders
        if (i < orders.length - 1) {
          doc.moveDown(0.2)
            .strokeColor("#cccccc")
            .lineWidth(0.5)
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke()
            .moveDown(0.5);
        }
      });
      
      // Footer
      doc.moveDown()
        .fontSize(10)
        .fillColor("#666666")
        .text(`Report generated on ${new Date().toLocaleString()}`, { align: "center" });
      
      doc.end();
      return;
    }

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      
      // Summary sheet
      const summarySheet = workbook.addWorksheet("Summary");
      summarySheet.addRow(["Report Generated:", new Date().toLocaleString()]);
      if (startDate && endDate) {
        summarySheet.addRow(["Period:", `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`]);
      }
      summarySheet.addRow([]);
      summarySheet.addRow(["Metric", "Value"]);
      summarySheet.addRow(["Total Orders", totalOrders]);
      summarySheet.addRow(["Total Revenue", totalRevenue]);
      summarySheet.addRow(["Products Sold", productsSold]);
      summarySheet.addRow(["Unique Customers", uniqueCustomers]);
      
      summarySheet.getColumn('A').width = 20;
      summarySheet.getColumn('B').width = 15;
      
      // Format currency cells
      summarySheet.getCell('B4').numFmt = '₹#,##0.00';
      
      // Orders sheet
      const ordersSheet = workbook.addWorksheet("Orders");
      ordersSheet.columns = [
        { header: "Order ID", key: "orderId", width: 25 },
        { header: "Date", key: "date", width: 20 },
        { header: "Customer Name", key: "customer", width: 25 },
        { header: "Customer Email", key: "email", width: 30 },
        { header: "Items", key: "items", width: 50 },
        { header: "Total Amount", key: "total", width: 15 },
        { header: "Status", key: "status", width: 15 }
      ];
      
      orders.forEach(o => {
        const itemsList = (o.products || [])
          .map(p => `${p.name || 'Product'} (${p.qty || 0})`)
          .join(', ');
        
        ordersSheet.addRow({
          orderId: o._id.toString(),
          date: new Date(o.createdAt).toLocaleString(),
          customer: o.userId?.name || "Guest User",
          email: o.userId?.email || "N/A",
          items: itemsList || "No items",
          total: typeof o.totalAmount === 'number' ? o.totalAmount : 0,
          status: o.status || "Unknown"
        });
      });
      
      // Format currency column
      ordersSheet.getColumn('F').numFmt = '₹#,##0.00';
      
      // Products sheet (detailed items)
      const productsSheet = workbook.addWorksheet("Products Sold");
      productsSheet.columns = [
        { header: "Order ID", key: "orderId", width: 25 },
        { header: "Product Name", key: "product", width: 30 },
        { header: "Quantity", key: "qty", width: 10 },
        { header: "Price", key: "price", width: 12 },
        { header: "Subtotal", key: "subtotal", width: 15 }
      ];
      
      orders.forEach(o => {
        (o.products || []).forEach(p => {
          productsSheet.addRow({
            orderId: o._id.toString().slice(-8),
            product: p.name || "Unknown Product",
            qty: p.qty || 0,
            price: typeof p.price === 'number' ? p.price : 0,
            subtotal: (typeof p.price === 'number' ? p.price : 0) * (p.qty || 0)
          });
        });
      });
      
      productsSheet.getColumn('D').numFmt = '₹#,##0.00';
      productsSheet.getColumn('E').numFmt = '₹#,##0.00';
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=sales_report_${Date.now()}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    // Default JSON response with formatted data
    res.json({
      summary: {
        totalOrders,
        totalRevenue,
        productsSold,
        uniqueCustomers
      },
      orders: orders.map(o => ({
        ...o,
        customerName: o.userId?.name || "Guest User",
        customerEmail: o.userId?.email || "N/A",
        totalAmount: typeof o.totalAmount === 'number' ? o.totalAmount : 0
      }))
    });
  })
);

// GET /api/admin/users - Get all users with order counts
router.get(
  "/users",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-passwordHash").lean();
    
    // Get order counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ userId: user._id });
        const totalSpent = await Order.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        
        return {
          ...user,
          orderCount,
          totalSpent: totalSpent[0]?.total || 0
        };
      })
    );
    
    res.json(usersWithStats);
  })
);

export default router;