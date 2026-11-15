"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    decisionCopy,
    type ReviewDecision,
    type ReviewRecord,
} from "./review-records";
import styles from "./review-details.module.css";

export function ReviewActions({
    row,
    busy,
    error,
    onUpdate,
}: {
    row: ReviewRecord;
    busy: boolean;
    error: string;
    onUpdate: (decision: ReviewDecision, reason: string) => Promise<boolean>;
}) {
    const [reason, setReason] = useState("");
    const [decision, setDecision] = useState<ReviewDecision | null>(null);
    const confirmation = useRef<HTMLDivElement>(null);
    const application = "businessName" in row;
    const seller = "name" in row;
    const canReview =
        application && ["pending", "more-info"].includes(row.status);
    useEffect(() => {
        if (decision) confirmation.current?.focus();
    }, [decision]);
    if (!canReview && !seller) return null;
    const maxLength = application ? 2000 : 1000;
    const needsReason = decision === "more-info" || decision === "rejected";
    const reasonValid =
        reason.trim().length <= maxLength &&
        (!needsReason || reason.trim().length >= 5);
    const reasonId = `review-reason-${row.id}`;
    const hintId = `review-hint-${row.id}`;
    async function confirm() {
        if (!decision || !reasonValid || busy) return;
        if (await onUpdate(decision, reason.trim())) {
            setDecision(null);
            setReason("");
        }
    }
    return (
        <section
            className={styles.actions}
            aria-label={application ? "Application decision" : "Seller access"}
        >
            <div className={styles.sectionHeading}>
                <h3>
                    {application ? "Review decision" : "Manage selling access"}
                </h3>
                <p>
                    {application
                        ? "Review the details above before making a decision."
                        : "Changes apply to the seller’s store access."}
                </p>
            </div>
            <label className={styles.label} htmlFor={reasonId}>
                Message to {application ? "applicant" : "seller"}{" "}
                <span>{needsReason ? "(required)" : "(optional)"}</span>
            </label>
            <textarea
                id={reasonId}
                aria-describedby={hintId}
                className={styles.textarea}
                value={reason}
                maxLength={maxLength}
                disabled={busy}
                rows={3}
                placeholder={
                    application
                        ? "Explain the decision or ask for the details you need…"
                        : "Explain why selling access is changing…"
                }
                onChange={(event) => setReason(event.target.value)}
            />
            <div id={hintId} className={styles.fieldHint}>
                <span>
                    Visible to the{" "}
                    {application
                        ? "applicant. Requests and rejections need at least 5 characters."
                        : "seller."}
                </span>
                <span>
                    {reason.length}/{maxLength}
                </span>
            </div>
            {error && (
                <p role="alert" className={styles.error}>
                    {error}
                </p>
            )}
            {decision ? (
                <div
                    ref={confirmation}
                    tabIndex={-1}
                    className={styles.confirmation}
                    aria-busy={busy}
                >
                    <h4>{decisionCopy[decision].title}</h4>
                    <p>{decisionCopy[decision].description}</p>
                    <div className={styles.buttonRow}>
                        <Button
                            disabled={busy || !reasonValid}
                            variant={
                                decision === "rejected" ||
                                decision === "suspended"
                                    ? "destructive"
                                    : "default"
                            }
                            onClick={() => void confirm()}
                        >
                            {busy
                                ? "Saving decision…"
                                : decisionCopy[decision].label}
                        </Button>
                        <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => setDecision(null)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className={styles.buttonRow}>
                    {application ? (
                        <>
                            <Button
                                disabled={busy}
                                onClick={() => setDecision("approved")}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => setDecision("more-info")}
                            >
                                Request information
                            </Button>
                            <Button
                                variant="ghost"
                                className={styles.dangerAction}
                                disabled={busy}
                                onClick={() => setDecision("rejected")}
                            >
                                Reject
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant={
                                row.status === "active" ? "outline" : "default"
                            }
                            disabled={busy}
                            onClick={() =>
                                setDecision(
                                    row.status === "active"
                                        ? "suspended"
                                        : "active",
                                )
                            }
                        >
                            {row.status === "active"
                                ? "Suspend seller"
                                : "Reactivate seller"}
                        </Button>
                    )}
                </div>
            )}
        </section>
    );
}
