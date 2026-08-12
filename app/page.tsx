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
      const response = await fetch("/api/generate");

      const data = await response.json();

      if (!response.ok) {
      throw new Error(
  data.details
    ? `${data.error}: ${data.details}`
    : data.error || "Failed to generate email"
);

      setEmail(data.email);
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
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-500">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
