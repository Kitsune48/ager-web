"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

type Props = Omit<ImageProps, "onError">;

export default function ResilientImage(props: Props) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      // ts-expect-error: allow passing through sizing props
      <img
        src={typeof props.src === "string" ? props.src : ""}
        alt={props.alt ?? ""}
        className={props.className}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    );
  }

  return <Image {...props} onError={() => setBroken(true)} />;
}
