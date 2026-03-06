import type { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
};

// Modal Component Placeholder
export default function Modal({ children }: ModalProps) {
  return <div className="modal">{children}</div>;
}
