import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Payment failed</CardTitle>
            <CardDescription>
              We could not confirm your payment. No subscription activation is performed from this page. Please retry checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link to="/billing">
              <Button className="gradient-primary">Retry from Billing</Button>
            </Link>
            <Link to="/plans">
              <Button variant="outline">Back to Plans</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
