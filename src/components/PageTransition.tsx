"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      setTransitioning(true);
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        prevPath.current = pathname;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitioning(false);
          });
        });
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        transitioning
          ? "opacity-0 translate-y-2 scale-[0.99]"
          : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      {displayChildren}
    </div>
  );
}
