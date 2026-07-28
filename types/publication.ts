export type PublicationIssue = { code: string; message: string; taskId?: string; field?: string };
export type PublicationReadiness = { ready: boolean; blockers: PublicationIssue[]; warnings: PublicationIssue[]; taskCount: number; supportedTaskCount: number };

export type PublicationAction = "publish" | "unpublish";
export type PublicationSuccessOutcome =
  | "published"
  | "already_published"
  | "unpublished"
  | "already_draft";
export type PublicationRpcOutcome =
  | PublicationSuccessOutcome
  | "blocked"
  | "not_found";
export type PublicationStateDto = {
  isPublic: boolean;
  outcome: PublicationSuccessOutcome;
};
export type PublicationRpcRow = {
  is_public: boolean;
  outcome: PublicationRpcOutcome;
};
export type PublicationActionResult =
  | { status: "ok"; publication: PublicationStateDto }
  | { status: "unauthorized" }
  | { status: "not_found" }
  | { status: "blocked" }
  | { status: "error" };
