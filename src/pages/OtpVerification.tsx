// src/pages/OtpVerification.tsx
import React, { useState } from "react";
import api from "../api";
import "./OtpVerification.css";

interface OtpVerificationProps {
  sessionId: number | null;
  onVerificationSuccess: (email: string) => void;
}

function OtpVerification({
  sessionId,
  onVerificationSuccess,
}: OtpVerificationProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!sessionId) {
      setError("Session not initialized. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      // Call backend send-otp endpoint WITH email parameter
      await api.post("/api/KycSession/send-otp", {
        sessionId: sessionId,
        email: email, // ADD THIS LINE - pass the email
        otpType: 1, // 1 for email
      });

      setSuccessMessage(`✅ OTP sent to ${email}. Check your inbox.`);
      setStep("otp");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || error.message || "Failed to send OTP";
      setError(`❌ ${errorMsg}`);
      console.error("Send OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    if (!sessionId) {
      setError("Session not initialized. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      // Call backend verify-otp endpoint
      await api.post("/api/KycSession/verify-otp", {
        sessionId: sessionId,
        otpCode: otp,
        otpType: 1, // 1 for email
      });

      setSuccessMessage("✅ Email verified successfully!");
      setTimeout(() => {
        onVerificationSuccess(email);
      }, 1500);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Invalid OTP. Please try again.";
      setError(`❌ ${errorMsg}`);
      console.error("Verify OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep("email");
    setOtp("");
    setSuccessMessage("");
    setError("");
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-card">
        <div className="otp-header">
          <h1 className="otp-title">Email Verification</h1>
          <p className="otp-subtitle">
            {step === "email"
              ? "Enter your email to receive a verification code"
              : `Enter the verification code sent to ${email}`}
          </p>
        </div>

        {error && <div className="otp-error-message">{error}</div>}
        {successMessage && (
          <div className="otp-success-message">{successMessage}</div>
        )}

        <form className="otp-form">
          {step === "email" ? (
            <div className="otp-input-group">
              <label htmlFor="email" className="otp-label">
                Email Address <span style={{ color: "red" }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="otp-input"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                onClick={handleSendOtp}
                disabled={loading || !email}
                className="otp-button"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </div>
          ) : (
            <>
              <div className="otp-input-group">
                <label htmlFor="otp" className="otp-label">
                  Verification Code <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="otp-input otp-code-input"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  onClick={handleVerifyOtp}
                  disabled={loading || !otp}
                  className="otp-button"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={loading}
                className="otp-button-secondary"
              >
                ← Use Different Email
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default OtpVerification;
