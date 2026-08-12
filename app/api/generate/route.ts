"use client";

import { useState } from "react";

type Message = {
  id?: string;
  subject?: string;
  intro?: string;
  text?: string;
  html?: string[];
  createdAt?: string;
  from?: {
    address?: string;
    name?: string;
  };
  to?: {
    address?: string;
    name?: string;
  }[];
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(false);

  const [error, setError] = useState("");

  async function generateEmail() {
    setLoading(true);
    setError("");
    setEmail("");
    setPassword("");
    setProvider("");
    setMessages([]);

    try {
      const response = await fetch("/api/generate", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `${data.error || "Request failed"} | Status: ${
            data.status || response.status
          } | ${data.details || ""}`
        );
      }

      if (!data.email || !data.password || !data.provider) {
        throw new Error(
          "The server did not return the email credentials."
        );
      }

      setEmail(data.email);
      setPassword(data.password);
      setProvider(data.provider);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate email"
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkInbox() {
    if (!email || !password || !provider) {
      setError("Generate an email first.");
      return;
    }

    setInboxLoading(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `${data.error || "Failed to load inbox"}${
            data.details ? ` | ${data.details}` : ""
          }`
        );
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inbox"
      );
    } finally {
      setInboxLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">
          TempMail
        </h1>

        <p className="mb-6 text-gray-600">
          Create a temporary email address instantly.
        </p>

        <button
          onClick={generateEmail}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-black text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Email"}
        </button>

        {email && (
          <div className="mt-6 p-4 border rounded-lg">
            <p className="text-sm text-gray-500 mb-2">
              Your temporary email:
            </p>

            <p className="font-semibold break-all">
              {email}
            </p>

            <button
              onClick={checkInbox}
              disabled={inboxLoading}
              className="mt-4 px-6 py-3 rounded-lg bg-black text-white disabled:opacity-50"
            >
              {inboxLoading
                ? "Checking Inbox..."
                : "Check Inbox"}
            </button>
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className="text-xl font-bold mb-3">
              Inbox
            </h2>

            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className="p-4 border rounded-lg"
                >
                  <p className="font-semibold">
                    {message.subject || "(No subject)"}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    From:{" "}
                    {message.from?.name ||
                      message.from?.address ||
                      "Unknown sender"}
                  </p>

                  {message.from?.name &&
                    message.from?.address && (
                      <p className="text-xs text-gray-400">
                        {message.from.address}
                      </p>
                    )}

                  {message.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(
                        message.createdAt
                      ).toLocaleString()}
                    </p>
                  )}

                  {message.intro && (
                    <p className="text-sm mt-3">
                      {message.intro}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {email && !inboxLoading && messages.length === 0 && (
          <p className="mt-5 text-sm text-gray-500">
            No messages yet. Tap "Check Inbox" to refresh.
          </p>
        )}

        {error && (
          <div className="mt-4 p-3 border border-red-300 rounded-lg">
            <p className="text-red-500 break-words">
              {error}
            </p>
          </div>
        )}
      </div>
    </main>
  );
          }
