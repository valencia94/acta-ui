import { ReactNode } from 'react';

interface ProjectCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ProjectCard({ children, onClick, className = '' }: ProjectCardProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`glass-card elevated p-8 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      {children}
    </div>
  );
}
