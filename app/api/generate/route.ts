export async function GET() {
  try {
    // 1. Get available domains
    const domainResponse = await fetch(
      "https://api.mail.tm/domains",
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!domainResponse.ok) {
      const errorText = await domainResponse.text();

      return Response.json(
        {
          error: "Failed to get Mail.tm domains",
          details: errorText,
        },
        { status: domainResponse.status }
      );
    }

    const domainData = await domainResponse.json();

    const domains = domainData["hydra:member"];

    if (!domains || domains.length === 0) {
      return Response.json(
        { error: "No Mail.tm domains available" },
        { status: 500 }
      );
    }

    // 2. Pick the first available domain
    const domain = domains[0].domain;

    // 3. Generate username and password
    const username =
      "mail" + Math.random().toString(36).substring(2, 10);

    const password =
      Math.random().toString(36).substring(2, 14) +
      "A1!";

    const address = `${username}@${domain}`;

    // 4. Create the Mail.tm account
    const accountResponse = await fetch(
      "https://api.mail.tm/accounts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          address,
          password,
        }),
      }
    );

    const accountText = await accountResponse.text();

    console.log(
      "Mail.tm account status:",
      accountResponse.status
    );

    console.log(
      "Mail.tm account response:",
      accountText
    );

    if (!accountResponse.ok) {
      return Response.json(
        {
          error: "Failed to create email account",
          details: accountText,
        },
        { status: accountResponse.status }
      );
    }

    // 5. Return the email to your frontend
    return Response.json({
      email: address,
    });
  } catch (error) {
    console.error("Generate email error:", error);

    return Response.json(
      {
        error: "Failed to generate email",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
