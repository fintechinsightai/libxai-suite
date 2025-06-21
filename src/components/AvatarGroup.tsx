// src/components/AvatarGroup.tsx - Con validaciones críticas
import React from "react";
import { User } from "../types/ganttTypes";
import MiniAvatar from "./MiniAvatar";
import styles from "../styles/MiniAvatar.module.css";

interface AvatarGroupProps {
  users: User[];
  maxVisible?: number;
  size?: "xs" | "sm" | "md";
  showNames?: boolean;
  showWorkloadIndicators?: boolean;
  userWorkloads?: { [userId: string]: number };
  onUserClick?: (user: User) => void;
  onMoreClick?: (hiddenUsers: User[]) => void;
  className?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  maxVisible = 3,
  size = "sm",
  showNames = false,
  showWorkloadIndicators = false,
  userWorkloads = {},
  onUserClick,
  onMoreClick,
  className = "",
}) => {
  // ========== VALIDACIONES CRÍTICAS ==========
  if (!users || !Array.isArray(users)) {
    console.warn("AvatarGroup: users no es un array válido:", users);
    return null;
  }

  // Filtrar usuarios válidos
  const validUsers = users.filter((user) => {
    const isValid = user && typeof user === "object" && user.id && user.name;

    if (!isValid) {
      console.warn("AvatarGroup: Usuario inválido filtrado:", user);
    }

    return isValid;
  });

  if (validUsers.length === 0) {
    console.warn("AvatarGroup: No hay usuarios válidos para mostrar");
    return null;
  }
  // ==========================================

  const visibleUsers = validUsers.slice(0, maxVisible);
  const hiddenUsers = validUsers.slice(maxVisible);
  const hasHiddenUsers = hiddenUsers.length > 0;

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoreClick) {
      onMoreClick(hiddenUsers);
    }
  };

  return (
    <div className={`${styles.avatarGroup} ${className}`}>
      {visibleUsers.map((user) => (
        <MiniAvatar
          key={user.id}
          user={user}
          size={size}
          showName={showNames}
          showWorkloadIndicator={showWorkloadIndicators}
          utilizationPercent={userWorkloads[user.id] || 0}
          onClick={onUserClick}
        />
      ))}

      {hasHiddenUsers && (
        <div
          className={`${styles.moreUsersIndicator} ${styles[size]}`}
          onClick={handleMoreClick}
          title={`+${hiddenUsers.length} usuarios más: ${hiddenUsers
            .map((u) => u.name)
            .join(", ")}`}
        >
          +{hiddenUsers.length}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
