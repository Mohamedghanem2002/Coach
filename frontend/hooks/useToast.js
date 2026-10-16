"use client";
import { useState, useEffect, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    if (!message) {
      setToast(null);
      return;
    }
    setToast({ message, type });
  }, []);

  const setNotice = useCallback((message) => {
    if (!message) {
      setToast(null);
      return;
    }
    const isError =
      message.includes("تعذر") ||
      message.includes("خطأ") ||
      message.includes("لا يمكن") ||
      message.includes("راجع بيانات");
    showToast(message, isError ? "error" : "success");
  }, [showToast]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return {
    toast,
    setToast,
    showToast,
    setNotice,
  };
}
