import React, { useEffect, useMemo } from "react";

export default function Toast({
  message,
  onClose,
  duration = 2500,
  variant = "info",
  onClick,
}) {
  const tone = useMemo(() => {
    const variants = {
      info: "bg-slate-900 text-white",
      success: "bg-green-600 text-white",
      warning: "bg-orange-600 text-white",
    };
    return variants[variant] || variants.info;
  }, [variant]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    onClose();
  };

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 drop-shadow-2xl">
      <button
        type="button"
        onClick={handleClick}
        className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium tracking-wide ${tone} ${onClick ? "cursor-pointer hover:opacity-90 transition" : ""}`}
      >
        {message}
      </button>
    </div>
  );
}
