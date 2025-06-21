// src/components/MiniAvatar.tsx - Con validaciones críticas
import React from "react";
import { User } from "../types/ganttTypes";
import styles from "../styles/MiniAvatar.module.css";

interface MiniAvatarProps {
  user: User;
  size?: "xs" | "sm" | "md";
  showName?: boolean;
  showWorkloadIndicator?: boolean;
  utilizationPercent?: number;
  onClick?: (user: User) => void;
  className?: string;
}

const MiniAvatar: React.FC<MiniAvatarProps> = ({
  user,
  size = "sm",
  showName = false,
  showWorkloadIndicator = false,
  utilizationPercent = 0,
  onClick,
  className = "",
}) => {
  // ========== VALIDACIÓN CRÍTICA ==========
  if (!user || !user.name || !user.id) {
    console.warn("MiniAvatar: Usuario inválido recibido:", user);
    return null; // No renderizar si el usuario es inválido
  }
  // =======================================

  const getWorkloadColor = (percent: number): string => {
    if (percent >= 100) return "#EF4444";
    if (percent >= 80) return "#F59E0B";
    if (percent >= 50) return "#10B981";
    return "#6B7280";
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(user);
    }
  };

  // Generar iniciales de forma segura
  const getInitials = (name: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`${styles.miniAvatarContainer} ${styles[size]} ${className}`}
      onClick={handleClick}
      title={`${user.name}${
        user.role ? ` (${user.role})` : ""
      } - ${utilizationPercent}% utilización`}
    >
      <div
        className={styles.miniAvatar}
        style={{
          backgroundColor: user.color || "#6B7280",
          borderColor: showWorkloadIndicator
            ? getWorkloadColor(utilizationPercent)
            : "transparent",
        }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className={styles.avatarImage}
            onError={(e) => {
              // Fallback si la imagen falla
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className={styles.avatarInitials}>
            {user.initials || getInitials(user.name)}
          </span>
        )}

        {showWorkloadIndicator && (
          <div
            className={styles.workloadIndicator}
            style={{ backgroundColor: getWorkloadColor(utilizationPercent) }}
          />
        )}
      </div>

      {showName && (
        <span className={styles.avatarName}>{user.name.split(" ")[0]}</span>
      )}
    </div>
  );
};

export default MiniAvatar;
