"use client";

import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const PROTECTED_PATHS = [
  "/api/workflow-studio/agents/",
  "/api/workflow-test/",
  "/agents/agents/",
  "/custom_feature/custom-features/",
];

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export function useProtectedFetch() {
  const { toast } = useToast();
  const passwordCache = useRef<Map<string, boolean>>(new Map());

  const isProtectedPath = useCallback((url: string) => {
    try {
      const parsed = new URL(url, window.location.origin);
      const result = PROTECTED_PATHS.some((path) => parsed.pathname.startsWith(path));
      console.log("[isProtectedPath]", url, "->", parsed.pathname, "->", result);
      return result;
    } catch {
      console.log("[isProtectedPath] Failed to parse URL:", url);
      return false;
    }
  }, []);

  const promptPassword = useCallback(async (pathKey: string): Promise<boolean> => {
    if (passwordCache.current.get(pathKey)) {
      console.log("[promptPassword] Cached authorization for:", pathKey);
      return true;
    }

    console.log("[promptPassword] Prompting for password for:", pathKey);

    return new Promise((resolve) => {
      const password = window.prompt(
        `🔐 Protected action detected on ${pathKey}\nEnter password to proceed:`,
        ""
      );
      
      console.log("[promptPassword] Password entered:", password === "blocked" ? "correct" : "incorrect/empty");

      if (password === "blocked") {
        passwordCache.current.set(pathKey, true);
        toast({
          title: "Access Granted",
          description: "Protected action authorized for this session.",
        });
        resolve(true);
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect password. Action cancelled.",
          variant: "destructive",
        });
        resolve(false);
      }
    });
  }, [toast]);

  const protectedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method || "GET").toUpperCase();

      console.log("[protectedFetch]", method, url);

      if (MUTATING_METHODS.includes(method) && isProtectedPath(url)) {
        const pathKey = PROTECTED_PATHS.find((p) => url.includes(p)) || url;
        console.log("[protectedFetch] Protected path matched:", pathKey);
        const authorized = await promptPassword(pathKey);
        if (!authorized) {
          throw new Error("Protected action cancelled: incorrect password");
        }
      }

      return fetch(input, init);
    },
    [isProtectedPath, promptPassword]
  );

  return { protectedFetch };
}

export async function protectedFetchGlobal(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === "string" ? input : input.toString();
  const method = (init?.method || "GET").toUpperCase();

  console.log("[protectedFetchGlobal]", method, url);

  if (MUTATING_METHODS.includes(method) && PROTECTED_PATHS.some((p) => url.includes(p))) {
    const pathKey = PROTECTED_PATHS.find((p) => url.includes(p)) || url;
    console.log("[protectedFetchGlobal] Protected path matched:", pathKey);
    const password = window.prompt(
      `🔐 Protected action detected on ${pathKey}\nEnter password to proceed:`,
      ""
    );
    console.log("[protectedFetchGlobal] Password entered:", password === "blocked" ? "correct" : "incorrect/empty");
    
    if (password !== "blocked") {
      throw new Error("Protected action cancelled: incorrect password");
    }
  }

  return fetch(input, init);
}