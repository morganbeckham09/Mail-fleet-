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

type Mailbox = {
  email: string;
  password: string;
  provider: string;
};

const STORAGE_KEY = "tempmail_mailboxes";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState("");

  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] =
    useState<Message | null>(null);

  const [generating, setGenerating] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  // Restore saved mailboxes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return;

      setMailboxes(parsed);

      const active = parsed[parsed.length - 1];

      if (
        active?.email &&
        active?.password &&
        active?.provider
      ) {
        setEmail(active.email);
        setPassword(active.password);
        setProvider(active.provider);
      }
    } catch (error) {
      console.error(
        "Failed to restore mailboxes:",
        error
      );

      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save mailboxes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(mailboxes)
    );
  }, [mailboxes]);

  // Generate temporary email
  async function generateEmail() {
    try {
      setGenerating(true);
      setError("");
      setMessages([]);
      setSelectedMessage(null);

      const response = await fetch(
        "/api/generate",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to generate email"
        );
      }

      const newMailbox: Mailbox = {
        email: data.email,
        password: data.password,
        provider: data.provider,
      };

      setEmail(data.email);
      setPassword(data.password);
      setProvider(data.provider);

      setMailboxes((current) => [
        ...current,
        newMailbox,
      ]);
    } catch (error) {
      console.error(
        "Generate error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate email"
      );
    } finally {
      setGenerating(false);
    }
  }

  // Load inbox
  async function loadMessages() {
    if (
      !email ||
      !password ||
      !provider
    ) {
      return;
    }

    try {
      setLoadingMessages(true);

      const response = await fetch(
        "/api/messages",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            email,
            password,
            provider,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load inbox"
        );
      }

      setMessages(
        Array.isArray(data.messages)
          ? data.messages
          : []
      );

      setError("");
    } catch (error) {
      console.error(
        "Inbox error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inbox"
      );
    } finally {
      setLoadingMessages(false);
    }
  }

  // Automatically refresh every 5 seconds
  useEffect(() => {
    if (
      !email ||
      !password ||
      !provider
    ) {
      return;
    }

    loadMessages();

    const interval = setInterval(
      loadMessages,
      5000
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    email,
    password,
    provider,
  ]);

  // Select mailbox
  function selectMailbox(
    mailbox: Mailbox
  ) {
    setEmail(mailbox.email);
    setPassword(mailbox.password);
    setProvider(mailbox.provider);
    setMessages([]);
    setSelectedMessage(null);
    setError("");
  }

  // Delete mailbox from browser
  function deleteMailbox(
    index: number
  ) {
    const mailbox =
      mailboxes[index];

    const updated =
      mailboxes.filter(
        (_, i) => i !== index
      );

    setMailboxes(updated);

    if (
      mailbox?.email === email
    ) {
      setEmail("");
      setPassword("");
      setProvider("");
      setMessages([]);
      setSelectedMessage(null);
    }
  }

  // Preview text
  function getPreview(
    message: Message
  ) {
    const preview =
      message.intro ||
      message.text ||
      "No preview available.";

    return preview
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "40px 16px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <h1
          style={{
            textAlign: "center",
            fontSize:
              "clamp(40px, 9vw, 56px)",
            fontWeight: "800",
            letterSpacing: "-1px",
            margin:
              "10px 0 14px",
          }}
        >
          TempMail
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#555",
            fontSize: "17px",
            lineHeight: "1.5",
            marginBottom: "30px",
          }}
        >
          Create a temporary email
          address instantly.
        </p>

        {/* Generate */}
        <button
          onClick={generateEmail}
          disabled={generating}
          style={{
            display: "block",
            margin:
              "0 auto 25px",
            padding:
              "15px 32px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontSize: "17px",
            fontWeight: "600",
            cursor: generating
              ? "not-allowed"
              : "pointer",
            opacity: generating
              ? 0.6
              : 1,
          }}
        >
          {generating
            ? "Generating..."
            : "Generate Email"}
        </button>

        {/* Error */}
        {error && (
          <div
            style={{
              padding:
                "14px 16px",
              marginBottom:
                "20px",
              background:
                "#fff0f0",
              color: "#b00020",
              border:
                "1px solid #ffd0d0",
              borderRadius:
                "10px",
              textAlign:
                "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Current email */}
        {email && (
          <>
            <div
              style={{
                border:
                  "1px solid #ddd",
                borderRadius:
                  "14px",
                padding:
                  "22px 18px",
                textAlign:
                  "center",
                marginBottom:
                  "20px",
              }}
            >
              <p
                style={{
                  color: "#777",
                  fontSize: "15px",
                  margin:
                    "0 0 8px",
                }}
              >
                Your temporary
                email
              </p>

              <strong
                style={{
                  display:
                    "block",
                  fontSize: "20px",
                  lineHeight:
                    "1.4",
                  wordBreak:
                    "break-all",
                }}
              >
                {email}
              </strong>

              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      email
                    );

                    alert(
                      "Email copied!"
                    );
                  } catch {
                    alert(
                      "Copy failed."
                    );
                  }
                }}
                style={{
                  marginTop:
                    "14px",
                  padding:
                    "9px 18px",
                  background:
                    "#fff",
                  border:
                    "1px solid #ccc",
                  borderRadius:
                    "8px",
                  cursor:
                    "pointer",
                  fontSize:
                    "14px",
                }}
              >
                Copy
              </button>
            </div>

            {/* Saved mailboxes */}
            {mailboxes.length > 0 && (
              <div
                style={{
                  border:
                    "1px solid #e5e5e5",
                  borderRadius:
                    "16px",
                  padding:
                    "18px",
                  marginBottom:
                    "20px",
                  background:
                    "#fff",
                }}
              >
                <h2
                  style={{
                    margin:
                      "0 0 14px",
                    fontSize:
                      "22px",
                  }}
                >
                  My Emails
                </h2>

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: "8px",
                  }}
                >
                  {mailboxes.map(
                    (
                      mailbox,
                      index
                    ) => (
                      <div
                        key={`${mailbox.email}-${index}`}
                        style={{
                          display:
                            "flex",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() =>
                            selectMailbox(
                              mailbox
                            )
                          }
                          style={{
                            flex: 1,
                            padding:
                              "13px",
                            background:
                              mailbox.email ===
                              email
                                ? "#111"
                                : "#fff",
                            color:
                              mailbox.email ===
                              email
                                ? "#fff"
                                : "#111",
                            border:
                              "1px solid #ddd",
                            borderRadius:
                              "9px",
                            textAlign:
                              "left",
                            wordBreak:
                              "break-all",
                          }}
                        >
                          {mailbox.email}

                          {mailbox.email ===
                            email &&
                            "  (Active)"}
                        </button>

                        <button
                          onClick={() =>
                            deleteMailbox(
                              index
                            )
                          }
                          style={{
                            padding:
                              "10px",
                            background:
                              "#fff",
                            color:
                              "#c00",
                            border:
                              "1px solid #ddd",
                            borderRadius:
                              "9px",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Inbox */}
            <div
              style={{
                border:
                  "1px solid #e5e5e5",
                borderRadius:
                  "16px",
                overflow:
                  "hidden",
                background:
                  "#fafafa",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  padding:
                    "16px 18px",
                  borderBottom:
                    "1px solid #eee",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "24px",
                  }}
                >
                  Inbox
                </h2>

                <button
                  onClick={
                    loadMessages
                  }
                  disabled={
                    loadingMessages
                  }
                  style={{
                    padding:
                      "10px 18px",
                    background:
                      "#111",
                    color:
                      "#fff",
                    border:
                      "none",
                    borderRadius:
                      "10px",
                    fontWeight:
                      "600",
                    opacity:
                      loadingMessages
                        ? 0.6
                        : 1,
                  }}
                >
                  {loadingMessages
                    ? "Checking..."
                    : "Refresh"}
                </button>
              </div>

              {/* Empty inbox */}
              {messages.length ===
              0 ? (
                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "45px 20px",
                    color:
                      "#777",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "40px",
                      marginBottom:
                        "12px",
                    }}
                  >
                    ✉️
                  </div>

                  <p
                    style={{
                      fontSize:
                        "17px",
                      margin:
                        "0 0 8px",
                    }}
                  >
                    No messages yet
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize:
                        "14px",
                    }}
                  >
                    Your inbox
                    checks for new
                    messages
                    automatically.
                  </p>
                </div>
              ) : (
                <div>
                  {messages.map(
                    (message) => (
                      <button
                        key={
                          message.id
                        }
                        onClick={() =>
                          setSelectedMessage(
                            message
                          )
                        }
                        style={{
                          display:
                            "block",
                          width:
                            "100%",
                          textAlign:
                            "left",
                          padding:
                            "17px",
                          background:
                            "#fff",
                          border:
                            "none",
                          borderBottom:
                            "1px solid #eee",
                          cursor:
                            "pointer",
                        }}
                      >
                        <h3
                          style={{
                            margin:
                              "0 0 7px",
                            fontSize:
                              "17px",
                          }}
                        >
                          {message.subject ||
                            "(No subject)"}
                        </h3>

                        <p
                          style={{
                            margin:
                              "0 0 5px",
                            color:
                              "#555",
                            fontSize:
                              "14px",
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          From:{" "}
                          {message.from
                            ?.name ||
                            message.from
                              ?.address ||
                            "Unknown"}
                        </p>

                        {message.createdAt && (
                          <p
                            style={{
                              margin:
                                "0 0 8px",
                              color:
                                "#999",
                              fontSize:
                                "12px",
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
                            color:
                              "#666",
                            fontSize:
                              "14px",
                            lineHeight:
                              "1.5",
                          }}
                        >
                          {getPreview(
                            message
                          )}
                        </p>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Message popup */}
      {selectedMessage && (
        <div
          onClick={() =>
            setSelectedMessage(
              null
            )
          }
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.45)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth:
                "650px",
              maxHeight:
                "85vh",
              overflowY:
                "auto",
              background:
                "#fff",
              borderRadius:
                "16px",
              padding:
                "22px",
              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                gap: "15px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                {selectedMessage.subject ||
                  "(No subject)"}
              </h2>

              <button
                onClick={() =>
                  setSelectedMessage(
                    null
                  )
                }
                style={{
                  border:
                    "none",
                  background:
                    "#eee",
                  borderRadius:
                    "50%",
                  width: "36px",
                  height: "36px",
                  fontSize:
                    "20px",
                }}
              >
                ×
              </button>
            </div>

            <p
              style={{
                color: "#555",
                fontSize: "14px",
                marginTop:
                  "15px",
              }}
            >
              From:{" "}
              {selectedMessage.from
                ?.name ||
                selectedMessage.from
                  ?.address ||
                "Unknown"}
            </p>

            {selectedMessage.createdAt && (
              <p
                style={{
                  color:
                    "#999",
                  fontSize:
                    "12px",
                }}
              >
                {new Date(
                  selectedMessage.createdAt
                ).toLocaleString()}
              </p>
            )}

            <div
              style={{
                borderTop:
                  "1px solid #eee",
                paddingTop:
                  "18px",
                whiteSpace:
                  "pre-wrap",
                wordBreak:
                  "break-word",
                lineHeight:
                  "1.7",
                fontSize:
                  "15px",
              }}
            >
              {selectedMessage.text ||
                selectedMessage.intro ||
                "No message content available."}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
