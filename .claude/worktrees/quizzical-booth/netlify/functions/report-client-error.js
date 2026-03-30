const MAX_TEXT_LENGTH = 1200;
const MAX_STACK_LENGTH = 3000;

function clampText(value, limit = MAX_TEXT_LENGTH) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function safeJsonParse(raw) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function getIp(event) {
  const forwardedFor = event.headers["x-forwarded-for"] || "";
  const firstIp = forwardedFor.split(",")[0].trim();
  return clampText(firstIp, 120);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        Allow: "POST",
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ ok: false, error: "Method Not Allowed" })
    };
  }

  const payload = safeJsonParse(event.body);
  if (!payload || typeof payload !== "object") {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ ok: false, error: "Invalid JSON body" })
    };
  }

  const logItem = {
    type: clampText(payload.type || "runtime_error", 80),
    message: clampText(payload.message || "unknown error"),
    stack: clampText(payload.stack || "", MAX_STACK_LENGTH),
    page: clampText(payload.page || "", 240),
    source: clampText(payload.source || "", 240),
    line: Number.isFinite(Number(payload.line)) ? Number(payload.line) : null,
    column: Number.isFinite(Number(payload.column)) ? Number(payload.column) : null,
    timestamp: clampText(payload.timestamp || new Date().toISOString(), 80),
    userAgent: clampText(payload.userAgent || event.headers["user-agent"] || "", 400),
    language: clampText(payload.language || "", 40),
    viewport: clampText(payload.viewport || "", 80),
    referrer: clampText(payload.referrer || "", 240),
    ip: getIp(event),
    requestId: clampText(event.headers["x-nf-request-id"] || "", 120)
  };

  console.error("[client-error-report]", JSON.stringify(logItem));

  return {
    statusCode: 204,
    headers: {
      "Cache-Control": "no-store"
    },
    body: ""
  };
};