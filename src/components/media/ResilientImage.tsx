"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

type Props = Omit<ImageProps, "onError"> & { alt: string };

export default function ResilientImage(props: Props) {
  const [broken, setBroken] = useState(false);
  const { alt, ...imageProps } = props;

  if (broken) {
    return (
      // ts-expect-error: allow passing through sizing props
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={typeof imageProps.src === "string" ? imageProps.src : ""}
        alt={alt}
        className={imageProps.className}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    );
  }

  return <Image {...imageProps} alt={alt} onError={() => setBroken(true)} />;
}
