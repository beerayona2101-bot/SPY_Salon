/**
 * SPY Salon Enterprise PDF Invoice Controller
 * Verifies authorization and outputs custom formatted PDF invoice stream.
 */

const PDFDocument = require('pdfkit');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/invoices/:id
 * Generate and stream professional PDF invoice for authorized users
 */
exports.generateInvoicePDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch appointment details
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return ApiResponse.error(res, 'Appointment booking not found.', 404);
    }

    // 2. Perform authorized checks
    const requestingUser = req.user;
    if (!requestingUser) {
      return ApiResponse.error(res, 'Authentication required.', 401);
    }

    // Role-based verification
    if (requestingUser.role === 'customer') {
      // Customer can only download their own invoice
      if (String(appointment.customerId) !== String(requestingUser._id) && 
          appointment.customerPhone !== requestingUser.phone &&
          appointment.customerEmail !== requestingUser.email) {
        return ApiResponse.error(res, 'Access denied. You are not authorized to view this invoice.', 403);
      }
    } else if (requestingUser.role === 'manager' || requestingUser.role === 'receptionist') {
      // Branch check: Managers and receptionists can only download invoices from their assigned branch
      if (appointment.branchId && String(appointment.branchId) !== String(requestingUser.branchId)) {
        return ApiResponse.error(res, 'Access denied. This booking belongs to another branch.', 403);
      }
    } else if (requestingUser.role !== 'admin') {
      // Fallback for other unauthorized employee roles
      if (String(appointment.customerId) !== String(requestingUser._id)) {
        return ApiResponse.error(res, 'Access denied. You are not authorized to view this invoice.', 403);
      }
    }

    // 3. Retrieve service pricing information from the database
    const serviceDoc = await Service.findOne({ name: new RegExp('^' + appointment.service.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') });
    
    // Find customer to see if they have VIP membership discount active
    let customerDoc = null;
    if (appointment.customerId) {
      customerDoc = await User.findById(appointment.customerId);
    }

    // 4. Calculate invoice financial totals using validated appointment/service price
    const basePrice = Number(appointment.price || (serviceDoc ? (serviceDoc.discountPrice || serviceDoc.price) : 0));
    if (!basePrice || basePrice <= 0) {
      return ApiResponse.error(res, 'Invoice generation rejected: Validated financial price unavailable for this booking.', 400);
    }
    let price = basePrice;
    let discount = 0;
    
    if (serviceDoc && serviceDoc.discountPrice && serviceDoc.discountPrice < basePrice) {
      discount = basePrice - serviceDoc.discountPrice;
      price = serviceDoc.discountPrice;
    }

    if (customerDoc && customerDoc.membership && customerDoc.membership.discountPercent > 0) {
      const vipDiscount = Math.round(price * (customerDoc.membership.discountPercent / 100));
      discount += vipDiscount;
      price -= vipDiscount;
    }

    const gst = Math.round(price * 0.05); // 5% GST
    const total = price + gst;

    // 5. Generate and Stream PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream buffers
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=SPY-INVOICE-${appointment.bookingId}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.status(200).send(pdfBuffer);
    });

    // Handle PDFKit design layouts
    // Burgundy theme primary color, gold accents
    const primaryColor = '#4d1526';
    const secondaryColor = '#b89047';
    const textColor = '#1F2937';

    // Header Logo and Subtitle
    doc.fillColor(primaryColor).fontSize(26).font('Helvetica-Bold').text('SPY Salon', 50, 50);
    doc.fillColor(secondaryColor).fontSize(9).font('Helvetica').text('PESHWAY LUXURY UNISEX SALON', 50, 78);
    
    // Right side: Document Title and date info
    doc.fillColor('#111827').fontSize(22).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica')
       .text(`Invoice Ref: INV-${appointment.bookingId}`, 400, 78, { align: 'right' })
       .text(`Date Issued: ${new Date(appointment.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 400, 92, { align: 'right' });

    // Separator Line
    doc.moveTo(50, 115).lineTo(550, 115).strokeColor('#e5e7eb').lineWidth(1.5).stroke();

    // Branch Information Block
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('Salon Branch Details:', 50, 135);
    doc.fillColor(textColor).fontSize(9.5).font('Helvetica')
       .text(`SPY Salon - ${appointment.branch || 'Jubilee Hills Flagship'}`, 50, 152)
       .text('Road No. 36, Jubilee Hills', 50, 166)
       .text('Hyderabad, Telangana - 500033', 50, 180)
       .text('Phone: +91 98765 43210', 50, 194);

    // Customer Billing Block
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('Billed To Customer:', 310, 135);
    doc.fillColor(textColor).fontSize(9.5).font('Helvetica')
       .text(appointment.customerName, 310, 152)
       .text(`Mobile: ${appointment.customerPhone}`, 310, 166)
       .text(`Email: ${appointment.customerEmail || 'Not Registered'}`, 310, 180)
       .text(`Payment: ${appointment.paymentMethod} (${appointment.paymentStatus})`, 310, 194);

    // Separator Line
    doc.moveTo(50, 220).lineTo(550, 220).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Invoice Itemized Table Header
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold');
    doc.text('Service Booked', 50, 240);
    doc.text('Specialist Partner', 270, 240);
    doc.text('Booking Status', 400, 240, { width: 75, align: 'right' });
    doc.text('Base Amount', 485, 240, { width: 65, align: 'right' });

    doc.moveTo(50, 255).lineTo(550, 255).strokeColor('#9ca3af').lineWidth(1.2).stroke();

    // Table Content Row
    doc.fillColor(textColor).fontSize(9.5).font('Helvetica');
    doc.text(appointment.service, 50, 270, { width: 210 });
    doc.text(appointment.specialistName ? appointment.specialistName.split('(')[0].trim() : 'Any Available Specialist', 270, 270, { width: 120 });
    doc.text(appointment.status, 400, 270, { width: 75, align: 'right' });
    doc.text(`₹${basePrice}.00`, 485, 270, { width: 65, align: 'right' });

    doc.moveTo(50, 310).lineTo(550, 310).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Invoice Financial Breakdown Summary
    let currentY = 325;
    doc.fontSize(9.5).font('Helvetica').fillColor('#4B5563');
    doc.text('Subtotal:', 340, currentY, { width: 125, align: 'right' });
    doc.fillColor(textColor).text(`₹${basePrice}.00`, 485, currentY, { width: 65, align: 'right' });

    if (discount > 0) {
      currentY += 18;
      doc.fillColor('#4B5563').text('Club/VIP Discount:', 340, currentY, { width: 125, align: 'right' });
      doc.fillColor('#10B981').text(`- ₹${discount}.00`, 485, currentY, { width: 65, align: 'right' });
    }

    currentY += 18;
    doc.fillColor('#4B5563').text('Taxes (GST 5%):', 340, currentY, { width: 125, align: 'right' });
    doc.fillColor(textColor).text(`₹${gst}.00`, 485, currentY, { width: 65, align: 'right' });

    // Total Highlight Card
    currentY += 24;
    doc.rect(340, currentY - 5, 210, 28).fill('#f9fafb').strokeColor(secondaryColor).lineWidth(1).stroke();
    doc.fillColor(primaryColor).fontSize(10.5).font('Helvetica-Bold');
    doc.text('Total Paid Amount:', 350, currentY + 3, { width: 120, align: 'left' });
    doc.text(`₹${total}.00`, 470, currentY + 3, { width: 75, align: 'right' });

    // Footer Accents
    doc.moveTo(50, 480).lineTo(550, 480).strokeColor('#e5e7eb').lineWidth(1).stroke();

    doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#6B7280')
       .text('Thank you for choosing the SPY Salon experience. We strive for excellence.', 50, 500, { align: 'center' })
       .text('This is a computer-generated luxury booking invoice slip and requires no physical seal.', 50, 514, { align: 'center' })
       .text('Concierge Support Desk: support@spysalon.com | Terms: Non-refundable service.', 50, 528, { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
