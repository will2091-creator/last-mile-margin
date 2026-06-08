import { useEffect, useRef, useState } from "react";

// Browser Web Speech API — Chrome/Edge/Safari expose it (often prefixed). No network,
// no backend: the device transcribes on-device/cloud per the browser. Returns null where
// unsupported so callers can degrade gracefully (e.g. hide the mic button).
export function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// useSpeechToText({ onFinalResult }) — push-to-talk dictation.
// onFinalResult(text) fires with each finalized chunk; `interim` holds the live partial.
export function useSpeechToText({ onFinalResult, lang = "en-US" } = {}) {
  const SpeechRecognition = getSpeechRecognition();
  const supported = Boolean(SpeechRecognition);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const onFinalRef = useRef(onFinalResult);

  useEffect(() => {
    onFinalRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    if (!supported) return undefined;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText.trim()) {
        onFinalRef.current?.(finalText.trim());
        setInterim("");
      } else {
        setInterim(interimText);
      }
    };
    recognition.onerror = (event) => {
      // "no-speech"/"aborted" are benign; surface only real blockers (e.g. not-allowed).
      if (event?.error && event.error !== "no-speech" && event.error !== "aborted") {
        setError(event.error === "not-allowed" ? "Microphone access was blocked." : "Voice input hit an error.");
      }
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.stop();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    };
  }, [supported, lang, SpeechRecognition]);

  const start = () => {
    if (!supported || listening) return;
    setError("");
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch {
      /* start() throws if already started — ignore */
    }
  };

  const stop = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
    setInterim("");
  };

  const toggle = () => (listening ? stop() : start());

  return { supported, listening, interim, error, start, stop, toggle };
}
