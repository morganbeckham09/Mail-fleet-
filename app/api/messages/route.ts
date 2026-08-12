function cleanMessageText(text: string) {
  if (!text) return "";

  let cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  // Remove repeated separator lines
  cleaned = cleaned.replace(
    /^={10,}\s*/gm,
    ""
  );

  cleaned = cleaned.replace(
    /\s*={10,}\s*$/gm,
    ""
  );

  // Remove duplicated confirmation-code notice
  const codeNotice =
    /^\s*\d{5}Don't share this code with anyone\.\s*/i;

  cleaned = cleaned.replace(codeNotice, "");

  // Remove the same notice if repeated at the end
  cleaned = cleaned.replace(
    /\s*\d{5}Don't share this code with anyone\.\s*$/i,
    ""
  );

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

    // 1. Authenticate mailbox
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

    const tokenText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      return Response.json(
        {
          error: "Failed to authenticate mailbox",
          details: tokenText,
        },
        { status: tokenResponse.status }
      );
    }

    let tokenData;

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      return Response.json(
        {
          error: "Invalid authentication response",
        },
        { status: 500 }
      );
    }

    if (!tokenData.token) {
      return Response.json(
        {
          error: "No authentication token returned",
        },
        { status: 500 }
      );
    }

    const token = tokenData.token;

    // 2. Get inbox messages
    const messagesResponse = await fetch(
      `${provider}/messages?page=1`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const messagesText =
      await messagesResponse.text();

    if (!messagesResponse.ok) {
      return Response.json(
        {
          error: "Failed to fetch messages",
          details: messagesText,
        },
        { status: messagesResponse.status }
      );
    }

    let messagesData;

    try {
      messagesData = JSON.parse(messagesText);
    } catch {
      return Response.json(
        {
          error: "Invalid messages response",
        },
        { status: 500 }
      );
    }

    // 3. Handle both API response formats
    const rawMessages = Array.isArray(messagesData)
      ? messagesData
      : messagesData["hydra:member"] || [];

    // 4. Remove duplicate messages
    const uniqueMessages = Array.from(
      new Map(
        rawMessages.map((message: any) => [
          message.id,
          message,
        ])
      ).values()
    );

    // 5. Get full message details
    const detailedMessages = await Promise.all(
      uniqueMessages.map(async (message: any) => {
        if (!message.id) {
          return message;
        }

        try {
          const detailResponse = await fetch(
            `${provider}/messages/${message.id}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!detailResponse.ok) {
            return message;
          }

          const detailText =
            await detailResponse.text();

          const detail = JSON.parse(detailText);

          return {
            ...message,
            ...detail,
          };
        } catch {
          // If full message loading fails,
          // keep the original inbox message.
          return message;
        }
      })
    );

    // 6. Clean message data for the frontend
    const cleanedMessages = detailedMessages.map(
      (message: any) => ({
        id: String(message.id),

        subject:
          message.subject || "",

        intro:
          message.intro || "",

        text: cleanMessageText(
  message.text ||
    message.intro ||
    ""
),

        createdAt:
          message.createdAt || "",

        from: {
          address:
            message.from?.address || "",

          name:
            message.from?.name || "",
        },
      })
    );

    // 7. Newest messages first
    cleanedMessages.sort((a: any, b: any) => {
      const dateA = new Date(
        a.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b.createdAt || 0
      ).getTime();

      return dateB - dateA;
    });

    return Response.json({
      messages: cleanedMessages,
    });
  } catch (error) {
    console.error(
      "Messages error:",
      error
    );

    return Response.json(
      {
        error: "Failed to load inbox",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
