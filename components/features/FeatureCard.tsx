import { Card } from "@/components/ui/Card";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card glass glow="purple" className="group hover:-translate-y-1">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-h3 font-semibold text-brand-white mb-2">{title}</h3>
      <p className="text-body text-brand-text-muted">{description}</p>
    </Card>
  );
}
