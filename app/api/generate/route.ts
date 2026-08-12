export async function GET() {
  try {
    // Get available Mail.tm domains
    const domainResponse = await fetch("https://api.mail.tm/domains", {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const domainText = await domainResponse.text();

    console.log("Mail.tm domain status:", domainResponse.status);
    console.log("Mail.tm domain response:", domainText);

    if (!domainResponse.ok) {
      return Response.json(
        {
          error: "Mail.tm domains request failed",
          status: domainResponse.status,
          details: domainText,
        },
        { status: domainResponse.status }
      );
    }

    let domainData;

    try {
      domainData = JSON.parse(domainText);
    } catch {
      return Response.json(
        {
          error: "Mail.tm returned invalid JSON",
          details: domainText,
        },
        { status: 502 }
      );
    }

    const domains = domainData?.["hydra:member"] ?? [];

    if (!Array.isArray(domains) || domains.length === 0) {
      return Response.json(
        {
          error: "No Mail.tm domains available",
          details: domainData,
        },
        { status: 503 }
      );
    }

    // Pick the first active domain
    const activeDomain =
      domains.find((item: any) => item?.isActive === true) ?? domains[0];

    const domain = activeDomain?.domain;

    if (!domain) {
      return Response.json(
        {
          error: "Mail.tm returned a domain without a domain name",
          details: activeDomain,
        },
        { status: 502 }
      );
    }

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
