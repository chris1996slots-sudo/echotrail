import { PageTransition } from '../components/PageTransition';
import { Sparkles, Calendar, Heart } from 'lucide-react';

export function WisdomCardsPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy-light py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gold to-amber-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-navy" />
          </div>
          <h1 className="text-5xl font-serif text-cream mb-4">Wisdom Cards</h1>
          <p className="text-cream/60 text-lg mb-8">
            Daily inspiration and wisdom from your digital legacy.
          </p>
          <div className="bg-navy-dark/50 border-2 border-dashed border-gold/30 rounded-2xl p-12">
            <Calendar className="w-16 h-16 text-gold/50 mx-auto mb-4" />
            <p className="text-cream/50 mb-6">Coming soon - Daily wisdom cards feature in development</p>
            <button className="btn-primary">
              <Heart className="w-5 h-5 mr-2" />
              View Today's Card
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
