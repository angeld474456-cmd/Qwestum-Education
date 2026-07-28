export type PublicationIssue = { code: string; message: string; taskId?: string; field?: string };
export type PublicationReadiness = { ready: boolean; blockers: PublicationIssue[]; warnings: PublicationIssue[]; taskCount: number; supportedTaskCount: number };
