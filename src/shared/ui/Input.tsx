// Input Component Placeholder
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      {...props}
      className={className}
      style={{
        outline: "none",
        transition: "box-shadow 0.2s ease",
      }}
      onFocus={(e) =>
        (e.currentTarget.style.boxShadow =
          "0 0 0 3px rgba(243,138,115,0.25)")
      }
      onBlur={(e) =>
        (e.currentTarget.style.boxShadow = "none")
      }
    />
  );
};

