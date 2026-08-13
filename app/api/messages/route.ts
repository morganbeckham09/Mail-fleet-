const ALLOWED_PROVIDERS = new Set([
  "https://api.mail.tm",
  "https://api.mail.gw",
]);

function cleanMessageText(text: string) {
  if (!text) return "";

  let cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  cleaned = cleaned.replace(/^={5,}\s*$/gm, "");

  cleaned = cleaned.replace(
    /\b\d{5}Don't share this code with anyone\.\s*/gi,
    ""
  );

  cleaned = cleaned.replace(
    /If someone asks for this code[\s\S]*$/i,
    ""
  );

  cleaned = cleaned.replace(
    /Don't share this code with anyone\.?/gi,
    ""
  );

  cleaned = cleaned.replace(
    /Here's your confirmation code:\s*/gi,
    ""
  );

  cleaned = cleaned.replace(/^=+\s*$/gm, "");

  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      email,
      password,
      provider,
    } = body;

    if (!email || !password || !provider) {
      return Response.json(
        {
          error:
            "Email, password and provider are required",
        },
        { status: 400 }
      );
    }

    // Only allow our trusted mail providers
    if (!ALLOWED_PROVIDERS.has(provider)) {
      return Response.json(
        {
          error: "Invalid mail provider",
        },
        { status: 400 }
      );
    }

    // Authenticate mailbox
    const tokenResponse = await fetch(
      `${provider}/token`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          address: email,
          password,
        }),
      }
    );

    const tokenText =
      await tokenResponse.text();

    if (!tokenResponse.ok) {
      return Response.json(
        {
          error:
            "Failed to authenticate mailbox",
        },
        {
          status: tokenResponse.status,
        }
      );
    }

    let tokenData: any;

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      return Response.json(
        {
          error:
            "Invalid authentication response",
        },
        { status: 500 }
      );
    }

    if (!tokenData?.token) {
      return Response.json(
        {
          error:
            "No authentication token returned",
        },
        { status: 500 }
      );
    }

    // Get inbox
    const messagesResponse =
      await fetch(
        `${provider}/messages?page=1`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization:
              `Bearer ${tokenData.token}`,
          },
        }
      );

    const messagesText =
      await messagesResponse.text();

    if (!messagesResponse.ok) {
      return Response.json(
        {
          error:
            "Failed to fetch messages",
        },
        {
          status:
            messagesResponse.status,
        }
      );
    }

    let messagesData: any;

    try {
      messagesData =
        JSON.parse(messagesText);
    } catch {
      return Response.json(
        {
          error:
            "Invalid messages response",
        },
        { status: 500 }
      );
    }

    const rawMessages =
      Array.isArray(messagesData)
        ? messagesData
        : messagesData?.["hydra:member"] || [];

    // Remove duplicate messages
    const uniqueMessages = Array.from(
      new Map(
        rawMessages.map(
          (message: any) => [
            message.id,
            message,
          ]
        )
      ).values()
    );

    // Get full message details
    const detailedMessages =
      await Promise.all(
        uniqueMessages.map(
          async (message: any) => {
            if (!message?.id) {
              return message;
            }

            try {
              const detailResponse =
                await fetch(
                  `${provider}/messages/${message.id}`,
                  {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                      Accept:
                        "application/json",
                      Authorization:
                        `Bearer ${tokenData.token}`,
                    },
                  }
                );

              if (!detailResponse.ok) {
                return message;
              }

              const detailText =
                await detailResponse.text();

              const detail =
                JSON.parse(detailText);

              return {
                ...message,
                ...detail,
              };
            } catch {
              return message;
            }
          }
        )
      );

    // Clean messages for the frontend
    const cleanedMessages =
      detailedMessages.map(
        (message: any) => ({
          id: String(message?.id || ""),

          subject:
            message?.subject || "",

          intro:
            message?.intro || "",

          text: cleanMessageText(
            message?.text ||
            message?.intro ||
            ""
          ),

          from:
            message?.from || null,

          to:
            message?.to || null,

          createdAt:
            message?.createdAt || null,

          seen:
            Boolean(message?.seen),
        })
      );

    return Response.json({
      messages: cleanedMessages,
    });
  } catch (error) {
    console.error(
      "Messages API error:",
      error
    );

    return Response.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
