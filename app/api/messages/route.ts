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

    // Get authentication token
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

    console.log(
      "Token status:",
      tokenResponse.status
    );

    console.log(
      "Token response:",
      tokenText
    );

    if (!tokenResponse.ok) {
      return Response.json(
        {
          error:
            "Failed to authenticate mailbox",
          details: tokenText,
        },
        {
          status: tokenResponse.status,
        }
      );
    }

    const tokenData =
      JSON.parse(tokenText);

    if (!tokenData.token) {
      return Response.json(
        {
          error:
            "No authentication token returned",
        },
        { status: 500 }
      );
    }

    console.log(
      "Authentication successful"
    );

    // Get inbox messages
    const messagesResponse =
      await fetch(
        `${provider}/messages?page=1`,
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

    const messagesText =
      await messagesResponse.text();

    console.log(
      "Messages status:",
      messagesResponse.status
    );

    console.log(
      "Messages response:",
      messagesText
    );

    if (!messagesResponse.ok) {
      return Response.json(
        {
          error:
            "Failed to fetch messages",
          details:
            messagesText,
        },
        {
          status:
            messagesResponse.status,
        }
      );
    }

    const messagesData =
      JSON.parse(messagesText);

    const messages =
      Array.isArray(messagesData)
        ? messagesData
        : messagesData[
            "hydra:member"
          ] || [];
    // Clean and normalize messages before sending them
    // to the frontend.
    const cleanedMessages = messages.map(
      (message: any) => {
        let intro = message.intro || "";
        let text = message.text || "";

        const subject = message.subject || "";

        // If the subject contains a confirmation code,
        // remove that code from the beginning of the
        // message preview/body when the provider has
        // duplicated it there.
        const codeMatch = subject.match(
          /^([A-Za-z0-9]{4,12})\s+is your confirmation code/i
        );

        if (codeMatch) {
          const code = codeMatch[1];

          // Remove code only when it appears directly
          // at the beginning of the content.
          const codePattern = new RegExp(
            `^${code}\\s*`,
            "i"
          );

          intro = intro.replace(codePattern, "");
          text = text.replace(codePattern, "");
        }

        // Clean excessive whitespace while preserving
        // the original full message formatting.
        intro = intro
          .replace(/\s+/g, " ")
          .trim();

        text = text.trim();

        return {
          id: message.id,
          subject: message.subject,
          intro,
          text,
          createdAt: message.createdAt,
          from: message.from,
        };
      }
    );

    console.log(
      "Cleaned messages:",
      cleanedMessages
    );

    return Response.json({
      messages: cleanedMessages,
    });
