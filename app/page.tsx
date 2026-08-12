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
const [mailboxes, setMailboxes] = useState<
  {
    email: string;
    password: string;
    provider: string;
  }[]
>([]);

useEffect(() => {
  const saved = localStorage.getItem("temp-mailboxes");

  if (saved) {
    try {
      setMailboxes(JSON.parse(saved));
    } catch {
      localStorage.removeItem("temp-mailboxes");
    }
  }
}, []);
    useEffect(() => {
  localStorage.setItem("tempmail-mailboxes", JSON.stringify(mailboxes));
}, [mailboxes]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] =
    useState<Message | null>(null);

  const [generating, setGenerating] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  
  
  useEffect(() => {
  if (typeof window === "undefined") return;

  const savedMailboxes = localStorage.getItem("tempmail_mailboxes");

  try {
    if (!savedMailboxes) return;

    const mailboxes = JSON.parse(savedMailboxes);

    if (!Array.isArray(mailboxes)) return;

    setMailboxes(mailboxes);

    const mailbox = mailboxes[mailboxes.length - 1];

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
    console.error(
      "Failed to restore mailboxes:",
      error
    );

    if (typeof window !== "undefined") {
      localStorage.removeItem("tempmail_mailboxes");
    }
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
      setSelectedMessage(null);

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

      setEmail(data.email);
      setPassword(data.password);
      setProvider(data.provider);

      const savedMailboxes =
  JSON.parse(
    localStorage.getItem("tempmail_mailboxes") || "[]"
  );
setMailboxes(savedMailboxes);
savedMailboxes.push({
  email: data.email,
  password: data.password,
  provider: data.provider,
});

localStorage.setItem(
  "tempmail_mailboxes",
  JSON.stringify(savedMailboxes)
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
    if (!email || !password || !provider) return;

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
    if (!email || !password || !provider) return;

    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [email, password, provider]);

  // Create a short, clean preview
  function getPreview(message: Message) {
    const preview =
      message.intro ||
      message.text ||
      "No preview available.";

    return preview
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
  }

  return ( function deleteMailbox(index: number) {
  const updatedMailboxes = mailboxes.filter(
    (_, i) => i !== index
  );

  setMailboxes(updatedMailboxes);

  localStorage.setItem(
    "tempmail_mailboxes",
    JSON.stringify(updatedMailboxes)
  );

  if (mailboxes[index]?.email === email) {
    setEmail("");
    setPassword("");
    setProvider("");
    setMessages([]);
    setSelectedMessage(null);
  }
  }
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "40px 16px",
        fontFamily: "Arial, sans-serif",
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
  fontSize: "clamp(40px, 9vw, 56px)",
  fontWeight: "800",
  letterSpacing: "-1px",
  margin: "10px 0 14px",
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
          Create a temporary email address instantly.
        </p>

        {/* Generate button */}
        <button
          onClick={generateEmail}
          disabled={generating}
          style={{
            display: "block",
            margin: "0 auto 25px",
            padding: "15px 32px",
background: "#111",
borderRadius: "12px",
fontSize: "17px",
            fontWeight: "600",
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

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "14px 16px",
              marginBottom: "20px",
              background: "#fff0f0",
              color: "#b00020",
              border: "1px solid #ffd0d0",
              borderRadius: "10px",
              textAlign: "center",
              lineHeight: "1.4",
            }}
          >
            {error}
          </div>
        )}

        {email && (
          <>
            {/* Email address card */}
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "14px",
                padding: "22px 18px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  color: "#777",
                  fontSize: "15px",
                  margin: "0 0 8px",
                }}
              >
                Your temporary email
              </p>

              <strong
                style={{
                  display: "block",
                  fontSize: "20px",
                  lineHeight: "1.4",
                  wordBreak: "break-all",
                }}
              >
                {email}
              </strong>

              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(email);
                    alert("Email copied!");
                  } catch {
                    alert(
                      "Copy failed. Please copy the email manually."
                    );
                  }
                }}
                style={{
                  marginTop: "14px",
                  padding: "9px 18px",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Copy
              </button>
            </div>

            {/* Inbox */}
            <div
              style={{
  border: "1px solid #e5e5e5",
  borderRadius: "16px",
  overflow: "hidden",
  background: "#fafafa",
}}
              >
        
              {/* Inbox header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 18px",
                  borderBottom: "1px solid #eee",
                }}
              > {/* My Emails */}
{mailboxes.length > 0 && (
  <div
    style={{
  border: "1px solid #e5e5e5",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
  background: "#fff",
}}
            setEmail(mailbox.email);
            setPassword(mailbox.password);
            setProvider(mailbox.provider);
            setMessages([]);
            setSelectedMessage(null);
          }}
          style={{
            width: "100%",
            padding: "14px 16px",
background: "#fff",
border: "1px solid #e5e5e5",
borderRadius: "10px",
fontSize: "15px",
            wordBreak: "break-all",
          }}
        >
          {mailbox.email}
          {mailbox.email === email && "  (Active)"}
        </button>
      ))}
    </div>
  </div>
)}
                <h2
                  style={{
  margin: 0,
  fontSize: "24px",
  fontWeight: "700",
}}
                  
                >
                  Inbox
                </h2>

                <button
                  onClick={loadMessages}
                  disabled={loadingMessages}
                  style={{
                    padding: "10px 18px",
background: "#111",
color: "#fff",
border: "none",
borderRadius: "10px",
fontSize: "15px",
fontWeight: "600",
                    cursor: loadingMessages ? 
                   "not-allowed"   : "pointer",
                    opacity: loadingMessages ? 0.6 : 1,
                  }}
                >
                  {loadingMessages
                    ? "Loading..."
                    : "Refresh"}
                </button>
              </div>

              {/* Empty inbox */}
              {messages.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#777",
                  }}
                >
                  <p
                    style={{
                      fontSize: "17px",
                      margin: "0 0 8px",
                    }}
                  >
                    No messages yet.
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                    }}
                  >
                    This inbox checks for new messages
                    automatically.
                  </p>
                </div>
              ) : (
                /* Message list */
                <div>
                {mailboxes.map((mailbox, index) => (
  <div
    key={`${mailbox.email}-${index}`}
    style={{
      display: "flex",
      gap: "8px",
      alignItems: "stretch",
    }}
  >
    <button
      onClick={() => {
        setEmail(mailbox.email);
        setPassword(mailbox.password);
        setProvider(mailbox.provider);
        setMessages([]);
        setSelectedMessage(null);
      }}
      style={{
        flex: 1,
        padding: "14px 16px",
        background: "#fff",
        color: "#111",
        border: "1px solid #e5e5e5",
        borderRadius: "10px",
        fontSize: "15px",
        wordBreak: "break-all",
      }}
    >
      {mailbox.email}
      {mailbox.email === email && " (Active)"}
    </button>

    <button
      onClick={() => deleteMailbox(index)}
      style={{
        padding: "10px 14px",
        background: "#fff",
        color: "#d00",
        border: "1px solid #ddd",
        borderRadius: "10px",
        fontSize: "14px",
        flexShrink: 0,
      }}
    >
      Delete
    </button>
  </div>
))}
                          margin: "0 0 7px",
                          fontSize: "17px",
                          lineHeight: "1.4",
                          fontWeight: "600",
                        }}
                      >
                        {message.subject ||
                          "(No subject)"}
                      </h3>

                      {/* Sender */}
                      <p
                        style={{
                          margin: "0 0 5px",
                          color: "#555",
                          fontSize: "14px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        From:{" "}
                        {message.from?.name ||
                          message.from?.address ||
                          "Unknown"}
                      </p>

                      {/* Date */}
                      {message.createdAt && (
                        <p
                          style={{
                            margin: "0 0 9px",
                            color: "#999",
                            fontSize: "12px",
                          }}
                        >
                          {new Date(
                            message.createdAt
                          ).toLocaleString()}
                        </p>
                      )}

                      {/* Preview */}
                      <p
                        style={{
                          margin: 0,
                          color: "#666",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {getPreview(message)}
                        {(message.intro ||
                          message.text ||
                          "").length > 140
                          ? "..."
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Full message popup */}
      {selectedMessage && (
        <div
          onClick={() => setSelectedMessage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              maxWidth: "650px",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "16px",
              padding: "22px",
              boxSizing: "border-box",
            }}
          >
            {/* Popup header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "21px",
                  lineHeight: "1.4",
                }}
              >
                {selectedMessage.subject ||
                  "(No subject)"}
              </h2>

              <button
                onClick={() =>
                  setSelectedMessage(null)
                }
                style={{
                  border: "none",
                  background: "#eee",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "20px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Sender */}
            <p
              style={{
                margin: "0 0 6px",
                color: "#555",
                fontSize: "14px",
              }}
            >
              From:{" "}
              {selectedMessage.from?.name ||
                selectedMessage.from?.address ||
                "Unknown"}
            </p>

            {/* Date */}
            {selectedMessage.createdAt && (
              <p
                style={{
                  margin: "0 0 18px",
                  color: "#999",
                  fontSize: "12px",
                }}
              >
                {new Date(
                  selectedMessage.createdAt
                ).toLocaleString()}
              </p>
            )}

            {/* Full message */}
            <div
              style={{
                borderTop: "1px solid #eee",
                paddingTop: "18px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: "1.7",
                fontSize: "15px",
                color: "#222",
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
