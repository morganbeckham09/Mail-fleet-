"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");

  async function generateEmail() {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate email");
      }

      setEmail(data.email);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>TempMail</h1>

      <p>Create a temporary email address instantly.</p>

      <button
        onClick={generateEmail}
        style={{
          padding: "15px 30px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
        }}
      >
        Generate Email
      </button>

      {email && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
          }}
        >
          <p>Your temporary email:</p>
          <strong>{email}</strong>
        </div>
      )}
    </main>
  );
}
