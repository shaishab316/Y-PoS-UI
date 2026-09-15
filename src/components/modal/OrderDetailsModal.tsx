import { useState } from "react";
import { X, ShoppingBag, CreditCard, Clock, MapPin, ClipboardList, Printer, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGetOrderDetailsQuery } from "@/redux/features/order/order.api";
import { useGetTableDetailsQuery } from "@/redux/features/table/table.api";
import { useGetBusinessInformationQuery } from "@/redux/features/dashboard/dashboard.api";
import { Order } from "@/redux/features/order/order.type";



interface OrderDetailsModalProps {
  orderId: number | null;
  onClose: () => void;
}

const formatCurrency = (value: string | number) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "Rp 0";
  return `Rp ${numericValue.toLocaleString("en-US")}`;
};

const formatInvoiceCurrency = (value: string | number) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "Rp0";
  const formattedStr = Number(numericValue.toFixed(2)).toString();
  const parts = formattedStr.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp${parts.join(",")}`;
};

const formatInvoiceDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const generateInvoiceInnerHtml = (order: Order, business: any) => {
  const businessName = business?.name || "Y PoS";
  const businessLogo = business?.logoUrl || "";
  const businessAddress = business?.address || "";
  const businessPhone = business?.contact || "";
  const businessEmail = business?.email || "";
  const feedbackMsg = business?.feedbackMsg || "Everything is working well. The system looks clean and easy to use.,";

  const subtotal = Number(order.subtotal);
  const total = Number(order.totalAmount);

  const formattedSubtotal = formatInvoiceCurrency(subtotal);
  const formattedTotal = formatInvoiceCurrency(total);

  const menuCount = order.orderItems?.length || 0;
  const menuSuffix = menuCount === 1 ? "1 menu" : `${menuCount} menu`;
  const paymentMethod = order.payment?.[0]?.method || "CASH";

  const adjustmentsHtml = order.pricingAdjustments?.map(adj => {
    const amount = adj.type === "PERCENTAGE"
      ? (subtotal * Number(adj.percentage || 0)) / 100
      : Number(adj.fixedAmount);
    const isNegative = amount < 0;
    const formattedVal = formatInvoiceCurrency(Math.abs(amount));
    const sign = isNegative ? "-" : "+";
    const label = `${adj.level}${adj.type === "PERCENTAGE" ? ` (${adj.percentage}%)` : ""}`;
    return `
      <div class="totals-row">
        <span>${label}</span>
        <span>${sign}${formattedVal}</span>
      </div>
    `;
  }).join("") || "";

  const itemsHtml = order.orderItems?.map(item => {
    const priceVal = Number(item.promoPrice || item.unitPrice) * item.quantity;
    const formattedPrice = formatInvoiceCurrency(priceVal);

    let choicesHtml = "";
    if (item.packetChoices && item.packetChoices.length > 0) {
      choicesHtml = `
        <div class="item-choices">
          ${item.packetChoices.map(c => {
            const choiceName = c.choice || (c as any).item?.name || (c as any).choiceItem?.name || "";
            return `${c.section}: ${c.quantity}x ${choiceName}`;
          }).join('<br/>')}
        </div>
      `;
    }

    return `
      <div class="item-row">
        <div class="item-left">
          <span class="item-qty">${item.quantity}x</span>
          <div class="item-name-details">
            <span class="item-name">${item.itemName.toUpperCase()}</span>
            ${choicesHtml}
          </div>
        </div>
        <span class="item-price">${formattedPrice}</span>
      </div>
    `;
  }).join("") || "";

  return `
    <div class="header">
      <div class="logo-container">
        ${businessLogo ? `<img class="logo-image" src="${businessLogo}" alt="Logo" />` : `
        <div class="logo-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2d3748" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px;">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
            <line x1="6" y1="2" x2="6" y2="4"></line>
            <line x1="10" y1="2" x2="10" y2="4"></line>
            <line x1="14" y1="2" x2="14" y2="4"></line>
          </svg>
        </div>
        `}
      </div>
      <div class="brand-name">${businessName.toUpperCase()}</div>
      <div class="address-info">
        ${businessAddress}<br/>
        ${businessPhone}<br/>
        ${businessEmail}
      </div>
    </div>
    
    <div class="dashed-divider"></div>
    <div class="receipt-title">Receipt</div>
    <div class="dashed-divider"></div>
    
    <div class="order-type-box">
      <span class="order-type-label">Order Type</span>
      <div class="order-type-val-container">
        <span class="order-type-value">${order.type === 'DINE_IN' ? 'Dine In' : order.type === 'TAKEAWAY' ? 'Takeaway' : order.type}</span>
        <div class="checkmark-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="width: 10px; height: 10px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="meta-grid">
      <div>
        <div class="meta-label">DATE</div>
        <div class="meta-value">${formatInvoiceDate(order.createdAt)}</div>
      </div>
      <div>
        <div class="meta-label">ORDER NUMBER</div>
        <div class="order-num-value">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px; color: #94a3b8;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          ${order.slug.toUpperCase()}
        </div>
      </div>
      ${order.table ? `
      <div class="table-section">
        <div class="table-icon-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #0f172a;">
            <path d="M6 9h12" />
            <path d="M12 9v9" />
            <path d="M8 18h8" />
            <path d="M7 9a5 5 0 0 1 10 0" />
          </svg>
        </div>
        <div>
          <div class="table-number-label">Table Number</div>
          <div class="table-number-value">${order.table.tableNumber}</div>
        </div>
      </div>
      ` : ''}
    </div>
    
    <div class="dashed-divider"></div>
    <div class="section-title">Ordered Items</div>
    <div class="item-list">
      ${itemsHtml}
    </div>
    <div class="dashed-divider"></div>
    
    <div class="totals-box">
      <div class="totals-row">
        <span>Subtotal (${menuSuffix})</span>
        <span>${formattedSubtotal}</span>
      </div>
      ${adjustmentsHtml}
      <div class="totals-row">
        <span>Payment Method</span>
        <span style="font-weight: 700; color: #000000;">${paymentMethod.toUpperCase()}</span>
      </div>
      <div class="dashed-divider" style="margin: 8px 0;"></div>
      <div class="totals-row total-amount">
        <span>Total</span>
        <span>${formattedTotal}</span>
      </div>
    </div>
    
    <div class="feedback-box">
      <div class="feedback-top">
        <div class="feedback-emoji-container">👍</div>
        <div class="feedback-text">${feedbackMsg}</div>
      </div>
    </div>
  `;
};

const generateInvoiceHtml = (order: Order, business: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${order.slug}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #ffffff;
          color: #1e293b;
          padding: 24px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .receipt-container {
          width: 380px;
          background: #ffffff;
          margin: 0 auto;
        }
        .header { text-align: center; margin-bottom: 16px; }
        .logo-container { display: flex; justify-content: center; margin-bottom: 8px; }
        .logo-image {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }
        .logo-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ffffff;
          border: 1.5px solid #2d3748;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-name {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #000000;
          margin-bottom: 4px;
        }
        .address-info {
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
          font-weight: 500;
        }
        .dashed-divider {
          border: none;
          border-top: 1px dashed #cbd5e1;
          margin: 12px 0;
          height: 0;
        }
        .receipt-title {
          font-family: Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          font-style: italic;
          text-align: center;
          color: #000000;
          margin: 8px 0;
        }
        .order-type-box {
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .order-type-label { font-size: 12px; color: #64748b; font-weight: 500; }
        .order-type-val-container { display: flex; align-items: center; gap: 6px; }
        .order-type-value { font-size: 13px; font-weight: 700; color: #000000; }
        .checkmark-badge {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          row-gap: 12px;
          column-gap: 16px;
          font-size: 12px;
          margin-bottom: 16px;
          padding: 0 4px;
        }
        .meta-label { color: #64748b; margin-bottom: 4px; font-weight: 500; }
        .meta-value { font-weight: 600; color: #0f172a; }
        .order-num-value {
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .table-section { display: flex; align-items: flex-start; gap: 8px; grid-column: span 2; }
        .table-number-label { color: #64748b; font-size: 12px; font-weight: 500; }
        .table-number-value { font-size: 16px; font-weight: 800; color: #000000; margin-top: 1px; }
        .section-title { font-size: 14px; font-weight: 700; color: #000000; margin-bottom: 12px; padding: 0 4px; }
        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: 13px;
          margin-bottom: 10px;
          padding: 0 4px;
        }
        .item-left { display: flex; align-items: flex-start; gap: 6px; max-width: 75%; }
        .item-qty { font-weight: 700; color: #000000; min-width: 20px; }
        .item-name-details { display: flex; flex-direction: column; }
        .item-name { font-weight: 600; color: #1e293b; text-transform: uppercase; letter-spacing: 0.2px; }
        .item-choices { font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.3; }
        .item-price { font-weight: 600; color: #0f172a; }
        .totals-box { font-size: 13px; padding: 0 4px; margin-bottom: 24px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; color: #475569; }
        .totals-row.bold { font-weight: 700; color: #0f172a; }
        .totals-row.total-amount { font-size: 16px; font-weight: 800; color: #000000; margin-top: 12px; }
        .feedback-box { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 8px; }
        .feedback-top { padding: 14px; display: flex; align-items: center; gap: 12px; background: #ffffff; }
        .feedback-emoji-container {
          font-size: 24px;
          background: #fff6f0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .feedback-text { font-size: 12.5px; font-weight: 600; color: #1e293b; line-height: 1.4; }
        .feedback-button { border-top: 1px solid #e2e8f0; padding: 10px; text-align: center; font-size: 13px; font-weight: 700; color: #000000; background: #ffffff; }
        
        @media print {
          body {
            padding: 0;
            background-color: white;
          }
          .receipt-container {
            width: 100%;
            max-width: 380px;
          }
        }
      </style>
    </head>
    <body>
        <div class="receipt-container">
          ${generateInvoiceInnerHtml(order, business)}
        </div>
    </body>
    </html>
  `;
};

const OrderDetailsModal = ({ orderId, onClose }: OrderDetailsModalProps) => {
  const t = useTranslations("Order");
  const { data: businessRes } = useGetBusinessInformationQuery(undefined);
  const business = businessRes?.data;

  const { data: detailsRes, isLoading } = useGetOrderDetailsQuery(
    orderId,
    { skip: !orderId }
  );

  const orderData = detailsRes?.data;

  const { data: tableRes } = useGetTableDetailsQuery(
    orderData?.tableId as number,
    { skip: !orderData?.tableId || !orderId }
  );

  const order: Order | undefined = orderData
    ? {
        ...orderData,
        table: orderData.table || tableRes?.data || null,
      }
    : undefined;

  if (!orderId) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6 backdrop-blur-[2px]">
        <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl animate-pulse flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <div className="h-6 w-36 bg-slate-100 rounded" />
            <div className="h-5 w-16 bg-slate-100 rounded-full" />
          </div>
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-32 bg-slate-50 rounded-xl" />
          <div className="h-20 bg-slate-50 rounded-xl" />
          <div className="h-10 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }
  
    console.log(order)

  const handlePrint = () => {
    if (!order) return;

    let iframe = document.getElementById("print-invoice-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "print-invoice-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);
    }

    const htmlContent = generateInvoiceHtml(order, business);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 500);
    }
  };

  const handleDownload = () => {
    if (!order) return;

    const businessName = business?.name || "Y PoS";
    const businessLogo = business?.logoUrl || "";
    const businessAddress = business?.address || "";
    const businessPhone = business?.contact || "";
    const businessEmail = business?.email || "";
    const feedbackMsg = business?.feedbackMsg || "Everything is working well. The system looks clean and easy to use.,";

    const drawAll = (logoImg?: HTMLImageElement) => {
      const width = 380;
      const itemCount = order.orderItems?.length || 0;
      let choiceCount = 0;
      order.orderItems?.forEach(item => {
        if (item.packetChoices) {
          choiceCount += item.packetChoices.length;
        }
      });

      const hasTable = !!order.table;
      const baseHeight = hasTable ? 405 : 365;
      const listHeight = (itemCount * 28) + (choiceCount * 16);
      const adjustmentCount = order.pricingAdjustments?.length || 0;
      const footerHeight = 260 + (adjustmentCount - 2) * 18;
      const height = baseHeight + listHeight + footerHeight;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // 1. Draw Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Helper: Draw Dashed Line
      const drawDashedLine = (y: number) => {
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(360, y);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Helper: Draw Stool/Table Icon
      const drawTableIcon = (x: number, y: number) => {
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 5, 8, 3, 0, 0, 2 * Math.PI);
        ctx.moveTo(x + 10, y + 8);
        ctx.lineTo(x + 10, y + 17);
        ctx.moveTo(x + 5, y + 17);
        ctx.lineTo(x + 15, y + 17);
        ctx.stroke();
      };

      // Helper: Draw Coffee Cup Outline Logo
      const drawLogoFallback = (x: number, y: number) => {
        ctx.strokeStyle = "#2d3748";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x + 7, y + 2, 4, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 11, y - 4);
        ctx.lineTo(x + 7, y - 4);
        ctx.lineTo(x + 7, y + 6);
        ctx.arcTo(x + 7, y + 11, x - 11, y + 11, 4);
        ctx.lineTo(x - 11, y + 6);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 6, y - 8);
        ctx.lineTo(x - 6, y - 11);
        ctx.moveTo(x - 1, y - 8);
        ctx.lineTo(x - 1, y - 11);
        ctx.moveTo(x + 4, y - 8);
        ctx.lineTo(x + 4, y - 11);
        ctx.stroke();
      };

      // 2. Logo and Header details
      if (logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(190, 60, 30, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(logoImg, 160, 30, 60, 60);
        ctx.restore();
      } else {
        drawLogoFallback(190, 60);
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "#000000";
      ctx.font = "bold 20px 'Inter', -apple-system, sans-serif";
      ctx.fillText(businessName.toUpperCase(), 190, 112);

      ctx.fillStyle = "#64748b";
      ctx.font = "500 11px 'Inter', -apple-system, sans-serif";
      ctx.fillText(businessAddress, 190, 130);
      ctx.fillText(businessPhone, 190, 144);
      ctx.fillText(businessEmail, 190, 158);

      // 3. Receipt section
      drawDashedLine(175);
      ctx.fillStyle = "#000000";
      ctx.font = "bold italic 22px 'Georgia', serif";
      ctx.fillText("Receipt", 190, 198);
      drawDashedLine(212);

      // 4. Order Type container
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === "function") {
        (ctx as any).roundRect(20, 226, 340, 40, 8);
      } else {
        ctx.rect(20, 226, 340, 40);
      }
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#64748b";
      ctx.font = "700 11px 'Inter', -apple-system, sans-serif";
      ctx.fillText("ORDER TYPE", 34, 250);

      ctx.textAlign = "right";
      ctx.fillStyle = "#000000";
      ctx.font = "bold 13px 'Inter', -apple-system, sans-serif";
      const typeVal = order.type === 'DINE_IN' ? 'Dine In' : order.type === 'TAKEAWAY' ? 'Takeaway' : order.type;
      ctx.fillText(typeVal, 328, 250);

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(344, 246, 7, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(341, 246);
      ctx.lineTo(343, 248);
      ctx.lineTo(347, 244);
      ctx.stroke();

      // 5. Date, Order Number, Table Number
      ctx.textAlign = "left";
      ctx.fillStyle = "#64748b";
      ctx.font = "700 10px 'Inter', -apple-system, sans-serif";
      ctx.fillText("DATE", 24, 290);
      ctx.fillText("ORDER NUMBER", 210, 290);

      ctx.fillStyle = "#0f172a";
      ctx.font = "700 12px 'Inter', -apple-system, sans-serif";
      ctx.fillText(formatInvoiceDate(order.createdAt), 24, 307);

      // Document copy icon next to order slug
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(210, 299, 6, 6);
      ctx.strokeRect(212, 301, 6, 6);

      ctx.fillText(order.slug.toUpperCase(), 224, 307);

      let nextY = 322;
      if (order.table) {
        drawTableIcon(24, nextY + 6);

        ctx.fillStyle = "#64748b";
        ctx.font = "700 10px 'Inter', -apple-system, sans-serif";
        ctx.fillText("TABLE NUMBER", 48, nextY + 12);

        ctx.fillStyle = "#000000";
        ctx.font = "bold 15px 'Inter', -apple-system, sans-serif";
        ctx.fillText(order.table.tableNumber, 48, nextY + 28);
        nextY += 42;
      } else {
        nextY += 10;
      }

      drawDashedLine(nextY);

      // 6. Ordered Items
      nextY += 22;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 13px 'Inter', -apple-system, sans-serif";
      ctx.fillText("Ordered Items", 24, nextY);

      nextY += 10;
      order.orderItems?.forEach(item => {
        nextY += 24;
        ctx.fillStyle = "#000000";
        ctx.font = "bold 13px 'Inter', -apple-system, sans-serif";
        ctx.fillText(item.quantity + "x", 24, nextY);

        ctx.fillStyle = "#1e293b";
        ctx.font = "700 12.5px 'Inter', -apple-system, sans-serif";
        ctx.fillText(item.itemName.toUpperCase(), 50, nextY);

        const priceVal = Number(item.promoPrice || item.unitPrice) * item.quantity;
        const formattedPrice = formatInvoiceCurrency(priceVal);
        ctx.textAlign = "right";
        ctx.fillStyle = "#000000";
        ctx.font = "700 13px 'Inter', -apple-system, sans-serif";
        ctx.fillText(formattedPrice, 356, nextY);
        ctx.textAlign = "left";

        if (item.packetChoices && item.packetChoices.length > 0) {
          item.packetChoices.forEach(c => {
            nextY += 15;
            ctx.fillStyle = "#64748b";
            ctx.font = "500 10.5px 'Inter', -apple-system, sans-serif";
            const choiceName = c.choice || (c as any).item?.name || (c as any).choiceItem?.name || "";
            const choiceText = `${c.section}: ${c.quantity}x ${choiceName}`;
            ctx.fillText(choiceText, 50, nextY);
          });
        }
      });

      nextY += 15;
      drawDashedLine(nextY);

      // 7. Calculation summary
      const subtotal = Number(order.subtotal);
      const total = Number(order.totalAmount);

      const formattedSubtotal = formatInvoiceCurrency(subtotal);
      const formattedTotal = formatInvoiceCurrency(total);

      const menuSuffix = itemCount === 1 ? "1 menu" : `${itemCount} menu`;
      const paymentMethod = order.payment?.[0]?.method || "CASH";

      nextY += 22;
      ctx.fillStyle = "#475569";
      ctx.font = "500 12.5px 'Inter', -apple-system, sans-serif";
      ctx.fillText(`Subtotal (${menuSuffix})`, 24, nextY);
      ctx.textAlign = "right";
      ctx.fillText(formattedSubtotal, 356, nextY);
      ctx.textAlign = "left";

      order.pricingAdjustments?.forEach(adj => {
        nextY += 18;
        const amount = adj.type === "PERCENTAGE"
          ? (subtotal * Number(adj.percentage || 0)) / 100
          : Number(adj.fixedAmount);
        const isNegative = amount < 0;
        const formattedVal = formatInvoiceCurrency(Math.abs(amount));
        const sign = isNegative ? "-" : "+";
        const label = `${adj.level}${adj.type === "PERCENTAGE" ? ` (${adj.percentage}%)` : ""}`;

        ctx.fillStyle = "#475569";
        ctx.font = "500 12.5px 'Inter', -apple-system, sans-serif";
        ctx.fillText(label, 24, nextY);
        ctx.textAlign = "right";
        ctx.fillText(`${sign}${formattedVal}`, 356, nextY);
        ctx.textAlign = "left";
      });

      nextY += 18;
      ctx.fillStyle = "#475569";
      ctx.font = "500 12.5px 'Inter', -apple-system, sans-serif";
      ctx.fillText("Payment Method", 24, nextY);
      ctx.textAlign = "right";
      ctx.fillStyle = "#000000";
      ctx.font = "bold 12.5px 'Inter', -apple-system, sans-serif";
      ctx.fillText(paymentMethod.toUpperCase(), 356, nextY);
      ctx.textAlign = "left";

      nextY += 12;
      drawDashedLine(nextY);

      nextY += 24;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 15px 'Inter', -apple-system, sans-serif";
      ctx.fillText("Total", 24, nextY);
      ctx.textAlign = "right";
      ctx.font = "bold 15px 'Inter', -apple-system, sans-serif";
      ctx.fillText(formattedTotal, 356, nextY);
      ctx.textAlign = "left";

      nextY += 16;
      drawDashedLine(nextY);

      // 8. Feedback card representation
      nextY += 18;
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === "function") {
        (ctx as any).roundRect(24, nextY, 332, 48, 12);
      } else {
        ctx.rect(24, nextY, 332, 48);
      }
      ctx.stroke();

      ctx.fillStyle = "#fff6f0";
      ctx.beginPath();
      ctx.arc(52, nextY + 23, 16, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = "16px 'Inter', -apple-system, sans-serif";
      ctx.fillText("👍", 44, nextY + 28);

      ctx.fillStyle = "#1e293b";
      ctx.font = "600 11.5px 'Inter', -apple-system, sans-serif";

      // Wrap the text dynamically
      const maxFeedbackWidth = 250;
      const words = feedbackMsg.split(" ");
      let line = "";
      let feedbackLines = [];
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxFeedbackWidth && n > 0) {
          feedbackLines.push(line);
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      feedbackLines.push(line);

      if (feedbackLines.length === 1) {
        ctx.fillText(feedbackLines[0], 78, nextY + 27);
      } else {
        ctx.fillText(feedbackLines[0], 78, nextY + 20);
        ctx.fillText(feedbackLines[1], 78, nextY + 33);
      }

      try {
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `Invoice-${order.slug}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } catch (err) {
        console.error("Canvas export failed", err);
      }
    };

    if (businessLogo) {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = businessLogo;
      logoImg.onload = () => {
        drawAll(logoImg);
      };
      logoImg.onerror = () => {
        drawAll();
      };
    } else {
      drawAll();
    }
  };

  if (!order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6 backdrop-blur-[2px]">
        <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
          <p className="text-slate-500 font-medium">{t("noOrdersFound")}</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "PENDING_PROCESSING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PROCESSING":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "READY":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PICKED_UP":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const hasPacketChoices = (choices: any) => {
    return Array.isArray(choices) && choices.length > 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6 backdrop-blur-[2px]">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="border-b border-slate-100 pb-3 pr-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[22px] font-bold text-slate-900">
              {order.slug}
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${getStatusBadgeClass(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t("subtitle") || "Order details details details"}
          </p>
        </div>

        {/* Order Info Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-xl border border-slate-100 p-2.5 bg-slate-50/30">
            <p className="text-slate-400 font-bold uppercase tracking-wider">{t("customer")}</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{order.customerName || "Guest"}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-2.5 bg-slate-50/30">
            <p className="text-slate-400 font-bold uppercase tracking-wider">{t("table")}</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {order?.table ? `#${order.table.tableNumber}` : "No Table"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-2.5 bg-slate-50/30">
            <p className="text-slate-400 font-bold uppercase tracking-wider">{t("source")}</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{order.source}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-2.5 bg-slate-50/30">
            <p className="text-slate-400 font-bold uppercase tracking-wider">{t("type")}</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{order.type}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/30">
          <div className="flex items-center gap-2 mb-3 text-slate-600 font-bold text-xs uppercase tracking-wider">
            <ShoppingBag size={14} />
            <span>{t("items")}</span>
          </div>

          {order.orderItems && order.orderItems.length > 0 ? (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {order.orderItems.map((item, idx) => (
                <div key={item.id || idx} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {item.itemName}
                      </span>
                      <span className="text-slate-400 text-xs ml-1.5 font-medium">
                        x{item.quantity}
                      </span>
                      {item.productionStation && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-600 ml-2">
                          <MapPin size={8} />
                          {item.productionStation.name}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(Number(item.promoPrice || item.unitPrice) * item.quantity)}
                    </span>
                  </div>

                  {/* Packet Choices */}
                  {hasPacketChoices(item.packetChoices) && (
                    <div className="mt-1 ml-3 pl-2 border-l-2 border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {t("packetChoices") || "Combo Selections"}
                      </p>
                      <div className="space-y-0.5">
                        {item.packetChoices?.map((choice, cIdx) => {
                          const choiceName = choice.choice || (choice as any).item?.name || (choice as any).choiceItem?.name || "";
                          return (
                            <p key={cIdx} className="text-xs text-slate-500">
                              {choice.section}: <span className="font-medium text-slate-700">{choice.quantity}x {choiceName}</span>
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">{t("noItems")}</p>
          )}
        </div>

        {/* Payment Summary */}
        <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/30">
          <div className="flex items-center gap-2 mb-3 text-slate-600 font-bold text-xs uppercase tracking-wider">
            <CreditCard size={14} />
            <span>{t("payment")}</span>
          </div>

          {order.payment && order.payment.length > 0 ? (
            <div className="space-y-2">
              {order.payment.map((pay, idx) => (
                <div key={pay.id || idx} className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between col-span-2 border-b border-slate-100 pb-1.5 mb-1 text-sm font-semibold">
                    <span className="text-slate-500">Method</span>
                    <span className="text-slate-800">{pay.method}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t("paymentStatus")}:</span>
                    <span className="ml-1.5 font-bold text-slate-700">{pay.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Paid At:</span>
                    <span className="ml-1.5 font-semibold text-slate-700">
                      {pay.paidAt ? new Date(pay.paidAt).toLocaleString() : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-1">{t("noPayment")}</p>
          )}

          {/* Totals */}
          <div className="mt-3.5 pt-3.5 border-t border-dashed border-slate-200 space-y-1.5 text-sm">
            <div className="flex justify-between items-center text-slate-600 font-bold text-xs uppercase tracking-wider mb-2">
              <span>Totals</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{t("subtotal")}</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.pricingAdjustments?.map((adj, index) => {
              const amount = adj.type === "PERCENTAGE"
                ? (Number(order.subtotal) * Number(adj.percentage || 0)) / 100
                : Number(adj.fixedAmount);
              const isNegative = amount < 0;
              const formattedValue = formatCurrency(Math.abs(amount));
              return (
                <div key={adj.id || `adj-${index}`} className="flex justify-between text-slate-500">
                  <span>
                    {adj.level}
                    {adj.type === "PERCENTAGE" && ` (${adj.percentage}%)`}
                  </span>
                  <span>{isNegative ? `-${formattedValue}` : `+${formattedValue}`}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-[16px] font-bold text-slate-900">
              <span>{t("total")}</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-xs text-slate-500 bg-slate-50/20 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-slate-400" />
              <span>{t("createdAt")}: {new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.table && order.table.notes && (
              <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                <ClipboardList size={12} className="text-slate-400" />
                <span className="truncate max-w-40" title={order.table.notes}>
                  {t("notes")}: {order.table.notes}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold cursor-pointer shadow-sm transition-colors"
              title="Print Receipt"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold cursor-pointer shadow-sm transition-colors"
              title="Download Receipt"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrderDetailsModal;