import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
  cta,
}: PricingCardProps) {
  return (
    <Card
      glass
      glow={highlighted ? "purple" : null}
      className={`flex flex-col ${highlighted ? "ring-2 ring-brand-purple" : ""}`}
    >
      {highlighted && (
        <Badge variant="purple" className="mb-3 w-fit">
          Most Popular
        </Badge>
      )}
      <h3 className="text-h3 font-semibold text-brand-white mb-1">{name}</h3>
      <p className="text-brand-text-muted text-sm mb-4">{description}</p>

      <div className="mb-6">
        <span className="text-4xl font-bold text-brand-white">{price}</span>
        {price !== "Custom" && (
          <span className="text-brand-text-muted text-sm ml-2">/month</span>
        )}
      </div>

      <Button
        variant={highlighted ? "primary" : "ghost"}
        size="lg"
        className="mb-6 w-full"
      >
        {cta}
      </Button>

      <div className="space-y-3 flex-1">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-brand-teal mt-1">✓</span>
            <span className="text-body text-brand-white">{feature}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
