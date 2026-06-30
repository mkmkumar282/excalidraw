"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Input, Button, Label } from "@repo/ui";
import { HTTP_URL } from "@/lib/api";

type AuthPageProps = {
  mode: "signin" | "signup";
};

export const AuthPage = ({ mode }: AuthPageProps) => {
  const router = useRouter();
  

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const errors: typeof formErrors = {};
    
    if (mode === "signup") {
      if (name.trim() && name.length < 3) {
        errors.name = "Name must be at least 3 characters.";
      } else if (name.length > 50) {
        errors.name = "Name must be 50 characters or less.";
      }
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = "Please enter a valid email address.";
      } else if (email.length > 100) {
        errors.email = "Email must be 100 characters or less.";
      } else if (email.length < 3) {
        errors.email = "Email must be at least 3 characters.";
      }
    }

    if (password && password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    } else if (password.length > 100) {
      errors.password = "Password must be 100 characters or less.";
    }

    setFormErrors(errors);
  }, [name, email, password, mode]);

  const isFormValid = () => {
    if (mode === "signup" && (!name || name.length < 3 || name.length > 50)) return false;
    if (!email || email.length < 3 || email.length > 100) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    if (!password || password.length < 6 || password.length > 100) return false;
    
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsLoading(true);
    setSubmitError(null);
    setSuccessMessage(null);

    const cleanHttpUrl = HTTP_URL.replace(/\/$/, "");

    if (mode === "signup") {
      try {

        await axios.post(`${cleanHttpUrl}/signup`, {
          email,
          password,
          name,
        });

        setSuccessMessage("Account created successfully! Logging you in...");
        const signinResponse = await axios.post<{ token: string }>(`${cleanHttpUrl}/signin`, {
          email,
          password,
        });

        if (signinResponse.data?.token) {
          localStorage.setItem("token", signinResponse.data.token);
          router.push("/");
        } else {
          setSubmitError("Token not received. Please sign in manually.");
          setIsLoading(false);
        }
      } catch (err: any) {
        if (axios.isAxiosError(err)) {
          setSubmitError(
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to create account. Please try again."
          );
        } else {
          setSubmitError(err.message || "Failed to create account. Please try again.");
        }
        setIsLoading(false);
      }
    } else {

      try {
        const signinResponse = await axios.post<{ token: string }>(`${cleanHttpUrl}/signin`, {
          email,
          password,
        });

        if (signinResponse.data?.token) {
          localStorage.setItem("token", signinResponse.data.token);
          setSuccessMessage("Signed in successfully!");
          router.push("/");
        } else {
          setSubmitError("Token not received. Please try again.");
          setIsLoading(false);
        }
      } catch (err: any) {
        if (axios.isAxiosError(err)) {
          setSubmitError(
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Invalid email or password."
          );
        } else {
          setSubmitError(err.message || "Invalid email or password.");
        }
        setIsLoading(false);
      }
    }
  };

  const title = mode === "signin" ? "Welcome back" : "Create your account";
  const subtitle =
    mode === "signin"
      ? "Enter your details to sign in to your whiteboard workspace"
      : "Start sketching and collaborating in real-time";
  const buttonText = mode === "signin" ? "Sign In" : "Sign Up";

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#090909] px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {}
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/50">
            <svg
              className="h-6 w-6 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white font-sans">
          {title}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400 font-sans">
          {subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0e0e0e] px-8 py-8 border border-neutral-800/80 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Name</Label>
                <div className="mt-1">
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={setName}
                    required
                  />
                  {formErrors.name && (
                    <p className="mt-1.5 text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  required
                />
                {formErrors.email && (
                  <p className="mt-1.5 text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  required
                />
                {formErrors.password && (
                  <p className="mt-1.5 text-xs text-red-500">{formErrors.password}</p>
                )}
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3 text-sm text-red-400">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-400">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={!isFormValid()}
                className="w-full justify-center"
              >
                {buttonText}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-neutral-800/80 pt-6 text-center text-sm">
            <span className="text-neutral-400">
              {mode === "signin" ? "New to Excalidraw?" : "Already have an account?"}{" "}
            </span>
            <Link
              href={mode === "signin" ? "/signup" : "/signin"}
              className="font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-150"
            >
              {mode === "signin" ? "Create an account" : "Sign in here"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
