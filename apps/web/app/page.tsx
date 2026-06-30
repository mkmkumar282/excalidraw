"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [Slug, setSlug] = useState("");


  return (
    <div className={styles.page}>
      <div>
        <input type="text" value={Slug} onChange={(e) => setSlug(e.target.value)} placeholder="Enter canvas room slug" />
        <button onClick={() => {
          router.push(`/canvas-room/${Slug}`);
        }}>Join Canvas</button>
      </div>
      <div>
      </div>
    </div>
  );
}
