export async function GET() {
  const providers = [
    "https://api.mail.tm",
    "https://api.mail.gw",
  ];

  let lastError = "";

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

      console.log("Domain status:", domainResponse.status);
      console.log("Domain response:", domainText);

      if (!domainResponse.ok) {
        lastError =
          `${base} returned ${domainResponse.status}: ${domainText}`;
        continue;
      }

      const domainData = JSON.parse(domainText);

      let domains: any[] = [];

      if (Array.isArray(domainData)) {
        domains = domainData;
      } else if (
        Array.isArray(domainData?.["hydra:member"])
      ) {
        domains = domainData["hydra:member"];
      }

      console.log("Parsed domains:", domains);

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

      console.log("Selected provider:", base);
      console.log("Selected domain:", domain);

      const names = [
  "adams",
  "james",
  "john",
  "david",
  "michael",
  "daniel",
  "alex",
  "samuel",
  "charles",
  "henry",
  "thomas",
  "william",
  "joseph",
  "emmanuel",
  "andrew",
  "christopher",
  "benjamin",
  "jacob",
  "oliver",
  "george",
];

const randomBytes = crypto.getRandomValues(
  new Uint32Array(2)
);

const randomName =
  names[randomBytes[0] % names.length];

const randomNumber =
  String(randomBytes[1] % 900000).padStart(6, "0");

const username =
  `${randomName}${randomNumber}`;

const password =
  "Temp" +
  crypto.randomUUID()
    .replace(/-/g, "")
    .substring(0, 16);

const address = `${username}@${domain}`;

      console.log("Creating account:", address);

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
        "Account status:",
        accountResponse.status
      );

      console.log(
        "Account response:",
        accountText
      );

      if (!accountResponse.ok) {
        lastError =
          `${base} account creation failed: ${accountResponse.status} ${accountText}`;
        continue;
      }

      console.log(
        "Temporary email created:",
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
    }
  }

  return Response.json(
    {
      error: "Both temporary mail providers failed",
      details: lastError,
    },
    {
      status: 503,
    }
  );
}
