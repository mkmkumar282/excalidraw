import { AuthPage } from "@/components/AuthPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Excalidraw",
  description: "Create an Excalidraw account to start drawing and collaborating with your team in real time.",
};

export default function SignUp() {
  return <AuthPage mode="signup" />;
}
