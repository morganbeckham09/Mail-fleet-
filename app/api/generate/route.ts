export async function GET() {
  try {
    const providers = [
      "https://api.mail.tm",
      "https://api.mail.gw",
    ];

    let selectedBase = "";
    let domain = "";
    let lastError = "";

    // Find a working Mail.tm/Mail.gw domain
    for (const base of providers) {
      try {
        const response = await fetch(`${base}/domains?page=1`, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const text = await response.text();

        console.log(
          `Mail provider domain status (${base}):`,
          response.status
        );

        console.log(
          `Mail provider domain response (${base}):`,
          text
        );

        if (!response.ok) {
          lastError = `${base} returned ${response.status}: ${text}`;
          continue;
        }

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          lastError = `${base} returned invalid JSON: ${text}`;
          continue;
        }

        const domains = Array.isArray(data["hydra:member"])
          ? data["hydra:member"]
          : [];

        const activeDomain = domains.find(
          (item: any) =>
            item?.domain &&
            item?.isActive !== false &&
            item?.isPrivate !== true
        );

        if (!activeDomain) {
          lastError = `${base} returned no active public domains`;
          continue;
        }

        selectedBase = base;
        domain = activeDomain.domain;

        console.log("Selected mail provider:", selectedBase);
        console.log("Selected domain:", domain);

        break;
      } catch (error) {
        lastError =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          `Domain request failed for ${base}:`,
          error
        );
      }
    }

    if (!selectedBase || !domain) {
      return Response.json(
        {
          error: "No temporary mail provider is currently available",
          details: lastError || "No domain was returned",
        },
        { status: 503 }
      );
    }

    // Generate username and password
    const username =
      "mail" +
      Math.random()
        .toString(36)
        .substring(2, 12);

    const password =
      Math.random()
        .toString(36)
        .substring(2, 14);

    const address = `${username}@${domain}`;

    console.log("Creating Mail account:", address);

    // Create account
    const accountResponse = await fetch(
      `${selectedBase}/accounts`,
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
        cache: "no-store",
      }
    );

    const accountText = await accountResponse.text();

    console.log(
      "Mail account status:",
      accountResponse.status
    );

    console.log(
      "Mail account response:",
      accountText
    );

    if (!accountResponse.ok) {
      return Response.json(
        {
          error: "Failed to create temporary email account",
          details: accountText,
        },
        { status: accountResponse.status }
      );
    }

    return Response.json({
      email: address,
      password,
      provider: selectedBase,
    });
  } catch (error) {
    console.error(
      "Generate email error:",
      error
    );

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
