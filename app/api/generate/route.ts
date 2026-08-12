export async function GET() {
  try {
    const response = await fetch("https://api.mail.tm/domains?page=1");

    if (!response.ok) {
      throw new Error("Could not fetch Mail.tm domains");
    }

    const data = await response.json();
    const domain = data["hydra:member"]?.[0]?.domain;

    if (!domain) {
      throw new Error("No email domain available");
    }

    const username =
      "mail" + Math.random().toString(36).substring(2, 10);

    const email = `${username}@${domain}`;

    return Response.json({ email });
  } catch (error) {
    return Response.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
