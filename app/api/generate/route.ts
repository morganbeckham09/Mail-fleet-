export async function GET() {
  try {
    // Get available Mail.tm domains with retry
let domainResponse;
let domainText = "";
let lastStatus = 0;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    domainResponse = await fetch(
      "https://api.mail.tm/domains?page=1",
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    domainText = await domainResponse.text();
    lastStatus = domainResponse.status;

    console.log(
      `Mail.tm domain attempt ${attempt}:`,
      lastStatus,
      domainText
    );

    if (domainResponse.ok) {
      break;
    }
  } catch (fetchError) {
    console.error(
      `Mail.tm domain attempt ${attempt} error:`,
      fetchError
    );
  }

  // Wait before retrying
  if (attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Mail.tm still failed after 3 attempts
if (!domainResponse || !domainResponse.ok) {
  return Response.json(
    {
      error: "Mail.tm domains service is temporarily unavailable",
      status: lastStatus || 503,
      details: domainText || "No response from Mail.tm",
    },
    { status: 503 }
  );
}

// Parse Mail.tm response
let domainData;

try {

    // Generate username and password
    const username =
      "mail" + Math.random().toString(36).substring(2, 12);

    const password =
      Math.random().toString(36).substring(2, 12) + "A1!";

    const address = `${username}@${domain}`;

    console.log("Creating Mail.tm account:", address);

    // Create Mail.tm account
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
          error: "Failed to create Mail.tm account",
          details: accountText,
        },
        { status: accountResponse.status }
      );
    }

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
