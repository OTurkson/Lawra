import { Loader } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const sizeMap = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  return (
    <Loader
      size={sizeMap[size]}
      className={`animate-spin text-primary ${className}`}
    />
  );
}
