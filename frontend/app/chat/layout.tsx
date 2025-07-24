import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat - ChronoChat",
  description: "Continue your conversation in ChronoChat",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
