import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Payment received</CardTitle>
            <CardDescription>
              Your payment is being verified. Final subscription activation happens only after secure webhook confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link to="/billing">
              <Button className="gradient-primary">Go to Billing</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
