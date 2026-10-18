const escape = (v) => {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  if (/[",\n]/.test(s)) return `"${s}"`;
  return s;
};

const toCsv = (rows) => rows.map((row) => row.map(escape).join(',')).join('\n');

const streamInvoicesCsv = (res, invoices) => {
  const header = [
    'Invoice Number',
    'Date',
    'Customer',
    'Status',
    'Payment Status',
    'Subtotal',
    'Discount',
    'Tax',
    'Grand Total',
    'Amount Paid',
    'Balance Due',
  ];
  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    new Date(inv.issuedAt).toISOString(),
    inv.customer?.name || '',
    inv.status,
    inv.paymentStatus,
    inv.subtotal,
    inv.discount,
    inv.taxAmount,
    inv.grandTotal,
    inv.amountPaid,
    inv.balanceDue,
  ]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
  res.write(toCsv([header, ...rows]));
  res.end();
};

const streamProductsCsv = (res, products) => {
  const header = [
    'SKU',
    'Name',
    'Category',
    'Purchase Price',
    'Selling Price',
    'Stock',
    'Low Stock Threshold',
    'Status',
  ];
  const rows = products.map((p) => [
    p.sku,
    p.name,
    p.category?.name || '',
    p.purchasePrice,
    p.sellingPrice,
    p.stock,
    p.lowStockThreshold,
    p.status,
  ]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
  res.write(toCsv([header, ...rows]));
  res.end();
};

export { streamInvoicesCsv, streamProductsCsv };