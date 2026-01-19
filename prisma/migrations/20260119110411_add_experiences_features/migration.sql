-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personaId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "ageAtEvent" INTEGER,
    "category" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "audioNote" TEXT,
    "avatarMessage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "echo_duets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userVideoUrl" TEXT NOT NULL,
    "userTranscript" TEXT,
    "userQuestion" TEXT,
    "avatarVideoUrl" TEXT,
    "avatarResponse" TEXT,
    "avatarEmotion" TEXT DEFAULT 'thoughtful',
    "title" TEXT,
    "topic" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "processingError" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "echo_duets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wisdom_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "quote" TEXT,
    "wisdom" TEXT,
    "cardStyle" TEXT NOT NULL DEFAULT 'default',
    "imageUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT 'gold',
    "scheduledFor" TIMESTAMP(3),
    "shownAt" TIMESTAMP(3),
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "triggerEvent" TEXT,
    "triggerDate" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wisdom_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "twentyQuestionsPlayed" INTEGER NOT NULL DEFAULT 0,
    "twentyQuestionsWon" INTEGER NOT NULL DEFAULT 0,
    "treasureHuntsCompleted" INTEGER NOT NULL DEFAULT 0,
    "guessTheYearCorrect" INTEGER NOT NULL DEFAULT 0,
    "guessTheYearPlayed" INTEGER NOT NULL DEFAULT 0,
    "cardsCollected" INTEGER NOT NULL DEFAULT 0,
    "badgesEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "questionsAsked" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "gameData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "requirementType" TEXT NOT NULL,
    "requirementValue" INTEGER NOT NULL,
    "pointsReward" INTEGER NOT NULL DEFAULT 0,
    "badgeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeline_events_userId_idx" ON "timeline_events"("userId");

-- CreateIndex
CREATE INDEX "timeline_events_eventDate_idx" ON "timeline_events"("eventDate");

-- CreateIndex
CREATE INDEX "echo_duets_userId_idx" ON "echo_duets"("userId");

-- CreateIndex
CREATE INDEX "echo_duets_status_idx" ON "echo_duets"("status");

-- CreateIndex
CREATE INDEX "wisdom_cards_userId_idx" ON "wisdom_cards"("userId");

-- CreateIndex
CREATE INDEX "wisdom_cards_scheduledFor_idx" ON "wisdom_cards"("scheduledFor");

-- CreateIndex
CREATE INDEX "wisdom_cards_isRead_idx" ON "wisdom_cards"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "game_progress_userId_key" ON "game_progress"("userId");

-- CreateIndex
CREATE INDEX "game_sessions_userId_idx" ON "game_sessions"("userId");

-- CreateIndex
CREATE INDEX "game_sessions_gameType_idx" ON "game_sessions"("gameType");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");
