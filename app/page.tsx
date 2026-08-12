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
      const savedMailbox =
        localStorage.getItem("tempmail_mailbox");

      if (!savedMailbox) return;

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
      console
