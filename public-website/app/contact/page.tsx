import type { Metadata } from "next";
import { buildPageMetadata } from "../libs/metadata";
import ContactClient from "./contact-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Talk to Ablelytics about pricing, demos, and support.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactClient />;
}
