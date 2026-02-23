export type DocumentTone = "peach" | "sage" | "sand";

export type ManagedDocument = {
  id: string;
  title: string;
  meta: string;
  iconKey: string;
  tone: DocumentTone;
};

export const initialDocuments: ManagedDocument[] = [
  {
    id: "1",
    title: "Project Proposal",
    meta: "Project Proposal · May 1, 2024",
    iconKey: "DocumentText",
    tone: "peach",
  },
  {
    id: "2",
    title: "SOP",
    meta: "Standard Operating Procedure · April 28, 2024",
    iconKey: "Clipboard",
    tone: "sage",
  },
  {
    id: "3",
    title: "Weekly Status Update",
    meta: "Status Update · April 25, 2024",
    iconKey: "Pencil",
    tone: "peach",
  },
  {
    id: "4",
    title: "Meeting Notes",
    meta: "Meeting Notes · April 22, 2024",
    iconKey: "DocumentText",
    tone: "sage",
  },
  {
    id: "5",
    title: "Milestone Report",
    meta: "Progress Report · April 19, 2024",
    iconKey: "ChartBar",
    tone: "sand",
  },
  {
    id: "6",
    title: "Client Feedback Summary",
    meta: "Client Feedback · April 18, 2024",
    iconKey: "Clipboard",
    tone: "peach",
  },
  {
    id: "7",
    title: "Milestone Report",
    meta: "Progress Report · April 19, 2024",
    iconKey: "ChartBar",
    tone: "sand",
  },
  {
    id: "8",
    title: "Client Feedback Summary",
    meta: "Client Feedback · April 18, 2024",
    iconKey: "Clipboard",
    tone: "peach",
  },
  {
    id: "9",
    title: "Milestone Report",
    meta: "Progress Report · April 19, 2024",
    iconKey: "ChartBar",
    tone: "sand",
  },
  {
    id: "10",
    title: "Client Feedback Summary",
    meta: "Client Feedback · April 18, 2024",
    iconKey: "Clipboard",
    tone: "peach",
  },
];
