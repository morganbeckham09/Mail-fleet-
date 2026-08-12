export async function GET() {
  try {
    const response = await fetch("https://api.mail.tm/domains", {
      cache: "no-store",
    });

    const text = await response.text();

    console.log("Mail.tm status:", response.status);
    console.log("Mail.tm response:", text);

    if (!response.ok) {
      return Response.json(
        {
          error: "Mail.tm API failed",
          status: response.status,
          details: text,
        },
        { status: 500 }
      );
    }

  const match = text.match(/<domain>(.*?)<\/domain>/);

if (!match) {
  return Response.json(
    { error: "No domain found", response: text },
    { status: 500 }
  );
}

const domain = match[1];

    
    }

    const username =
      "mail" + Math.random().toString(36).substring(2, 10);

    const email = `${username}@${domain}`;

    return Response.json({ email });
  } catch (error) {
    console.error("Generate email error:", error);

    return Response.json(
      {
        error: "Failed to generate email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
