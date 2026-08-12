"use client";

import { useEffect, useState } from "react";

type Message = {
  id: string;
  subject?: string;
  intro?: string;
  text?: string;
  createdAt?: string;
  from?: {
    address?: string;
    name?: string;
  };
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
const [selectedMessage, setSelectedMessage] =
  useState<Message | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
// Restore saved mailbox after page reload
useEffect(() => {
  try {
    const savedMailbox = localStorage.getItem("tempmail_mailbox");

    if (!savedMailbox) {
      return;
    }

    const mailbox = JSON.parse(savedMailbox);

    if (
      mailbox.email &&
      mailbox.password &&
      mailbox.provider
    ) {
      setEmail(mailbox.email);
      setPassword(mailbox.password);
      setProvider(mailbox.provider);
    }
  } catch (error) {
    console.error("Failed to restore mailbox:", error);
    localStorage.removeItem("tempmail_mailbox");
  }
}, []);
  // Generate temporary email
  async function generateEmail() {
    try {
      setGenerating(true);
      setError("");
      setEmail("");
      setPassword("");
      setProvider("");
      setMessages([]);
      // IMPORTANT:
      // /api/generate uses GET, not POST
      const response = await fetch("/api/generate", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate email"
        );
      }

      console.log("Generated mailbox:", data);

      setEmail(data.email);
      setPassword(data.password);
      setProvider(data.provider); localStorage.setItem(
  "tempmail_mailbox",
  JSON.stringify({
    email: data.email,
    password: data.password,
    provider: data.provider,
  })
);
    } catch (error) {
      console.error("Generate error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate email"
      );
    } finally {
      setGenerating(false);
    }
  }

  // Load inbox messages
  async function loadMessages() {
    if (!email || !password || !provider) {
      return;
    }

    try {
      setLoadingMessages(true);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          email,
          password,
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load inbox"
        );
      }

      setMessages(data.messages || []);
      setError("");
    } catch (error) {
      console.error("Inbox error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inbox"
      );
    } finally {
      setLoadingMessages(false);
    }
  }

  // Automatically refresh inbox every 5 seconds
  useEffect(() => {
    if (!email || !password || !provider) {
      return;
    }

    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [email, password, provider]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "60px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "48px",
            marginBottom: "10px",
          }}
        >
          TempMail
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            fontSize: "20px",
            marginBottom: "35px",
          }}
        >
          Create a temporary email address instantly.
        </p>

        <button
          onClick={generateEmail}
          disabled={generating}
          style={{
            display: "block",
            margin: "0 auto 30px",
            padding: "16px 35px",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "18px",
            cursor: generating
              ? "not-allowed"
              : "pointer",
            opacity: generating ? 0.6 : 1,
          }}
        >
          {generating
            ? "Generating..."
            : "Generate Email"}
        </button>

        {error && (
          <div
            style={{
              padding: "15px",
              marginBottom: "20px",
              background: "#ffe5e5",
              color: "#b00020",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {email && (
          <>
            {/* Email address */}
            <div
              style={{
                border: "1px solid #222",
                borderRadius: "10px",
                padding: "25px",
                textAlign: "center",
                marginBottom: "25px",
              }}
            >
              <p
                style={{
                  color: "#777",
                  fontSize: "18px",
                  marginBottom: "10px",
                }}
              >
                Your temporary email:
              </p>

              <strong
                style={{
                  fontSize: "22px",
                  wordBreak: "break-all",
                }}
              >
                {email}
              </strong>

              <br />

              <button
                onClick={async () => {
  try {
    await navigator.clipboard.writeText(email);
    alert("Email copied!");
  } catch {
    alert("Copy failed. Please copy the email manually.");
  }
}}
                style={{
                  marginTop: "15px",
                  padding: "9px 18px",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Copy
              </button>
            </div>

            {/* Inbox */}
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "25px",
                  }}
                >
                  Inbox
                </h2>

                <button
                  onClick={loadMessages}
                  disabled={loadingMessages}
                  style={{
                    padding: "9px 15px",
                    background: "#000",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {loadingMessages
                    ? "Loading..."
                    : "Refresh"}
                </button>
              </div>

              {messages.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "35px 10px",
                    color: "#777",
                  }}
                >
                  <p
                    style={{
                      fontSize: "18px",
                    }}
                  >
                    No messages yet.
                  </p>

                  <p>
                    This inbox checks for new
                    messages automatically.
                  </p>
                </div>
              ) : (
                <div>
                  {messages.map((message) => (
  <div
    key={message.id}
    onClick={() => setSelectedMessage(message)}
    style={{
      padding: "18px 0",
      borderBottom: "1px solid #eee",
      cursor: "pointer",
    }}
  >

{/* Inbox */}
<div
  style={{
    border: "1px solid #ddd",
                    > }}
                      <h3
                        style={{
                          margin:
                            "0 0 8px",
                        }}
                      >
                        {message.subject ||
                          "(No subject)"}
                      </h3>

                      <p
                        style={{
                          margin:
                            "0 0 8px",
                          color: "#555",
                        }}
                      >
                        From:{" "}
                        {message.from?.name ||
                          message.from
                            ?.address ||
                          "Unknown"}
                      </p>

                      {message.createdAt && (
                        <p
                          style={{
                            margin:
                              "0 0 10px",
                            color: "#999",
                            fontSize:
                              "13px",
                          }}
                        >
                          {new Date(
                            message.createdAt
                          ).toLocaleString()}
                        </p>
                      )}

                      <p
                        style={{
                          margin: 0,
                          lineHeight: "1.5",
                        }}
                      >
                        {message.intro ||
                          message.text ||
                          "No preview available."}
                      </p>
                    </div>
                  ))}{selectedMessage && (
  <div
    style={{
      marginTop: "20px",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "12px",
      background: "#fff",
    }}
  >
    <h2 style={{ margin: "0 0 12px" }}>
      {selectedMessage.subject || "(No subject)"}
    </h2>

    <p
      style={{
        margin: "0 0 8px",
        color: "#555",
      }}
    >
      From:{" "}
      {selectedMessage.from?.name ||
        selectedMessage.from?.address ||
        "Unknown"}
    </p>

    {selectedMessage.createdAt && (
      <p
        style={{
          margin: "0 0 15px",
          color: "#999",
          fontSize: "13px",
        }}
      >
        {new Date(selectedMessage.createdAt).toLocaleString()}
      </p>
    )}

    <p
      style={{
        margin: 0,
        lineHeight: "1.5",
        whiteSpace: "pre-wrap",
      }}
    >
      {selectedMessage.text ||
        selectedMessage.intro ||
        "No message content available."}
    </p>
  </div>
)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
      }
