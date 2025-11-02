// src/components/ui/sonner.jsx
import React from "react"
import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light" // Domyślny motyw, dostosuje się do CSS .dark
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "!bg-destructive !text-destructive-foreground !border-destructive",
          success: "!bg-emerald-600 !text-white !border-emerald-700",
          warning: "!bg-yellow-500 !text-yellow-900 !border-yellow-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
