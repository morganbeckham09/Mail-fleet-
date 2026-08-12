export async function GET() {
  try {
    const providers = [
      "https://api.mail.tm",
      "https://api.mail.gw",
    ];

    let selectedBase = "";
    let domain = "";
    let lastError = "";

    // Find an available domain
    for (const base of providers) {
      try {
        const domainResponse = await fetch(
          `${base}/domains?page=1`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const domainText = await domainResponse.text();

        console.log(
          `Mail provider domain status (${base}):`,
          domainResponse.status
        );

        console.log(
          `Mail provider domain response (${base}):`,
          domainText
        );

        if (!domainResponse.ok) {
          lastError =
            `${base} returned ${domainResponse.status}: ${domainText}`;
          continue;
        }

        let domainData;

        try {
          domainData = JSON.parse(domainText);
        } catch {
          lastError =
            `${base} returned invalid JSON: ${domainText}`;
          continue;
        }

        const domains = Array.isArray(
          domainData["hydra:member"]
        )
          ? domainData["hydra:member"]
          : [];

        console.log(
          `Domains returned by ${base}:`,
          domains
        );

        // Mail.tm / Mail.gw return domain objects
        const usableDomain = domains.find(
          (item: any) =>
            item?.domain &&
            item?.isActive !== false
        );

        if (!usableDomain) {
          lastError =
            `${base} returned no active domains`;
          continue;
        }

        selectedBase = base;
        domain = usableDomain.domain;

        console.log(
          "Selected mail provider:",
          selectedBase
        );

        console.log(
          "Selected domain:",
          domain
        );

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

    // Both providers failed
    if (!selectedBase || !domain) {
      return Response.json(
        {
          error:
            "No temporary mail provider is currently available",
          details:
            lastError ||
            "No active domain was returned",
        },
        {
          status: 503,
        }
      );
    }

    // Generate random username
    const username =
      "mail" +
      Math.random()
        .toString(36)
        .substring(2, 12);

    // Generate random password
    const password =
      Math.random()
        .toString(36)
        .substring(2, 14);

    const address =
      `${username}@${domain}`;

    console.log(
      "Creating Mail account:",
      address
    );

    // Create the temporary email account
    const accountResponse = await fetch(
      `${selectedBase}/accounts`,
      {
        method: "POST",
        cache: "no-store",
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

    const accountText =
      await accountResponse.text();

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
          error:
            "Failed to create temporary email account",
          details: accountText,
        },
        {
          status: accountResponse.status,
        }
      );
    }

    // Return the generated email
    return Response.json({
      email: address,
      password: password,
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
      {
        status: 500,
      }
    );
  }
}
