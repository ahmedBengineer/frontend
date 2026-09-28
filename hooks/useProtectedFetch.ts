"use client";

import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

/*
 * PASSWORD PROTECTION FOR MUTATING REQUESTS
 * 
 * To ENABLE: Uncomment the code below and set ENABLED = true
 * To DISABLE: Set ENABLED = false (current state)
 * 
 * Password: "blocked"
 * Protected paths: /api/workflow-studio/agents/, /api/workflow-test/, /api/agents/agents/, /api/custom_feature/custom-features/
 * Protected methods: POST, PUT, PATCH, DELETE
 */

const ENABLED = true; // Set to true to enable password protection

// const PROTECTED_PATHS = [
//   "/api/workflow-studio/agents/",
//   "/api/workflow-test/",
//   "/api/agents/agents/",
//   "/api/custom_feature/custom-features/",
// ];

// const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export function useProtectedFetch() {
  const { toast } = useToast();
  // const passwordCache = useRef<Map<string, boolean>>(new Map());

  // const isProtectedPath = useCallback((url: string) => {
  //   if (!ENABLED) return false;
  //   try {
  //     const parsed = new URL(url, window.location.origin);
  //     return PROTECTED_PATHS.some((path) => parsed.pathname.startsWith(path));
  //   } catch {
  //     return false;
  //   }
  // }, []);

  // const promptPassword = useCallback(async (pathKey: string): Promise<boolean> => {
  //   if (!ENABLED) return true;
  //   if (passwordCache.current.get(pathKey)) return true;

  //   return new Promise((resolve) => {
  //     const password = window.prompt(
  //       `🔐 Protected action detected on ${pathKey}\nEnter password to proceed:`,
  //       ""
  //     );
      
  //     if (password === "blocked") {
  //       passwordCache.current.set(pathKey, true);
  //       toast({
  //         title: "Access Granted",
  //         description: "Protected action authorized for this session.",
  //       });
  //       resolve(true);
  //     } else {
  //       toast({
  //         title: "Access Denied",
  //         description: "Incorrect password. Action cancelled.",
  //         variant: "destructive",
  //       });
  //       resolve(false);
  //     }
  //   });
  // }, [toast]);

  const protectedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // if (ENABLED) {
      //   const url = typeof input === "string" ? input : input.toString();
      //   const method = (init?.method || "GET").toUpperCase();

      //   if (MUTATING_METHODS.includes(method) && isProtectedPath(url)) {
      //     const pathKey = PROTECTED_PATHS.find((p) => url.includes(p)) || url;
      //     const authorized = await promptPassword(pathKey);
      //     if (!authorized) {
      //       throw new Error("Protected action cancelled: incorrect password");
      //     }
      //   }
      // }

      return fetch(input, init);
    },
    // [isProtectedPath, promptPassword]
    []
  );

  return { protectedFetch };
}

export async function protectedFetchGlobal(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // if (ENABLED) {
  //   const url = typeof input === "string" ? input : input.toString();
  //   const method = (init?.method || "GET").toUpperCase();

  //   if (MUTATING_METHODS.includes(method) && PROTECTED_PATHS.some((p) => url.includes(p))) {
  //     const pathKey = PROTECTED_PATHS.find((p) => url.includes(p)) || url;
  //     const password = window.prompt(
  //       `🔐 Protected action detected on ${pathKey}\nEnter password to proceed:`,
  //       ""
  //     );
      
  //     if (password !== "blocked") {
  //       throw new Error("Protected action cancelled: incorrect password");
  //     }
  //   }
  // }

  return fetch(input, init);
}