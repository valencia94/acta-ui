// src/components/Counter/types.ts

/** Props for the Counter component */
export interface CounterProps {
  /** The numeric value to display */
  value: number;
  /** Optional HTML id attribute (defaults to "counter") */
  id?: string;
  /** Additional CSS class names */
  className?: string;
}
