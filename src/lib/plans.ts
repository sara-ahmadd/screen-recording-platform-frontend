export function isFreePlan(plan: any): boolean {
  return (
    String(plan?.name || "").toLowerCase() === "free" ||
    (Number(plan?.monthlyPrice || 0) === 0 && Number(plan?.yearlyPrice || 0) === 0)
  );
}
