import { TwentyQuestionsGame } from './TwentyQuestionsGame';
import { TreasureHuntGame } from './TreasureHuntGame';
import { GuessTheYearGame } from './GuessTheYearGame';
import { StoryMatchGame } from './StoryMatchGame';

export function GameContainer({ gameType, onComplete, onExit }) {
  switch (gameType) {
    case 'twenty_questions':
      return <TwentyQuestionsGame onComplete={onComplete} onExit={onExit} />;
    case 'treasure_hunt':
      return <TreasureHuntGame onComplete={onComplete} onExit={onExit} />;
    case 'guess_year':
      return <GuessTheYearGame onComplete={onComplete} onExit={onExit} />;
    case 'story_match':
      return <StoryMatchGame onComplete={onComplete} onExit={onExit} />;
    default:
      return null;
  }
}
