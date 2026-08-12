export async function GET() {
  const providers = [
    "https://api.mail.tm",
    "https://api.mail.gw",
  ];

  let lastError = "";

  try {
    for (const base of providers) {
      try {
        console.log("Trying provider:", base);

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
          `Domain status ${base}:`,
          domainResponse.status
        );

        console.log(
          `Domain response ${base}:`,
          domainText
        );

        if (!domainResponse.ok) {
          lastError =
            `${base} returned ${domainResponse.status}: ${domainText}`;
          continue;
        }

        let domainData: any;

        try {
          domainData = JSON.parse(domainText);
        } catch {
          lastError =
            `${base} returned invalid JSON`;
          continue;
        }

        // Support normal Mail.tm/Mail.gw response
        // and a plain array just in case.
        let domains: any[] = [];

        if (Array.isArray(domainData)) {
          domains = domainData;
        } else if (
          Array.isArray(domainData?.["hydra:member"])
        ) {
          domains = domainData["hydra:member"];
        }

        console.log(
          `Parsed domains from ${base}:`,
          domains
        );

        // Pick any domain that actually has a domain name.
        const usableDomain = domains.find(
          (item: any) =>
            typeof item?.domain === "string" &&
            item.domain.trim().length > 0
        );

        if (!usableDomain) {
          lastError =
            `${base} returned no usable domain`;
          continue;
        }

        const domain = usableDomain.domain.trim();

        console.log(
          "Selected provider:",
          base
        );

        console.log(
          "Selected domain:",
          domain
        );

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
          "Creating account:",
          address
        );

        const accountResponse = await fetch(
          `${base}/accounts`,
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
          `Account status ${base}:`,
          accountResponse.status
        );

        console.log(
          `Account response ${base}:`,
          accountText
        );

        if (!accountResponse.ok) {
          lastError =
            `${base} account creation failed: ${accountResponse.status} ${accountText}`;

          // Try the second provider instead of immediately failing.
          continue;
        }

        console.log(
          "Temporary email created successfully:",
          address
        );

        return Response.json({
          email: address,
          password,
          provider: base,
        });
      } catch (error) {
        lastError =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          `Provider failed ${base}:`,
          error
        );

        // Try the next provider.
        continue;
      }
    }

    // Both providers failed.
    return Response.json(
      {
        error:
          "Both temporary mail providers failed",
        details: lastError,
      },
      {
        status: 503,
      }
    );
  } catch (error) {
    console.error(
      "Generate email fatal error:",
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
