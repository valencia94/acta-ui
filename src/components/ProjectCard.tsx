import { ReactNode } from 'react';

interface ProjectCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ProjectCard({ children, onClick, className = '' }: ProjectCardProps): JSX.Element {
  return (
    <div onClick={onClick} className={className}>
      {children}
    </div>
  );
}
