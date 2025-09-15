import { Bot, Clock, FileText } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Processing",
      description: "Advanced AI structures your video content into professional, readable documents with proper formatting.",
      color: "primary"
    },
    {
      icon: Clock,
      title: "Real-time Progress",
      description: "Track your document generation in real-time with detailed progress updates and status notifications.",
      color: "secondary"
    },
    {
      icon: FileText,
      title: "Multiple Formats",
      description: "Generate ebooks, tutorials, guides, recipes, and more with customizable templates and styling.",
      color: "accent"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Powerful Features</h2>
          <p className="text-xl text-muted-foreground">Everything you need to transform video content into professional documents</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-xl p-8 space-y-4"
              data-testid={`feature-${index}`}
            >
              <div className={`w-12 h-12 bg-${feature.color}/10 rounded-lg flex items-center justify-center`}>
                <feature.icon className={`text-${feature.color} text-xl`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
