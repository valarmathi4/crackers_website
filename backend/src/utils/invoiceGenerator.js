import PDFDocument from "pdfkit";

export async function generateInvoicePDF(order, user) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Company Details
    doc.fontSize(20).font('Helvetica-Bold')
      .text('INIYA SRI CRACKERS', 50, 50);
    
    doc.fontSize(10).font('Helvetica')
      .text('553-1-2 Mettamalai', 50, 80)
      .text('Sivakasi to Sattur Main Road', 50, 95)
      .text('Sivakasi - 626203', 50, 110)
      .text('Phone: 9025456695', 50, 125)
      .text('Email: orders@iniyasricrackers.com', 50, 140);

    // Invoice Details
    doc.fontSize(16).font('Helvetica-Bold')
      .text('TAX INVOICE', 400, 50);
    
    doc.fontSize(10).font('Helvetica')
      .text(`Invoice No: INV/${new Date().getFullYear()}/${order._id.toString().slice(-6)}`, 400, 80)
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 95)
      .text(`Order ID: ${order._id}`, 400, 110)
      .text(`Payment ID: ${order.paymentId || 'COD'}`, 400, 125);

    // Billing Details
    doc.fontSize(12).font('Helvetica-Bold')
      .text('Bill To:', 50, 200);
    
    doc.fontSize(10).font('Helvetica')
      .text(user.name, 50, 220)
      .text(user.email, 50, 235)
      .text(order.shippingAddress.phone, 50, 250)
      .text(order.shippingAddress.address1, 50, 265)
      .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 50, 280);

    // Shipping Address
    doc.fontSize(12).font('Helvetica-Bold')
      .text('Ship To:', 300, 200);
    
    doc.fontSize(10).font('Helvetica')
      .text(order.shippingAddress.fullName, 300, 220)
      .text(order.shippingAddress.phone, 300, 235)
      .text(order.shippingAddress.address1, 300, 250)
      .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 300, 265);

    // Items Table Header
    let y = 350;
    doc.fontSize(10).font('Helvetica-Bold');
    
    // Draw table header
    doc.rect(50, y - 5, 500, 25).fill('#f0f0f0');
    doc.fillColor('#000000');
    doc.text('Item', 55, y);
    doc.text('Qty', 300, y);
    doc.text('Unit Price', 370, y);
    doc.text('Total', 470, y);

    y += 25;
    doc.font('Helvetica');

    // Table rows
    order.products.forEach((item, i) => {
      const itemY = y + (i * 25);
      
      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(50, itemY - 5, 500, 20).fill('#fafafa');
        doc.fillColor('#000000');
      }
      
      doc.text(item.name.substring(0, 40), 55, itemY);
      doc.text(item.qty.toString(), 300, itemY);
      doc.text(`₹${item.price.toFixed(2)}`, 370, itemY);
      doc.text(`₹${(item.price * item.qty).toFixed(2)}`, 470, itemY);
    });

    // Summary
    y += (order.products.length * 25) + 30;
    
    doc.rect(350, y - 5, 200, 100).fill('#f5f5f5');
    doc.fillColor('#000000');
    
    doc.text('Subtotal:', 360, y);
    doc.text(`₹${order.itemsPrice.toFixed(2)}`, 500, y, { align: 'right' });
    
    y += 20;
    doc.text('Shipping:', 360, y);
    doc.text(`₹${order.shippingPrice.toFixed(2)}`, 500, y, { align: 'right' });
    
    y += 20;
    doc.font('Helvetica-Bold');
    doc.text('Total:', 360, y);
    doc.text(`₹${order.totalAmount.toFixed(2)}`, 500, y, { align: 'right' });
    
    y += 30;
    doc.fontSize(8).font('Helvetica');
    doc.text('Amount in words:', 50, y);
    doc.font('Helvetica-Bold');
    doc.text(numberToWords(order.totalAmount) + ' Rupees Only', 50, y + 15);

    // Footer
    y += 60;
    doc.fontSize(9).font('Helvetica');
    doc.text('Thank you for shopping with Iniya Sri Crackers!', 50, y, { align: 'center', width: 500 });
    
    y += 20;
    doc.text('This is a computer generated invoice - no signature required.', 50, y, { align: 'center', width: 500 });
    
    // Terms
    doc.fontSize(8);
    doc.text('Terms & Conditions:', 50, y + 30);
    doc.text('1. Goods once sold will not be taken back', 50, y + 45);
    doc.text('2. All disputes are subject to Sivakasi jurisdiction', 50, y + 55);
    doc.text('3. This serves as a valid proof of purchase', 50, y + 65);

    doc.end();
  });
}

function numberToWords(num) {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convert = (n) => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
    return '';
  };
  
  let words = [];
  if (num >= 1000) {
    words.push(convert(Math.floor(num / 1000)) + ' Thousand');
    num %= 1000;
  }
  if (num >= 100) {
    words.push(convert(Math.floor(num / 100)) + ' Hundred');
    num %= 100;
  }
  if (num > 0) {
    words.push(convert(num));
  }
  
  return words.join(' ');
}