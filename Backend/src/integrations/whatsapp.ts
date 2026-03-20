import https from "https";
import { URL } from "url";
import { env } from "../config/env";

export type SendWhatsAppOtpInput = {
  to: string;
  otp: string;
};

type WhatsAppResponse = {
  statusCode: number;
  body: string;
};

function normalizeProviderPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function sendHttpRequest(url: URL, payload: string): Promise<WhatsAppResponse> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: "POST",
        protocol: url.protocol,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.WHATSAPP_AUTH_TOKEN}`,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function sendWhatsAppOtp(
  input: SendWhatsAppOtpInput,
): Promise<void> {
  const providerPhone = normalizeProviderPhone(input.to);

  if (!providerPhone) {
    throw new Error("Invalid phone number for WhatsApp provider request");
  }

  const requestUrl = new URL(
    `/v23.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    env.WHATSAPP_API_BASE_URL,
  );

  const components: Array<Record<string, unknown>> = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: input.otp,
        },
      ],
    },
  ];

  if (env.WHATSAPP_INCLUDE_BUTTON_COMPONENT) {
    components.push({
      type: "button",
      parameters: [
        {
          type: "text",
          text: env.WHATSAPP_TEMPLATE_BUTTON_VALUE || input.otp,
        },
      ],
      sub_type: "url",
      index: "0",
    });
  }

  const payloadObj: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: providerPhone,
    type: "template",
    template: {
      name: env.WHATSAPP_TEMPLATE_NAME,
      language: {
        code: env.WHATSAPP_TEMPLATE_LANG,
      },
      components,
    },
  };

  if (env.WHATSAPP_BIZ_OPAQUE_CALLBACK_DATA) {
    payloadObj.biz_opaque_callback_data = env.WHATSAPP_BIZ_OPAQUE_CALLBACK_DATA;
  }

  const payload = JSON.stringify(payloadObj);

  const response = await sendHttpRequest(requestUrl, payload);

  if (response.statusCode < 200 || response.statusCode >= 300) {
    console.error("WhatsApp provider request failed", {
      statusCode: response.statusCode,
      body: response.body,
      to: providerPhone,
      template: env.WHATSAPP_TEMPLATE_NAME,
    });

    throw new Error(
      `WhatsApp OTP request failed with status ${response.statusCode}: ${response.body}`,
    );
  }
}
