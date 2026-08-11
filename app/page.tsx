"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateEmail() {
    setLoading(true);
    setError("");
    setEmail("");

    try {
      // Get an available temporary-email domain
      const domainsResponse = await fetch(
        "https://api.mail.tm/domains?page=1"
      );

      if (!domainsResponse.ok) {
        throw new Error("Could not connect to the email service.");
      }

      const domainsData = await domainsResponse.json();
      const domain = domainsData["hydra:member"]?.[0]?.domain;

      if (!domain) {
        throw new Error("No email domain is available right now.");
      }

      // Create a random email address
      const username =
        "mail" +
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString().slice(-4);

      const address = `${username}@${domain}`;

      // Create the temporary account
      const accountResponse = await fetch(
        "https://api.mail.tm/accounts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address,
            password: "MailFleet123!",
          }),
        }
      );

      if (!accountResponse.ok) {
        throw new Error("Could not create the temporary email.");
      }

      setEmail(address);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4">
          Mail Fleet
        </h1>

        <p className="text-gray-400 text-lg mb-8">
          Your temporary email address, made simple.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <p className="text-gray-400 mb-3">
            Your temporary email
          </p>

          <div className="bg-gray-800 rounded-xl p-4 min-h-[60px] flex items-center justify-center mb-5">
            {loading ? (
              <span className="text-gray-400">
                Generating email...
              </span>
            ) : email ? (
              <span className="text-white font-medium break-all">
                {email}
              </span>
            ) : (
              <span className="text-gray-500">
                Generate an email address
              </span>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">
              {error}
            </p>
          )}

          <button
            onClick={generateEmail}
            disabled={loading}
            className="w-full bg-white text-black font-semibold rounded-xl py-4 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Email"}
          </button>
        </div>
      </div>
    </main>
  );
}
