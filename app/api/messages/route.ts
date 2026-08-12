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
          error: "Email, password and provider are required",
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

    const tokenText = await tokenResponse.text();

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
          error: "Failed to authenticate mailbox",
          details: tokenText,
        },
        { status: tokenResponse.status }
      );
    }

    const tokenData = JSON.parse(tokenText);

    if (!tokenData.token) {
      return Response.json(
        {
          error: "No authentication token returned",
        },
        { status: 500 }
      );
    }

    // Get inbox messages
    const messagesResponse = await fetch(
      `${provider}/messages?page=1`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenData.token}`,
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
          error: "Failed to fetch messages",
          details: messagesText,
        },
        { status: messagesResponse.status }
      );
    }

    const messagesData =
      JSON.parse(messagesText);

    return Response.json({
      messages:
        messagesData["hydra:member"] || [],
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
