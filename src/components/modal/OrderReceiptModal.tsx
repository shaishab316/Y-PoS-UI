"use client";
import React, { useRef, useState, useEffect } from "react";
import { X, Copy, Download, Check, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Image from "next/image";
import {
  useGetOrderDetailsQuery,
} from "@/redux/features/order/order.api";
import { useGetBusinessInformationQuery } from "@/redux/features/dashboard/dashboard.api";

const formatInvoiceCurrency = (value: string | number) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "Rp 0";
  return `Rp ${numericValue.toLocaleString("en-US")}`;
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

const generateInvoiceInnerHtml = (order: any, business: any) => {
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
  const isPaid = order.payment?.some((p: any) => p.status === "PAID");
  const unpaidHtml = !isPaid ? `
    <div class="totals-row" style="color: #dc2626; font-weight: 700;">
      <span>Payment Status</span>
      <span>UNPAID</span>
    </div>
  ` : "";

  const adjustmentsHtml = order.pricingAdjustments?.map((adj: any) => {
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

  const itemsHtml = order.orderItems?.map((item: any) => {
    const priceVal = Number(item.promoPrice || item.unitPrice) * item.quantity;
    const formattedPrice = formatInvoiceCurrency(priceVal);

    let choicesHtml = "";
    if (item.packetChoices && item.packetChoices.length > 0) {
      choicesHtml = `
        <div class="item-choices">
          ${item.packetChoices.map((c: any) => `${c.section}: ${c.choice || c.item?.name || c.choiceItem?.name || ''}${c.quantity > 1 ? ` x${c.quantity}` : ''}`).join('<br/>')}
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
      ${unpaidHtml}
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

const generateInvoiceHtml = (order: any, business: any) => {
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

interface OrderReceiptModalProps {
  orderId: number | null;
  onClose: () => void;
}

const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  orderId,
  onClose,
}) => {
  const t = useTranslations("Order");
  const modalRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: orderRes, isLoading: isOrderLoading } = useGetOrderDetailsQuery(
    orderId,
    { skip: !orderId }
  );
  const { data: businessRes, isLoading: isBusinessLoading } =
    useGetBusinessInformationQuery(undefined);

  const order = orderRes?.data;
  const business = businessRes?.data;

  // Preload business logo image for canvas export
  const [businessLogoImg, setBusinessLogoImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (business?.logoUrl) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = business.logoUrl;
      img.onload = () => {
        setBusinessLogoImg(img);
      };
      img.onerror = () => {
        console.error("Failed to load business logo for canvas download.");
      };
    }
  }, [business?.logoUrl]);

  if (!orderId) return null;

  if (isOrderLoading || isBusinessLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]">
        <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <div className="h-6 w-32 bg-slate-100 rounded" />
            <div className="h-9 w-9 bg-slate-100 rounded-full" />
          </div>
          <div className="h-4 bg-slate-100 rounded w-2/3 mx-auto" />
          <div className="h-40 bg-slate-50 rounded-2xl" />
          <div className="h-32 bg-slate-50 rounded-2xl" />
          <div className="h-12 bg-slate-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]">
        <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl border border-slate-105 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100 text-slate-400"
          >
            <X size={16} />
          </button>
          <p className="text-slate-500 font-semibold py-8">Order not found.</p>
        </div>
      </div>
    );
  }

  // Format currency with id-ID locale (dots for thousands, comma for decimals)
  const formatReceiptCurrency = (value: string | number) => {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numericValue)) return "Rp0";
    return (
      "Rp" +
      numericValue.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  // Calculations
  const subtotalVal = Number(order.subtotal);
  const totalVal = Number(order.totalAmount);

  const menuCount = order.orderItems?.length || 0;
  const menuSuffix = menuCount === 1 ? "1 menu" : `${menuCount} menu`;
  const isPaid = order.payment?.some((payment) => payment.status === "PAID");

  const handleCopySlug = () => {
    navigator.clipboard.writeText(order.slug);
    toast.success("Order Number copied to clipboard!");
  };

  const handleDownloadPNG = () => {
    // Calculate feedback text lines first using a dummy canvas context to set height
    const dummyCanvas = document.createElement("canvas");
    const dummyCtx = dummyCanvas.getContext("2d");
    let feedbackLinesCount = 1;
    const feedbackText = business?.feedbackMsg || "Let's give feedback on our service!";

    if (dummyCtx) {
      dummyCtx.font = "bold 11px 'Inter', -apple-system, sans-serif";
      const words = feedbackText.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      const maxWidth = 260;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? currentLine + " " + word : word;
        const metrics = dummyCtx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      feedbackLinesCount = Math.max(1, lines.length);
    }

    const feedbackBoxHeight = feedbackLinesCount === 1 ? 48 : (feedbackLinesCount * 14 + 18);

    const width = 385;
    const itemCount = order.orderItems?.length || 0;
    let choiceCount = 0;
    order.orderItems?.forEach((item) => {
      if (item.packetChoices) {
        choiceCount += item.packetChoices.length;
      }
    });

    const hasTable = order.type === "DINE_IN" && order.table;
    const baseHeight = hasTable ? 425 : 380;
    const listHeight = itemCount * 30 + choiceCount * 18;

    const adjustmentCount = order.pricingAdjustments?.length || 0;
    const extraRows = adjustmentCount + (isPaid ? 0 : 1);
    const footerHeight = 165 + (extraRows - 3) * 18 + feedbackBoxHeight;
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
      ctx.lineTo(365, y);
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
    // Helper: Draw Coffee Cup Outline Logo or Owner Image
    const drawLogo = (x: number, y: number) => {
      if (businessLogoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(businessLogoImg, x - 26, y - 26, 52, 52);
        ctx.restore();

        // Also draw the circular border
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
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
      }
    };

    // 2. Logo and Header details
    drawLogo(192, 60);

    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 20px 'Inter', -apple-system, sans-serif";
    ctx.fillText((business?.name || "Y PoS").toUpperCase(), 192, 112);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 11px 'Inter', -apple-system, sans-serif";

    // Split address by length to draw beautifully
    const address = business?.address || "Store Address";
    if (address.length > 38) {
      ctx.fillText(address.substring(0, 38) + "...", 192, 130);
    } else {
      ctx.fillText(address, 192, 130);
    }
    ctx.fillText(business?.contact || "+62 ...", 192, 144);
    ctx.fillText(business?.email || "info@store.id", 192, 158);

    // 3. Receipt section
    drawDashedLine(175);
    ctx.fillStyle = "#000000";
    ctx.font = "bold italic 22px 'Georgia', serif";
    ctx.fillText("Receipt", 192, 198);
    drawDashedLine(212);

    // 4. Order Type container
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(20, 226, 345, 40, 12);
    } else {
      ctx.rect(20, 226, 345, 40);
    }
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#64748b";
    ctx.font = "600 11px 'Inter', -apple-system, sans-serif";
    ctx.fillText("ORDER TYPE", 34, 250);

    ctx.textAlign = "right";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 13px 'Inter', -apple-system, sans-serif";
    const typeLabelText = order.type === "DINE_IN" ? "Dine In" : "Takeaway";
    ctx.fillText(typeLabelText, 324, 250);

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(341, 246, 7, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(338, 246);
    ctx.lineTo(340, 248);
    ctx.lineTo(344, 244);
    ctx.stroke();

    // 5. Date, Order Number, Table Number
    ctx.textAlign = "left";
    ctx.fillStyle = "#64748b";
    ctx.font = "600 11px 'Inter', -apple-system, sans-serif";
    ctx.fillText("DATE", 24, 290);
    ctx.fillText("ORDER NUMBER", 210, 290);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px 'Inter', -apple-system, sans-serif";
    ctx.fillText(formatDate(order.createdAt), 24, 307);

    ctx.font = "extrabold 12px 'Inter', -apple-system, sans-serif";
    ctx.fillText(order.slug.toUpperCase(), 222, 307);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(210, 299, 7, 7);
    ctx.strokeRect(212, 301, 7, 7);

    let nextY = 322;
    if (hasTable && order.table) {
      drawTableIcon(24, nextY + 6);

      ctx.fillStyle = "#64748b";
      ctx.font = "600 11px 'Inter', -apple-system, sans-serif";
      ctx.fillText("TABLE NUMBER", 48, nextY + 12);

      ctx.fillStyle = "#000000";
      ctx.font = "black 18px 'Inter', -apple-system, sans-serif";
      ctx.fillText(order.table.tableNumber, 48, nextY + 28);
      nextY += 42;
    } else {
      nextY += 10;
    }

    drawDashedLine(nextY);

    // 6. Ordered Items
    nextY += 22;
    ctx.fillStyle = "#000000";
    ctx.font = "extrabold 13px 'Inter', -apple-system, sans-serif";
    ctx.fillText("Ordered Items", 24, nextY);

    nextY += 10;
    order.orderItems?.forEach((item) => {
      nextY += 24;
      ctx.fillStyle = "#000000";
      ctx.font = "extrabold 13px 'Inter', -apple-system, sans-serif";
      ctx.fillText(item.quantity + "x", 24, nextY);

      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13px 'Inter', -apple-system, sans-serif";
      ctx.fillText(item.itemName.toUpperCase(), 50, nextY);

      const priceVal =
        Number(item.promoPrice || item.unitPrice) * item.quantity;
      const formattedPrice = formatReceiptCurrency(priceVal);
      ctx.textAlign = "right";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px 'Inter', -apple-system, sans-serif";
      ctx.fillText(formattedPrice, 360, nextY);
      ctx.textAlign = "left";

      if (item.packetChoices && item.packetChoices.length > 0) {
        item.packetChoices.forEach((c) => {
          nextY += 15;
          ctx.fillStyle = "#64748b";
          ctx.font = "500 11px 'Inter', -apple-system, sans-serif";
          const choiceText = `${c.section}: ${c.choice || (c as any).item?.name || (c as any).choiceItem?.name || ''}${c.quantity > 1 ? ` x${c.quantity}` : ""
            }`;
          ctx.fillText(choiceText, 50, nextY);
        });
      }
    });

    nextY += 18;
    drawDashedLine(nextY);

    // 7. Calculations Summary
    nextY += 22;
    ctx.fillStyle = "#475569";
    ctx.font = "500 13px 'Inter', -apple-system, sans-serif";
    ctx.fillText(`Subtotal (${menuSuffix})`, 24, nextY);
    ctx.textAlign = "right";
    ctx.fillText(formatReceiptCurrency(subtotalVal), 360, nextY);
    ctx.textAlign = "left";

    order.pricingAdjustments?.forEach((adj: any) => {
      nextY += 18;
      const amount = adj.type === "PERCENTAGE"
        ? (subtotalVal * Number(adj.percentage || 0)) / 100
        : Number(adj.fixedAmount);
      const isNegative = amount < 0;
      const formattedVal = formatReceiptCurrency(Math.abs(amount));
      const sign = isNegative ? "-" : "+";
      const label = `${adj.level}${adj.type === "PERCENTAGE" ? ` (${adj.percentage}%)` : ""}`;

      ctx.fillStyle = "#475569";
      ctx.font = "500 13px 'Inter', -apple-system, sans-serif";
      ctx.fillText(label, 24, nextY);
      ctx.textAlign = "right";
      ctx.fillText(`${sign}${formattedVal}`, 360, nextY);
      ctx.textAlign = "left";
    });

    if (!isPaid) {
      nextY += 18;
      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 13px 'Inter', -apple-system, sans-serif";
      ctx.fillText("Payment Status", 24, nextY);
      ctx.textAlign = "right";
      ctx.fillText("UNPAID", 360, nextY);
      ctx.textAlign = "left";
    }

    nextY += 12;
    drawDashedLine(nextY);

    nextY += 24;
    ctx.fillStyle = "#000000";
    ctx.font = "bold 15px 'Inter', -apple-system, sans-serif";
    ctx.fillText("Total", 24, nextY);
    ctx.textAlign = "right";
    ctx.font = "extrabold 15px 'Inter', -apple-system, sans-serif";
    ctx.fillText(formatReceiptCurrency(totalVal), 360, nextY);
    ctx.textAlign = "left";

    nextY += 16;
    drawDashedLine(nextY);

    // 8. Feedback Box Representation
    nextY += 18;
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(24, nextY, 337, feedbackBoxHeight, 12);
    } else {
      ctx.rect(24, nextY, 337, feedbackBoxHeight);
    }
    ctx.stroke();

    const avatarCenterY = nextY + (feedbackBoxHeight / 2);
    ctx.fillStyle = "#fff5f0";
    ctx.beginPath();
    ctx.arc(52, avatarCenterY, 14, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = "14px 'Inter', -apple-system, sans-serif";
    ctx.fillText("👍", 45, avatarCenterY + 5);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 11px 'Inter', -apple-system, sans-serif";

    // Draw wrapped lines centered vertically
    const words = feedbackText.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    const maxWidth = 260;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? currentLine + " " + word : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    if (lines.length === 1) {
      ctx.fillText(lines[0], 74, nextY + (feedbackBoxHeight / 2) + 4);
    } else {
      const startY = nextY + (feedbackBoxHeight / 2) - ((lines.length - 1) * 14 / 2) + 4;
      lines.forEach((line, index) => {
        ctx.fillText(line, 74, startY + (index * 14));
      });
    }

    try {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Receipt-${order.slug.toUpperCase()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success("Receipt downloaded successfully!");
    } catch (err) {
      console.error("Canvas export failed", err);
      toast.error("Failed to export receipt image.");
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px] overflow-y-auto">
      <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            Order Receipt
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-y-auto py-4 px-1 select-none">
          <div
            ref={modalRef}
            className="w-full bg-white mx-auto text-slate-900 flex flex-col font-sans"
            style={{ maxWidth: "370px" }}
          >
            {/* Business Details Header */}
            <div className="flex items-start">
              <div className="relative size-14 rounded-full border border-slate-900 flex items-center justify-center overflow-hidden shrink-0 bg-slate-50">
                {business?.logoUrl ? (
                  <Image
                    src={business.logoUrl}
                    alt={business.name || "Logo"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2d3748"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-7 text-slate-800"
                  >
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
                    <line x1="6" y1="2" x2="6" y2="4"></line>
                    <line x1="10" y1="2" x2="10" y2="4"></line>
                    <line x1="14" y1="2" x2="14" y2="4"></line>
                  </svg>
                )}
              </div>
              <div className="ml-4 flex-1">
                <h4 className="font-extrabold text-[15px] tracking-wide text-slate-950 uppercase leading-snug">
                  {business?.name || "Y PoS"}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5 whitespace-pre-line">
                  {business?.address || "Address info placeholder"}
                  {"\n"}
                  {business?.contact || "Phone info placeholder"}
                  {"\n"}
                  {business?.email || "Email info placeholder"}
                </p>
              </div>
            </div>

            {/* Dotted divider */}
            <div className="border-t border-dashed border-slate-300 my-4 h-0" />
            <h2 className="text-center font-serif text-[22px] font-bold text-slate-950 italic tracking-wide">
              Receipt
            </h2>
            <div className="border-t border-dashed border-slate-300 my-4 h-0" />

            {/* Order Type Badge */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex justify-between items-center mb-4">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Order Type
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900">
                  {order.type === "DINE_IN" ? "Dine In" : "Takeaway"}
                </span>
                <span className="bg-green-600 rounded-full text-white size-4.5 flex items-center justify-center shadow-sm">
                  <Check size={11} strokeWidth={3} />
                </span>
              </div>
            </div>

            {/* Meta Grid (Date & Order Number) */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-4 mb-4 text-xs">
              <div>
                <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Date
                </span>
                <span className="text-slate-800 font-bold">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Order Number
                </span>
                <button
                  type="button"
                  onClick={handleCopySlug}
                  className="text-slate-900 font-extrabold flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors uppercase select-text"
                >
                  <Copy size={11} className="text-slate-400" />
                  {order.slug}
                </button>
              </div>

              {/* Table Number - Dine In Only */}
              {order.type === "DINE_IN" && order.table && (
                <div className="col-span-2 flex items-start gap-3 mt-1 pt-3 border-t border-slate-200/50">
                  <div className="text-slate-900 mt-0.5">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9h12" />
                      <path d="M12 9v9" />
                      <path d="M8 18h8" />
                      <path d="M3 5h18a2 2 0 0 1 2 2v2H1v-2a2 2 0 0 1 2-2Z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                      Table Number
                    </span>
                    <span className="text-[20px] font-black text-slate-950 leading-none">
                      {order.table.tableNumber}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Dotted divider */}
            <div className="border-t border-dashed border-slate-300 my-4 h-0" />

            {/* Ordered Items List */}
            <h3 className="text-sm font-extrabold text-slate-950 mb-3 uppercase tracking-wider">
              Ordered Items
            </h3>
            <div className="space-y-4">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex items-start gap-2.5 max-w-[72%]">
                    <span className="font-extrabold text-slate-950 text-sm min-w-6">
                      {item.quantity}x
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                        {item.itemName}
                      </span>
                      {item.packetChoices && item.packetChoices.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                          {item.packetChoices.map((choice, cidx) => (
                            <div key={cidx} className="font-medium">
                              • {choice.section}: {choice.choice || (choice as any).item?.name || (choice as any).choiceItem?.name || ""}
                              {choice.quantity > 1 ? ` x${choice.quantity}` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-slate-950 text-sm text-right flex-1 pl-2">
                    {formatReceiptCurrency(
                      Number(item.promoPrice || item.unitPrice) * item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Dotted divider */}
            <div className="border-t border-dashed border-slate-300 my-5 h-0" />

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-sm text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal ({menuSuffix})</span>
                <span className="text-slate-900 font-semibold">
                  {formatReceiptCurrency(subtotalVal)}
                </span>
              </div>
              {order.pricingAdjustments?.map((adj) => {
                const amount = adj.type === "PERCENTAGE"
                  ? (subtotalVal * Number(adj.percentage || 0)) / 100
                  : Number(adj.fixedAmount);
                const isNegative = amount < 0;
                const formattedValue = formatReceiptCurrency(Math.abs(amount));
                return (
                  <div key={adj.id} className="flex justify-between">
                    <span>
                      {adj.level}
                      {adj.type === "PERCENTAGE" && ` (${adj.percentage}%)`}
                    </span>
                    <span className="text-slate-900 font-semibold">
                      {isNegative ? `-${formattedValue}` : `+${formattedValue}`}
                    </span>
                  </div>
                );
              })}

              {!isPaid && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Payment Status</span>
                  <span>UNPAID</span>
                </div>
              )}

              {/* Total Row */}
              <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between items-center mt-4">
                <span className="text-base font-extrabold text-slate-950">
                  Total
                </span>
                <span className="text-base font-black text-slate-950">
                  {formatReceiptCurrency(totalVal)}
                </span>
              </div>
            </div>

            {/* Dotted divider */}
            <div className="border-t border-dashed border-slate-300 my-4 h-0" />

            {/* Feedback Box */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-2 bg-white shadow-sm">
              <div className="p-4 flex items-center gap-3 bg-white">
                <div className="size-10 rounded-full bg-orange-50 flex items-center justify-center text-lg select-none">
                  👍
                </div>
                <div className="text-xs font-bold text-slate-800 leading-snug">
                  {business?.feedbackMsg || "Let's give feedback on our service!"}
                </div>
              </div>
              {/* <button
                type="button"
                className="w-full py-3 text-center text-xs font-bold text-slate-900 border-t border-slate-100 hover:bg-slate-50 transition-colors bg-white cursor-pointer"
              >
                Give Feedback
              </button> */}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 cursor-pointer"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex whitespace-nowrap px-2 items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Download size={16} />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReceiptModal;