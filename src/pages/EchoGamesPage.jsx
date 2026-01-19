import { PageTransition } from '../components/PageTransition';
import { Gamepad2, Trophy, Target, Zap } from 'lucide-react';

export function EchoGamesPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy-light py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-serif text-cream mb-4">Echo Games</h1>
          <p className="text-cream/60 text-lg mb-8">
            Play interactive games and learn about your family history.
          </p>
          <div className="bg-navy-dark/50 border-2 border-dashed border-gold/30 rounded-2xl p-12">
            <Trophy className="w-16 h-16 text-gold/50 mx-auto mb-4" />
            <p className="text-cream/50 mb-6">Coming soon - Gamification system in development</p>
            <button className="btn-primary">
              <Zap className="w-5 h-5 mr-2" />
              Start Playing
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
