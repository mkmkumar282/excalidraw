import { AuthPage } from "@/components/AuthPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Excalidraw",
  description: "Sign in to your Excalidraw account to access and collaborate on your workspaces.",
};

export default function SignIn() {
  return <AuthPage mode="signin" />;
}
