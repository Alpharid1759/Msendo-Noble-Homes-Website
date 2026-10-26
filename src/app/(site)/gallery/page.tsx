// src/app/(site)/gallery/page.tsx
import { redirect } from "next/navigation";

export default function GalleryIndex() {
  redirect("/gallery/photos/for-sale");
}
