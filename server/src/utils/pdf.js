import PDFDocument from 'pdfkit';

const formatMoney = (n) => {
  const num = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));
  return `${COMPANY.currency} ${num}`;
};

const formatDate = (d) => new Date(d).toLocaleDateString();

const COMPANY = {
  name: process.env.COMPANY_NAME || 'Your Company Name',
  address: process.env.COMPANY_ADDRESS || '123 Main Street, City, Country',
  email: process.env.COMPANY_EMAIL || 'billing@company.com',
  phone: process.env.COMPANY_PHONE || '+1 555 0100',
  currency: process.env.COMPANY_CURRENCY || 'Rs',
};

const drawHeader = (doc) => {
  doc
    .fillColor('#1f2937')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(COMPANY.name, { align: 'left' })
    .moveDown(0.2)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#4b5563')
    .text(COMPANY.address)
    .text(`${COMPANY.email} • ${COMPANY.phone}`);
};

const drawInvoiceMeta = (doc, invoice) => {
  const startY = 110;
  doc
    .fillColor('#111827')
    .font('Helvetica-Bold')
    .fontSize(28)
    .text('INVOICE', 400, 50);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#374151');

  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 400, startY);
  doc.text(`Date: ${formatDate(invoice.issuedAt)}`, 400, startY + 15);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 400, startY + 30);
  doc.text(`Payment: ${invoice.paymentStatus.toUpperCase()}`, 400, startY + 45);
};

const drawBillTo = (doc, invoice) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text('Bill To:', 50, 110);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#374151')
    .text(invoice.customer?.name || '', 50, 125)
    .text(invoice.customer?.email || '', 50, 140)
    .text(invoice.customer?.phone || '', 50, 155)
    .text(invoice.customer?.address || '', 50, 170, { width: 250 });
};

const drawItemsTable = (doc, invoice) => {
  const tableTop = 220;
  const rowHeight = 22;

  doc
    .rect(50, tableTop, 500, rowHeight)
    .fill('#f3f4f6')
    .fillColor('#111827')
    .font('Helvetica-Bold')
    .fontSize(10);

  doc.text('Item', 55, tableTop + 6, { width: 200 });
  doc.text('SKU', 260, tableTop + 6, { width: 80 });
  doc.text('Qty', 340, tableTop + 6, { width: 40, align: 'right' });
  doc.text('Price', 385, tableTop + 6, { width: 60, align: 'right' });
  doc.text('Total', 450, tableTop + 6, { width: 95, align: 'right' });

  doc.fillColor('#1f2937').font('Helvetica').fontSize(10);
  let y = tableTop + rowHeight;
  invoice.items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.rect(50, y, 500, rowHeight).fill('#fafafa');
      doc.fillColor('#1f2937');
    }
    doc.text(item.name, 55, y + 6, { width: 200 });
    doc.text(item.sku, 260, y + 6, { width: 80 });
    doc.text(String(item.quantity), 340, y + 6, { width: 40, align: 'right' });
    doc.text(formatMoney(item.price), 385, y + 6, { width: 60, align: 'right' });
    doc.text(formatMoney(item.lineTotal), 450, y + 6, { width: 95, align: 'right' });
    y += rowHeight;
  });
  return y;
};

const drawTotals = (doc, invoice, startY) => {
  const rightX = 380;
  const labelW = 80;
  const valueX = 470;
  let y = startY + 20;

  const drawRow = (label, value, bold = false) => {
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 12 : 10)
      .fillColor('#111827')
      .text(label, rightX, y, { width: labelW, align: 'right' });
    doc.text(formatMoney(value), valueX, y, { width: 75, align: 'right' });
    y += bold ? 22 : 18;
  };

  drawRow('Subtotal', invoice.subtotal);
  if (invoice.discount) drawRow('Discount', -invoice.discount);
  if (invoice.taxAmount) drawRow(`Tax (${invoice.taxPercent}%)`, invoice.taxAmount);
  drawRow('Grand Total', invoice.grandTotal, true);
  drawRow('Paid', invoice.amountPaid);
  drawRow('Balance Due', invoice.balanceDue, true);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#374151')
    .text(
      `Payment status: ${invoice.paymentStatus.toUpperCase()}`,
      rightX,
      y,
      { width: 165, align: 'right' }
    );
};

const drawFooter = (doc, invoice) => {
  doc
    .font('Helvetica-Oblique')
    .fontSize(9)
    .fillColor('#6b7280')
    .text(
      invoice.notes ? `Notes: ${invoice.notes}` : 'Thank you for your business!',
      50,
      750,
      { width: 500 }
    )
    .text(`Generated on ${new Date().toLocaleString()}`, 50, 780, { width: 500 });
};

const streamInvoice = (res, invoice, { download = false } = {}) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  const filename = `${invoice.invoiceNumber}.pdf`;
  res.setHeader(
    'Content-Disposition',
    `${download ? 'attachment' : 'inline'}; filename="${filename}"`
  );
  doc.pipe(res);

  drawHeader(doc);
  drawInvoiceMeta(doc, invoice);
  drawBillTo(doc, invoice);
  const y = drawItemsTable(doc, invoice);
  drawTotals(doc, invoice, y);
  drawFooter(doc, invoice);

  doc.end();
};

export { streamInvoice };