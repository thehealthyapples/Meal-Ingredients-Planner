import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ImportRecipePage() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/meals"); }, [setLocation]);
  return null;
}
