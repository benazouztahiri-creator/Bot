import { getDb } from "./db";
import { updateOrderStatus, Order } from "./orders";
import { createNotification, logAuditEvent } from "./auth";
import crypto from "crypto";

function debugLog(step: string, data?: Record<string, unknown>): void {
  if (process.env.DEBUG_PAYMENT || process.env.NODE_ENV === "development") {
    console.log(`[PAYMENT_DEBUG] [${new Date().toISOString()}] [${step}]`, data ? JSON.stringify(data, null, 2) : "");
  }
}

export type WebhookPayload = {
  id: string;
  from: string;
  text: string;
  created_at: string;
  message_id: string;
  last_event: string;
  headers: {
    received: string;
    "authentication-results": string;
    "x-ses-spam-verdict": string;
    "x-ses-virus-verdict": string;
  };
};

export type EmailLog = {
  id: string;
  sender: string;
  subject: string;
  body_text: string;
  body_html: string;
  raw_from: string;
  extracted_amount: number | null;
  extracted_transaction_id: string;
  extracted_target_account: string;
  extracted_currency: string;
  message_id: string;
  received_at: string;
  processed: number;
  created_at: string;
  webhook_id: string;
  webhook_created_at: string;
  webhook_message_id: string;
  webhook_last_event: string;
  headers_received: string;
  headers_authentication_results: string;
  security_spf: string;
  security_dkim: string;
  security_dmarc: string;
  security_spam_verdict: string;
  security_virus_verdict: string;
};

export type UnmatchedPayment = {
  id: string;
  email_log_id: string;
  transaction_id: string;
  amount: number | null;
  currency: string;
  target_account: string;
  email_sender: string;
  email_subject: string;
  email_body: string;
  reviewed: number;
  resolved_order_id: string | null;
  notes: string;
  created_at: string;
  reviewed_at: string | null;
};

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

export async function saveEmailLog(params: {
  sender: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  rawFrom: string;
  amount: number | null;
  transactionId: string;
  targetAccount: string;
  currency: string;
  messageId: string;
  webhookId: string;
  webhookCreatedAt: string;
  webhookMessageId: string;
  webhookLastEvent: string;
  headersReceived: string;
  headersAuthResults: string;
  securitySpf: string;
  securityDkim: string;
  securityDmarc: string;
  securitySpamVerdict: string;
  securityVirusVerdict: string;
}): Promise<EmailLog> {
  const { queryOne } = await getDb();
  const id = generateId("eml");
  await queryOne(
    `INSERT INTO email_logs
      (id, sender, subject, body_text, body_html, raw_from,
       extracted_amount, extracted_transaction_id, extracted_target_account, extracted_currency,
       message_id,
       webhook_id, webhook_created_at, webhook_message_id, webhook_last_event,
       headers_received, headers_authentication_results,
       security_spf, security_dkim, security_dmarc,
       security_spam_verdict, security_virus_verdict)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
    [id, params.sender, params.subject, params.bodyText, params.bodyHtml, params.rawFrom,
     params.amount, params.transactionId, params.targetAccount, params.currency,
     params.messageId,
     params.webhookId, params.webhookCreatedAt, params.webhookMessageId, params.webhookLastEvent,
     params.headersReceived, params.headersAuthResults,
     params.securitySpf, params.securityDkim, params.securityDmarc,
     params.securitySpamVerdict, params.securityVirusVerdict]
  );
  const log = await queryOne<EmailLog>("SELECT * FROM email_logs WHERE id = $1", [id]);
  debugLog("EMAIL_LOG_SAVED", { id, transactionId: params.transactionId, amount: params.amount, sender: params.sender });
  return log!;
}

export async function markEmailProcessed(id: string): Promise<void> {
  const { execute } = await getDb();
  await execute("UPDATE email_logs SET processed = 1 WHERE id = $1", [id]);
  debugLog("EMAIL_MARKED_PROCESSED", { id });
}

export async function saveUnmatchedPayment(params: {
  emailLogId: string;
  transactionId: string;
  amount: number | null;
  currency: string;
  targetAccount: string;
  emailSender: string;
  emailSubject: string;
  emailBody: string;
}): Promise<UnmatchedPayment> {
  const { queryOne } = await getDb();
  const id = generateId("unm");
  await queryOne(
    `INSERT INTO unmatched_payments (id, email_log_id, transaction_id, amount, currency, target_account, email_sender, email_subject, email_body)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [id, params.emailLogId, params.transactionId, params.amount, params.currency, params.targetAccount, params.emailSender, params.emailSubject, params.emailBody]
  );
  const saved = await queryOne<UnmatchedPayment>("SELECT * FROM unmatched_payments WHERE id = $1", [id]);
  debugLog("UNMATCHED_PAYMENT_SAVED", { id, transactionId: params.transactionId, amount: params.amount });
  return saved!;
}

function findNumberInText(text: string, label: string): string | null {
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.toLowerCase().includes(label.toLowerCase())) {
      const match = line.match(/[\d,.]+/);
      if (match) return match[0].replace(/,/g, "");
    }
  }
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const globalMatch = text.match(new RegExp(`${escaped}[\\s:]*([\\d,.]+)`, "i"));
  if (globalMatch) return globalMatch[1].replace(/,/g, "");
  return null;
}

function findValueAfterLabel(text: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.toLowerCase().includes(label.toLowerCase())) {
      const afterLabel = line.replace(new RegExp(`.*${escaped}\\s*[:\\s]*`, "i"), "").trim();
      if (afterLabel) return afterLabel;
    }
  }
  const match = text.match(new RegExp(`${escaped}[\\s:]*([^\\n]+)`, "i"));
  if (match) return match[1].trim();
  return null;
}

export function parseBaridiMobEmail(bodyText: string): {
  amount: number | null;
  transactionId: string;
  targetAccount: string;
  currency: string;
} {
  debugLog("PARSING_EMAIL_TEXT", { textLength: bodyText.length, preview: bodyText.slice(0, 300) });

  let amount: number | null = null;
  let transactionId = "";
  let targetAccount = "";
  let currency = "DZD";

  const amountStr = findNumberInText(bodyText, "Amount") || findNumberInText(bodyText, "Montant") || findNumberInText(bodyText, "المبلغ");
  if (amountStr) {
    amount = parseFloat(amountStr);
    debugLog("AMOUNT_EXTRACTED", { raw: amountStr, parsed: amount });
  } else {
    debugLog("AMOUNT_NOT_FOUND", {});
  }

  const txId = findValueAfterLabel(bodyText, "Transaction ID") || findValueAfterLabel(bodyText, "Transaction") || findValueAfterLabel(bodyText, "Identifiant") || findValueAfterLabel(bodyText, "رقم المعاملة");
  if (txId) {
    transactionId = txId;
    debugLog("TRANSACTION_ID_EXTRACTED", { transactionId });
  } else {
    debugLog("TRANSACTION_ID_NOT_FOUND", {});
  }

  const account = findValueAfterLabel(bodyText, "Target account") || findValueAfterLabel(bodyText, "Account") || findValueAfterLabel(bodyText, "Compte") || findValueAfterLabel(bodyText, "Compte cible") || findValueAfterLabel(bodyText, "رقم الحساب") || findValueAfterLabel(bodyText, "حساب");
  if (account) {
    targetAccount = account;
    debugLog("TARGET_ACCOUNT_EXTRACTED", { targetAccount });
  }

  const curr = findValueAfterLabel(bodyText, "Currency") || findValueAfterLabel(bodyText, "Devise") || findValueAfterLabel(bodyText, "العملة");
  if (curr) currency = curr;

  debugLog("PARSE_RESULT", { amount, transactionId, targetAccount, currency });
  return { amount, transactionId, targetAccount, currency };
}

export function extractSecurityVerdict(authResults: string, mechanism: string): string {
  const regex = new RegExp(`${mechanism}=([a-zA-Z]+)`, "i");
  const match = authResults.match(regex);
  return match ? match[1].toLowerCase() : "";
}

export function validateWebhookSecurity(payload: WebhookPayload): {
  valid: boolean;
  reason?: string;
} {
  debugLog("VALIDATING_SECURITY", {
    from: payload.from,
    authResults: payload.headers?.["authentication-results"],
    spamVerdict: payload.headers?.["x-ses-spam-verdict"],
    virusVerdict: payload.headers?.["x-ses-virus-verdict"],
  });

  if (payload.from?.toLowerCase() !== "baridimob@poste.dz") {
    const reason = `Invalid sender: ${payload.from}`;
    debugLog("SECURITY_FAILED", { reason });
    return { valid: false, reason };
  }
  debugLog("SENDER_VERIFIED", {});

  const authResults = payload.headers?.["authentication-results"] || "";
  const spf = extractSecurityVerdict(authResults, "spf");
  const dkim = extractSecurityVerdict(authResults, "dkim");
  const dmarc = extractSecurityVerdict(authResults, "dmarc");

  debugLog("AUTH_RESULTS_PARSED", { spf, dkim, dmarc, raw: authResults.slice(0, 200) });

  if (spf !== "pass") {
    return { valid: false, reason: `SPF verification failed: ${spf}` };
  }
  if (dkim !== "pass") {
    return { valid: false, reason: `DKIM verification failed: ${dkim}` };
  }
  if (dmarc !== "pass") {
    return { valid: false, reason: `DMARC verification failed: ${dmarc}` };
  }

  const spamVerdict = payload.headers?.["x-ses-spam-verdict"] || "";
  if (spamVerdict !== "PASS") {
    return { valid: false, reason: `Spam verdict: ${spamVerdict}` };
  }

  const virusVerdict = payload.headers?.["x-ses-virus-verdict"] || "";
  if (virusVerdict !== "PASS") {
    return { valid: false, reason: `Virus verdict: ${virusVerdict}` };
  }

  debugLog("SECURITY_PASSED", {});
  return { valid: true };
}

async function logProcessingStep(emailLogId: string, step: string, details: Record<string, unknown>): Promise<void> {
  try {
    const db = await getDb();
    const id = generateId("psl");
    await db.execute(
      `INSERT INTO processing_logs (id, email_log_id, step, details, created_at) VALUES ($1, $2, $3, $4, NOW())`,
      [id, emailLogId, step, JSON.stringify(details)]
    );
  } catch {
    // Log failure shouldn't break the pipeline
  }
}

export async function processWebhookEmail(payload: WebhookPayload): Promise<{
  status: "rejected_security" | "rejected_duplicate" | "accepted" | "manual_review";
  emailLog?: EmailLog;
  order?: Order;
  reason?: string;
}> {
  debugLog("WEBHOOK_RECEIVED", {
    webhookId: payload.id,
    from: payload.from,
    messageId: payload.message_id,
    textLength: payload.text?.length,
    hasHeaders: !!payload.headers,
  });

  const db = await getDb();

  const security = validateWebhookSecurity(payload);
  if (!security.valid) {
    debugLog("WEBHOOK_REJECTED_SECURITY", { reason: security.reason });
    return { status: "rejected_security", reason: security.reason };
  }

  const extracted = parseBaridiMobEmail(payload.text || "");

  const authResults = payload.headers?.["authentication-results"] || "";
  const spf = extractSecurityVerdict(authResults, "spf");
  const dkim = extractSecurityVerdict(authResults, "dkim");
  const dmarc = extractSecurityVerdict(authResults, "dmarc");

  const emailLog = await saveEmailLog({
    sender: payload.from?.toLowerCase() || "",
    subject: "",
    bodyText: payload.text || "",
    bodyHtml: "",
    rawFrom: payload.from || "",
    amount: extracted.amount,
    transactionId: extracted.transactionId,
    targetAccount: extracted.targetAccount,
    currency: extracted.currency,
    messageId: payload.message_id || "",
    webhookId: payload.id || "",
    webhookCreatedAt: payload.created_at || "",
    webhookMessageId: payload.message_id || "",
    webhookLastEvent: payload.last_event || "",
    headersReceived: payload.headers?.received || "",
    headersAuthResults: authResults,
    securitySpf: spf,
    securityDkim: dkim,
    securityDmarc: dmarc,
    securitySpamVerdict: payload.headers?.["x-ses-spam-verdict"] || "",
    securityVirusVerdict: payload.headers?.["x-ses-virus-verdict"] || "",
  });

  await logProcessingStep(emailLog.id, "email_saved", {
    webhookId: payload.id,
    extracted: extracted,
  });

  const txId = extracted.transactionId?.trim();
  if (!txId) {
    debugLog("NO_TRANSACTION_ID", { emailLogId: emailLog.id });
    await logProcessingStep(emailLog.id, "no_transaction_id", {});
    await markEmailProcessed(emailLog.id);
    await saveUnmatchedPayment({
      emailLogId: emailLog.id,
      transactionId: "",
      amount: extracted.amount,
      currency: extracted.currency,
      targetAccount: extracted.targetAccount,
      emailSender: payload.from || "",
      emailSubject: "",
      emailBody: (payload.text || "").slice(0, 2000),
    });
    return { status: "manual_review", emailLog, reason: "No transaction ID found in email" };
  }

  debugLog("CHECKING_DUPLICATE_TX", { transactionId: txId, emailLogId: emailLog.id });
  await logProcessingStep(emailLog.id, "checking_duplicate", { transactionId: txId });

  const existingTx = await db.queryOne(
    "SELECT id, status FROM orders WHERE transaction_id = $1 AND status IN ('paid', 'waiting_payment_verification')",
    [txId]
  );
  if (existingTx) {
    debugLog("DUPLICATE_TRANSACTION_ID", { transactionId: txId, existingOrderId: existingTx.id, existingStatus: existingTx.status });
    await logProcessingStep(emailLog.id, "duplicate_transaction_id", {
      transactionId: txId,
      existingOrderId: existingTx.id,
    });
    await markEmailProcessed(emailLog.id);
    return { status: "rejected_duplicate", emailLog, reason: `Transaction ID ${txId} already used by order ${existingTx.id}` };
  }

  const amount = extracted.amount;
  if (amount === null) {
    debugLog("NO_AMOUNT_EXTRACTED", { emailLogId: emailLog.id });
    await logProcessingStep(emailLog.id, "no_amount", {});
    await markEmailProcessed(emailLog.id);
    await saveUnmatchedPayment({
      emailLogId: emailLog.id,
      transactionId: txId,
      amount: null,
      currency: extracted.currency,
      targetAccount: extracted.targetAccount,
      emailSender: payload.from || "",
      emailSubject: "",
      emailBody: (payload.text || "").slice(0, 2000),
    });
    return { status: "manual_review", emailLog, reason: "Could not extract amount from email" };
  }

  debugLog("SEARCHING_PENDING_ORDERS", { amount, emailLogId: emailLog.id });
  await logProcessingStep(emailLog.id, "searching_orders", { amount });

  const pendingOrders = await db.query<Order>(
    `SELECT o.*,
      b.first_name || ' ' || b.last_name as buyer_name,
      p.title as product_title
    FROM orders o
    LEFT JOIN users b ON o.buyer_id = b.id
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.status = 'waiting_payment_verification'
      AND o.total_amount = $1`,
    [amount]
  );

  debugLog("PENDING_ORDERS_FOUND", { count: pendingOrders.length, emailLogId: emailLog.id });

  if (pendingOrders.length === 0) {
    debugLog("NO_MATCHING_ORDERS", { amount });
    await logProcessingStep(emailLog.id, "no_matching_orders", { amount });
    await markEmailProcessed(emailLog.id);
    await saveUnmatchedPayment({
      emailLogId: emailLog.id,
      transactionId: txId,
      amount,
      currency: extracted.currency,
      targetAccount: extracted.targetAccount,
      emailSender: payload.from || "",
      emailSubject: "",
      emailBody: (payload.text || "").slice(0, 2000),
    });
    return { status: "manual_review", emailLog, reason: "No pending orders found with matching amount" };
  }

  if (pendingOrders.length === 1) {
    const order = pendingOrders[0];
    debugLog("SINGLE_ORDER_MATCH", { orderId: order.id, trackingId: order.order_tracking_id, amount, transactionId: txId });
    await logProcessingStep(emailLog.id, "single_order_match", {
      orderId: order.id,
      trackingId: order.order_tracking_id,
      amount,
    });
    await confirmPayment(order, emailLog, txId);
    return { status: "accepted", emailLog, order };
  }

  debugLog("MULTIPLE_ORDERS_SAME_AMOUNT", { orderCount: pendingOrders.length, amount, emailLogId: emailLog.id });
  await logProcessingStep(emailLog.id, "multiple_orders_amount", {
    count: pendingOrders.length,
    amount,
    orderIds: pendingOrders.map((o) => ({ id: o.id, txId: o.transaction_id })),
  });

  const matchingOrders = pendingOrders.filter((o) => o.transaction_id === txId);
  debugLog("FILTERED_BY_TRANSACTION_ID", { matchedCount: matchingOrders.length, totalCount: pendingOrders.length });

  if (matchingOrders.length === 1) {
    const order = matchingOrders[0];
    debugLog("SINGLE_ORDER_MATCH_BY_TX", { orderId: order.id, trackingId: order.order_tracking_id });
    await logProcessingStep(emailLog.id, "single_order_match_by_tx", {
      orderId: order.id,
      trackingId: order.order_tracking_id,
      transactionId: txId,
    });
    await confirmPayment(order, emailLog, txId);
    return { status: "accepted", emailLog, order };
  }

  debugLog("MANUAL_REVIEW_REQUIRED", {
    pendingCount: pendingOrders.length,
    matchingTxCount: matchingOrders.length,
    amount,
    transactionId: txId,
  });
  await logProcessingStep(emailLog.id, "manual_review", {
    pendingCount: pendingOrders.length,
    matchingTxCount: matchingOrders.length,
    amount,
    transactionId: txId,
  });

  await markEmailProcessed(emailLog.id);
  await saveUnmatchedPayment({
    emailLogId: emailLog.id,
    transactionId: txId,
    amount,
    currency: extracted.currency,
    targetAccount: extracted.targetAccount,
    emailSender: payload.from || "",
    emailSubject: "",
    emailBody: (payload.text || "").slice(0, 2000),
  });

  return {
    status: "manual_review",
    emailLog,
    reason: `Multiple pending orders (${pendingOrders.length}) with amount ${amount}. ${matchingOrders.length} matched transaction_id. Manual review required.`,
  };
}

async function confirmPayment(order: Order, emailLog: EmailLog, transactionId: string): Promise<void> {
  debugLog("CONFIRMING_PAYMENT", {
    orderId: order.id,
    trackingId: order.order_tracking_id,
    transactionId,
    emailLogId: emailLog.id,
  });

  const secretCode = crypto.randomBytes(9).toString("base64url").slice(0, 12);

  await updateOrderStatus(order.id, "paid", {
    order_secret_code: secretCode,
    transaction_id: order.transaction_id || transactionId,
    matched_via_email: 1,
    auto_confirmed_at: new Date().toISOString(),
    confirmed_message_id: emailLog.message_id,
    confirmed_webhook_id: emailLog.webhook_id,
  });

  debugLog("ORDER_STATUS_UPDATED_TO_PAID", { orderId: order.id, secretCode });

  await markEmailProcessed(emailLog.id);

  await logProcessingStep(emailLog.id, "payment_confirmed", {
    orderId: order.id,
    trackingId: order.order_tracking_id,
    transactionId,
  });

  await logAuditEvent({
    event_type: "order.payment_webhook_confirmed",
    order_id: order.id,
    details: `Payment confirmed via webhook. Transaction: ${transactionId}, Message: ${emailLog.message_id}`,
  });

  const db = await getDb();

  await createNotification({
    userId: order.buyer_id,
    orderId: order.id,
    type: "payment_confirmed",
    title: "تم تأكيد الدفع",
    message: "تم تأكيد دفع طلبك تلقائياً. يمكنك الآن الاطلاع على الكود السري.",
    link: `/orders/${order.id}`,
  });
  debugLog("NOTIFICATION_SENT_TO_BUYER", { userId: order.buyer_id });

  const admins = await db.query<{ id: string }>("SELECT id FROM users WHERE role = 'admin'");
  for (const a of admins) {
    await createNotification({
      userId: a.id,
      orderId: order.id,
      type: "payment_confirmed",
      title: "تم تأكيد الدفع تلقائياً",
      message: `تم تأكيد دفع الطلب ${order.order_tracking_id} تلقائياً عبر Webhook.`,
      link: `/admin/orders`,
    });
  }
  debugLog("NOTIFICATIONS_SENT_TO_ADMINS", { count: admins.length });

  debugLog("PAYMENT_CONFIRMED_SUCCESS", { orderId: order.id, trackingId: order.order_tracking_id });
}
