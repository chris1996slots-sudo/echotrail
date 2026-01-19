import { PageTransition } from '../components/PageTransition';
import { Video, Upload, Sparkles } from 'lucide-react';

export function EchoDuetPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy-light py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-serif text-cream mb-4">Echo Duet</h1>
          <p className="text-cream/60 text-lg mb-8">
            Record a video message and get a personalized response from your avatar.
          </p>
          <div className="bg-navy-dark/50 border-2 border-dashed border-gold/30 rounded-2xl p-12">
            <Upload className="w-16 h-16 text-gold/50 mx-auto mb-4" />
            <p className="text-cream/50 mb-6">Coming soon - Video duet feature in development</p>
            <button className="btn-primary">
              <Sparkles className="w-5 h-5 mr-2" />
              Upload Video
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
