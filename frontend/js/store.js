/* ============================
   store.js — Data Store & Mock Data
   ============================ */

const DEFAULT_VENDORS = [
  { id:'V001', name:'ABC Technologies', category:'IT Equipment', gst:'22AABCT1332L1ZV', email:'abc@vendor.com', phone:'9876543210', status:'Active', rating:4.8, addedDate:'2024-01-15' },
  { id:'V002', name:'Global Supplies Co.', category:'Office Materials', gst:'27AAACG1234N1Z5', email:'global@supplier.com', phone:'9876543211', status:'Active', rating:4.2, addedDate:'2024-02-10' },
  { id:'V003', name:'Prime Industries', category:'Manufacturing', gst:'24AAAPI5678M1ZX', email:'prime@mfg.com', phone:'9876543212', status:'Active', rating:4.6, addedDate:'2024-02-20' },
  { id:'V004', name:'Nexus Hardware', category:'Infrastructure', gst:'09AAACN9012P1ZT', email:'nexus@hw.com', phone:'9876543213', status:'Suspended', rating:3.9, addedDate:'2024-03-05' },
  { id:'V005', name:'Swift Logistics', category:'Logistics', gst:'33AAACS3456Q1ZR', email:'swift@logistics.com', phone:'9876543214', status:'Active', rating:4.5, addedDate:'2024-03-15' },
];

const DEFAULT_RFQS = [
  { id:'RFQ-101', title:'Laptop Procurement Q2', category:'IT Equipment', description:'Core i7 laptops for HQ', items:[{name:'Dell Laptops i7',qty:50,unit:'Pcs'}], deadline:'2025-06-15', status:'Open', assignedVendors:['V001','V002'], createdBy:'Admin User', createdAt:'2025-06-01' },
  { id:'RFQ-102', title:'Office Printer Supply', category:'Office Equipment', description:'Network printers for all floors', items:[{name:'HP LaserJet Printers',qty:20,unit:'Pcs'}], deadline:'2025-06-18', status:'Quoted', assignedVendors:['V001','V003'], createdBy:'Admin User', createdAt:'2025-05-28' },
  { id:'RFQ-103', title:'Office Furniture Q2', category:'Furniture', description:'Chairs and desks', items:[{name:'Executive Chairs',qty:100,unit:'Pcs'},{name:'Office Desks',qty:30,unit:'Pcs'}], deadline:'2025-06-20', status:'Under Review', assignedVendors:['V002','V005'], createdBy:'Ravi Sharma', createdAt:'2025-05-25' },
  { id:'RFQ-104', title:'Network Infrastructure', category:'IT Equipment', description:'Core networking gear', items:[{name:'Cisco Switches',qty:10,unit:'Pcs'},{name:'CAT6 Cables',qty:500,unit:'Meters'}], deadline:'2025-06-25', status:'Awarded', assignedVendors:['V001','V004'], createdBy:'Admin User', createdAt:'2025-05-20' },
];

const DEFAULT_QUOTATIONS = [
  { id:'QT-001', rfqId:'RFQ-101', vendorId:'V001', vendorName:'ABC Technologies', items:[{name:'Dell Laptops i7',qty:50,unitPrice:22500,total:1125000}], deliveryDays:14, gstPercent:18, gstAmount:202500, subTotal:1125000, grandTotal:1327500, notes:'Includes 1-year warranty.', status:'Submitted', submittedAt:'2025-06-02' },
  { id:'QT-002', rfqId:'RFQ-101', vendorId:'V002', vendorName:'Global Supplies Co.', items:[{name:'Dell Laptops i7',qty:50,unitPrice:23200,total:1160000}], deliveryDays:21, gstPercent:18, gstAmount:208800, subTotal:1160000, grandTotal:1368800, notes:'Delivery from Mumbai.', status:'Submitted', submittedAt:'2025-06-03' },
  { id:'QT-003', rfqId:'RFQ-102', vendorId:'V001', vendorName:'ABC Technologies', items:[{name:'HP LaserJet Printers',qty:20,unitPrice:15000,total:300000}], deliveryDays:10, gstPercent:18, gstAmount:54000, subTotal:300000, grandTotal:354000, notes:'Toner cartridges included.', status:'Submitted', submittedAt:'2025-05-30' },
  { id:'QT-004', rfqId:'RFQ-102', vendorId:'V003', vendorName:'Prime Industries', items:[{name:'HP LaserJet Printers',qty:20,unitPrice:14200,total:284000}], deliveryDays:7, gstPercent:18, gstAmount:51120, subTotal:284000, grandTotal:335120, notes:'Fastest delivery guaranteed.', status:'Submitted', submittedAt:'2025-05-31' },
  { id:'QT-005', rfqId:'RFQ-103', vendorId:'V002', vendorName:'Global Supplies Co.', items:[{name:'Executive Chairs',qty:100,unitPrice:4500,total:450000},{name:'Office Desks',qty:30,unitPrice:8000,total:240000}], deliveryDays:30, gstPercent:18, gstAmount:124200, subTotal:690000, grandTotal:814200, notes:'Assembly included.', status:'Under Review', submittedAt:'2025-05-26' },
];

const DEFAULT_APPROVALS = [
  { id:'APR-001', refId:'RFQ-103', type:'RFQ', title:'Office Furniture Q2', amount:814200, requestedBy:'Ravi Sharma', department:'Operations', status:'Pending', stage:1, totalStages:3, stages:['Dept Head','Finance','MD'], remarks:'', requestedAt:'2025-05-26' },
  { id:'APR-002', refId:'QT-003', type:'Quotation', title:'Printer Quote — ABC Technologies', amount:354000, requestedBy:'Admin User', department:'IT', status:'Pending', stage:2, totalStages:3, stages:['Dept Head','Finance','MD'], remarks:'', requestedAt:'2025-05-30' },
  { id:'APR-003', refId:'RFQ-104', type:'RFQ', title:'Network Infrastructure', amount:180000, requestedBy:'Admin User', department:'IT', status:'Approved', stage:3, totalStages:3, stages:['Dept Head','Finance','MD'], remarks:'Approved. Proceed with PO.', requestedAt:'2025-05-20' },
];

const DEFAULT_POS = [
  { id:'PO-2001', rfqId:'RFQ-104', rfqTitle:'Network Infrastructure', vendorId:'V001', vendorName:'ABC Technologies', items:[{name:'Cisco Switches',qty:10,unitPrice:12500,total:125000},{name:'CAT6 Cables',qty:500,unitPrice:50,total:25000}], subTotal:150000, gstPercent:18, gstAmount:27000, grandTotal:177000, status:'Issued', issuedDate:'2025-06-01', deliveryDate:'2025-06-20', invoiceGenerated:true },
  { id:'PO-2002', rfqId:'RFQ-102', rfqTitle:'Office Printer Supply', vendorId:'V003', vendorName:'Prime Industries', items:[{name:'HP LaserJet Printers',qty:20,unitPrice:14200,total:284000}], subTotal:284000, gstPercent:18, gstAmount:51120, grandTotal:335120, status:'Pending', issuedDate:'2025-06-03', deliveryDate:'2025-06-10', invoiceGenerated:false },
];

const DEFAULT_ACTIVITIES = [
  { id:'ACT-001', type:'Vendor', icon:'🏢', text:'Vendor "ABC Technologies" registered and marked Active.', timestamp:'2025-06-01T09:00:00Z', user:'Admin User' },
  { id:'ACT-002', type:'RFQ', icon:'📋', text:'RFQ-101 "Laptop Procurement Q2" created.', timestamp:'2025-06-01T10:30:00Z', user:'Admin User' },
  { id:'ACT-003', type:'Quotation', icon:'💬', text:'Quotation QT-001 submitted by ABC Technologies for RFQ-101.', timestamp:'2025-06-02T11:00:00Z', user:'V001' },
  { id:'ACT-004', type:'Quotation', icon:'💬', text:'Quotation QT-002 submitted by Global Supplies Co. for RFQ-101.', timestamp:'2025-06-03T14:20:00Z', user:'V002' },
  { id:'ACT-005', type:'Approval', icon:'✅', text:'Approval APR-003 for Network Infrastructure approved by MD.', timestamp:'2025-05-22T16:00:00Z', user:'Admin User' },
  { id:'ACT-006', type:'PO', icon:'🛒', text:'Purchase Order PO-2001 issued to ABC Technologies.', timestamp:'2025-06-01T17:00:00Z', user:'Admin User' },
  { id:'ACT-007', type:'Invoice', icon:'🧾', text:'Invoice generated for PO-2001 (₹1,77,000).', timestamp:'2025-06-02T09:30:00Z', user:'Admin User' },
  { id:'ACT-008', type:'RFQ', icon:'📋', text:'RFQ-103 "Office Furniture Q2" created by Ravi Sharma.', timestamp:'2025-05-25T10:00:00Z', user:'Ravi Sharma' },
  { id:'ACT-009', type:'Approval', icon:'⏳', text:'Approval APR-001 for Office Furniture submitted for review.', timestamp:'2025-05-26T11:00:00Z', user:'Ravi Sharma' },
  { id:'ACT-010', type:'Vendor', icon:'🏢', text:'Vendor "Nexus Hardware" status changed to Suspended.', timestamp:'2025-05-28T14:00:00Z', user:'Admin User' },
];

/* ── Store Init ── */
const Store = {
  _key: 'erp_store',
  get() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  save(data) {
    localStorage.setItem(this._key, JSON.stringify(data));
  },
  init() {
    if (!this.get()) {
      this.save({
        vendors: DEFAULT_VENDORS,
        rfqs: DEFAULT_RFQS,
        quotations: DEFAULT_QUOTATIONS,
        approvals: DEFAULT_APPROVALS,
        pos: DEFAULT_POS,
        activities: DEFAULT_ACTIVITIES,
        nextId: { vendor:6, rfq:105, qt:6, apr:4, po:3, act:11 },
      });
    }
    return this.get();
  },
  // Vendors
  getVendors() { return this.get().vendors || []; },
  saveVendors(v) { const d=this.get(); d.vendors=v; this.save(d); },
  // RFQs
  getRFQs() { return this.get().rfqs || []; },
  saveRFQs(r) { const d=this.get(); d.rfqs=r; this.save(d); },
  // Quotations
  getQuotations() { return this.get().quotations || []; },
  saveQuotations(q) { const d=this.get(); d.quotations=q; this.save(d); },
  // Approvals
  getApprovals() { return this.get().approvals || []; },
  saveApprovals(a) { const d=this.get(); d.approvals=a; this.save(d); },
  // POs
  getPOs() { return this.get().pos || []; },
  savePOs(p) { const d=this.get(); d.pos=p; this.save(d); },
  // Activities
  getActivities() { return this.get().activities || []; },
  addActivity(type, icon, text, user) {
    const d = this.get();
    const id = 'ACT-' + String(d.nextId.act++).padStart(3,'0');
    d.activities.unshift({ id, type, icon, text, timestamp: new Date().toISOString(), user: user || 'System' });
    this.save(d);
  },
  // Next IDs
  nextID(type) {
    const d = this.get();
    const n = d.nextId[type]++;
    this.save(d);
    return n;
  },
};

/* Initialize on load */
Store.init();
